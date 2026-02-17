import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '@task-manager/auth';
import { Role } from '@task-manager/data';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get()
  findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  // only owner can create orgs
  @Post()
  @Roles(Role.OWNER)
  create(@Body() body: any) {
    return this.orgService.create(body.name, body.parentId);
  }
}
