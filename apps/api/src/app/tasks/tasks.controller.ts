import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '@task-manager/auth';
import { Role, CreateTaskDto, UpdateTaskDto, TaskFilterDto, ReorderTaskDto } from '@task-manager/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  create(@Body() dto: CreateTaskDto, @Request() req: any, @Ip() ip: string) {
    return this.tasksService.create(dto, req.user, ip);
  }

  @Get()
  findAll(@Request() req: any, @Query() filters: TaskFilterDto) {
    return this.tasksService.findAll(req.user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.findOne(id, req.user);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: any,
    @Ip() ip: string
  ) {
    return this.tasksService.update(id, dto, req.user, ip);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
    return this.tasksService.remove(id, req.user, ip);
  }

  @Put('reorder/batch')
  @Roles(Role.OWNER, Role.ADMIN)
  reorder(@Body() dto: ReorderTaskDto, @Request() req: any) {
    return this.tasksService.reorder(dto, req.user);
  }
}
