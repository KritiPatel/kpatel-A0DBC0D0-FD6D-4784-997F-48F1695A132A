import { Role, TaskStatus, TaskCategory, TaskPriority } from './enums';

// ─── Auth DTOs ───────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  organizationId: string;
}

// ─── Task DTOs ───────────────────────────────────────────
export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  position?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  position?: number;
}

export interface TaskFilterDto {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'position' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

// ─── Organization DTOs ───────────────────────────────────
export interface CreateOrganizationDto {
  name: string;
  parentId?: string;
}

// ─── Reorder DTO ─────────────────────────────────────────
export interface ReorderTaskDto {
  taskId: string;
  newPosition: number;
  newStatus?: TaskStatus;
}
