import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '@task-manager/auth';
import { Role } from '@task-manager/data';
import { OrganizationService } from '../organizations/organization.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly orgService: OrganizationService
  ) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async getAuditLogs(@Request() req: any) {
    const childOrgs = await this.orgService.getChildOrgIds(req.user.organizationId);
    return this.auditService.findAll(req.user.organizationId, childOrgs);
  }
}
