import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';
import { AuditAction } from '@task-manager/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>
  ) {}

  // create audit log entry
  async log(params: {
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    // console.log('audit log:', params.action, params.resource);
    const entry = this.auditRepo.create({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
    });
    return this.auditRepo.save(entry);
  }

  // get audit logs for org and child orgs
  async findAll(organizationId: string, childOrgIds: string[]): Promise<AuditLog[]> {
    const orgIds = [organizationId, ...childOrgIds];
    // limit to 200 for now, can add pagination later
    const limit = 200;

    return this.auditRepo
      .createQueryBuilder('audit')
      .innerJoin('audit.user', 'user')
      .where('user.organization_id IN (:...orgIds)', { orgIds })
      .orderBy('audit.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }
}
