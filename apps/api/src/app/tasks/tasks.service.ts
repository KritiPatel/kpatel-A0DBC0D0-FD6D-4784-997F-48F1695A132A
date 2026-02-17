import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities';
import { OrganizationService } from '../organizations/organization.service';
import { AuditService } from '../audit/audit.service';
import {
  Role,
  AuditAction,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  ReorderTaskDto,
} from '@task-manager/data';

interface RequestUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    private readonly orgService: OrganizationService,
    private readonly auditService: AuditService
  ) {}

  // helper to get orgs user can access
  private async getAccessibleOrgIds(user: RequestUser): Promise<string[]> {
    const orgIds = [user.organizationId];
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      const childIds = await this.orgService.getChildOrgIds(user.organizationId);
      orgIds.push(...childIds);
    }
    return orgIds;
  }

  async create(taskData: CreateTaskDto, user: RequestUser, ip?: string): Promise<Task> {
    // console.log('create task called', taskData);
    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    // get max position for ordering
    const maxPosition = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.organization_id = :orgId', { orgId: user.organizationId })
      .andWhere('task.status = :status', { status: taskData.status || 'todo' })
      .select('MAX(task.position)', 'max')
      .getRawOne();

    const task = this.taskRepo.create({
      ...taskData,
      position: taskData.position ?? ((maxPosition?.max ?? -1) + 1),
      userId: user.id,
      organizationId: user.organizationId,
    });

    const saved = await this.taskRepo.save(task);
    // console.log('task saved:', saved.id);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.CREATE,
      resource: 'task',
      resourceId: saved.id,
      details: `Created task: ${saved.title}`,
      ipAddress: ip,
    });

    return saved;
  }

  async findAll(user: RequestUser, filters?: TaskFilterDto): Promise<Task[]> {
    // console.log('findAll filters:', filters);
    const orgIds = await this.getAccessibleOrgIds(user);

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.organization_id IN (:...orgIds)', { orgIds });

    // apply filters if provided
    if (filters?.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.category) {
      qb.andWhere('task.category = :category', { category: filters.category });
    }
    if (filters?.priority) {
      qb.andWhere('task.priority = :priority', { priority: filters.priority });
    }
    if (filters?.search) {
      qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const sortBy = filters?.sortBy || 'position';
    const sortOrder = filters?.sortOrder || 'ASC';
    qb.orderBy(`task.${sortBy}`, sortOrder);

    return qb.getMany();
  }

  async findOne(id: string, user: RequestUser): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignee'],
    });
    if (!task) throw new NotFoundException('Task not found');

    // check if user has access to this task's org
    const orgIds = await this.getAccessibleOrgIds(user);
    if (!orgIds.includes(task.organizationId)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: RequestUser, ip?: string): Promise<Task> {
    const task = await this.findOne(id, user);
    // console.log('updating task:', id);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot edit tasks');
    }

    // admins can only edit their own org tasks
    if (user.role === Role.ADMIN && task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Admins can only edit tasks in their own organization');
    }

    Object.assign(task, dto);
    const saved = await this.taskRepo.save(task);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.UPDATE,
      resource: 'task',
      resourceId: saved.id,
      details: `Updated task: ${saved.title}`,
      ipAddress: ip,
    });

    return saved;
  }

  async remove(id: string, user: RequestUser, ip?: string): Promise<void> {
    const task = await this.findOne(id, user);
    const taskTitle = task.title; // save title before delete

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }
    if (user.role === Role.ADMIN && task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Admins can only delete tasks in their own organization');
    }

    // log before deleting
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DELETE,
      resource: 'task',
      resourceId: task.id,
      details: `Deleted task: ${taskTitle}`,
      ipAddress: ip,
    });

    await this.taskRepo.remove(task);
  }

  // reorder task position or change status
  reorder = async (dto: ReorderTaskDto, user: RequestUser): Promise<Task> => {
    const task = await this.findOne(dto.taskId, user);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot reorder tasks');
    }

    if (dto.newStatus) {
      task.status = dto.newStatus;
    }
    task.position = dto.newPosition;

    return this.taskRepo.save(task);
  };
}
