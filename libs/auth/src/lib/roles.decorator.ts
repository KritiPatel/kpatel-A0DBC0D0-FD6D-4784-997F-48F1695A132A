import { SetMetadata } from '@nestjs/common';
import { Role } from '@task-manager/data';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
