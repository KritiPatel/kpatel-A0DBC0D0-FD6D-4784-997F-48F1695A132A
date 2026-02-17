import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { OrganizationService } from '../organizations/organization.service';
import { AuditService } from '../audit/audit.service';
import { Task } from '../entities';
import { Role, TaskStatus, TaskCategory, TaskPriority } from '@task-manager/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: any;
  let orgService: any;
  let auditService: any;

  const ownerUser = { id: 'u1', email: 'owner@test.com', role: Role.OWNER, organizationId: 'org1' };
  const adminUser = { id: 'u2', email: 'admin@test.com', role: Role.ADMIN, organizationId: 'org1' };
  const viewerUser = { id: 'u3', email: 'viewer@test.com', role: Role.VIEWER, organizationId: 'org1' };
  const childAdminUser = { id: 'u4', email: 'admin@child.com', role: Role.ADMIN, organizationId: 'org2' };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: TaskPriority.HIGH,
    position: 0,
    userId: 'u1',
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockTask]),
    };

    taskRepo = {
      create: jest.fn((dto: any) => ({ ...dto, id: 'new-task' })),
      save: jest.fn((task: any) => Promise.resolve({ ...mockTask, ...task })),
      findOne: jest.fn(),
      remove: jest.fn(() => Promise.resolve()),
      createQueryBuilder: jest.fn(() => qb),
    };

    orgService = {
      getChildOrgIds: jest.fn().mockResolvedValue(['org2']),
      isParentOrSame: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      log: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: OrganizationService, useValue: orgService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create task for Owner', async () => {
      const result = await service.create(
        { title: 'New Task', category: TaskCategory.WORK },
        ownerUser
      );
      expect(result.title).toBe('New Task');
      expect(taskRepo.create).toHaveBeenCalled();
      expect(taskRepo.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resource: 'task' })
      );
    });

    it('should create task for Admin', async () => {
      const result = await service.create({ title: 'Admin Task' }, adminUser);
      expect(result.title).toBeDefined();
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('should deny Viewer from creating tasks', async () => {
      await expect(
        service.create({ title: 'Viewer Task' }, viewerUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return tasks for users org and child orgs (Owner)', async () => {
      const tasks = await service.findAll(ownerUser);
      expect(tasks).toBeDefined();
      expect(orgService.getChildOrgIds).toHaveBeenCalledWith('org1');
    });

    it('should return tasks for users org and child orgs (Admin)', async () => {
      const tasks = await service.findAll(adminUser);
      expect(tasks).toBeDefined();
      expect(orgService.getChildOrgIds).toHaveBeenCalledWith('org1');
    });

    it('should NOT include child orgs for Viewer', async () => {
      await service.findAll(viewerUser);
      expect(orgService.getChildOrgIds).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return task if user has access', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      const task = await service.findOne('task-1', ownerUser);
      expect(task.id).toBe('task-1');
    });

    it('should throw NotFoundException if task does not exist', async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', ownerUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no org access', async () => {
      taskRepo.findOne.mockResolvedValue({ ...mockTask, organizationId: 'other-org' });
      orgService.getChildOrgIds.mockResolvedValue([]);

      await expect(service.findOne('task-1', viewerUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow Owner to update any task in accessible orgs', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      const result = await service.update('task-1', { title: 'Updated' }, ownerUser);
      expect(result.title).toBe('Updated');
    });

    it('should deny Viewer from updating tasks', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      await expect(
        service.update('task-1', { title: 'Updated' }, viewerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny Admin from updating tasks in child orgs', async () => {
      taskRepo.findOne.mockResolvedValue({ ...mockTask, organizationId: 'org2' });
      orgService.getChildOrgIds.mockResolvedValue(['org2']);

      await expect(
        service.update('task-1', { title: 'Updated' }, adminUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should log audit entry on update', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      await service.update('task-1', { title: 'Updated' }, ownerUser);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', resource: 'task' })
      );
    });
  });

  describe('remove', () => {
    it('should allow Owner to delete tasks', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      await service.remove('task-1', ownerUser);
      expect(taskRepo.remove).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', resource: 'task' })
      );
    });

    it('should deny Viewer from deleting tasks', async () => {
      taskRepo.findOne.mockResolvedValue(mockTask);
      await expect(service.remove('task-1', viewerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should deny Admin from deleting tasks in child orgs', async () => {
      taskRepo.findOne.mockResolvedValue({ ...mockTask, organizationId: 'org2' });
      orgService.getChildOrgIds.mockResolvedValue(['org2']);

      await expect(service.remove('task-1', adminUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
