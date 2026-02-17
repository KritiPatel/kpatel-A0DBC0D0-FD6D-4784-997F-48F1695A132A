import { Role, TaskStatus, TaskCategory, TaskPriority, AuditAction } from './enums';

// ─── User ────────────────────────────────────────────────
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Organization ────────────────────────────────────────
export interface IOrganization {
  id: string;
  name: string;
  parentId: string | null;
  children?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Task ────────────────────────────────────────────────
export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  position: number;
  userId: string;
  organizationId: string;
  assignee?: IUser;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Audit Log ───────────────────────────────────────────
export interface IAuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

// ─── Auth ────────────────────────────────────────────────
export interface ILoginResponse {
  accessToken: string;
  user: Omit<IUser, 'createdAt' | 'updatedAt'>;
}

export interface IJwtPayload {
  sub: string;          // userId
  email: string;
  role: Role;
  organizationId: string;
}
