import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrganizationModule } from '../organizations/organization.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    OrganizationModule,
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
