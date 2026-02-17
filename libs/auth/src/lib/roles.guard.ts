import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@task-manager/data';
import { ROLES_KEY } from './roles.decorator';

// role hierarchy - owner can do everything, admin can do most things, viewer can only view
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.VIEWER],
  [Role.ADMIN]: [Role.ADMIN, Role.VIEWER],
  [Role.VIEWER]: [Role.VIEWER],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // if no roles required then allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // console.log('checking roles for user:', user?.role);
    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    const userEffectiveRoles = ROLE_HIERARCHY[user.role as Role] || [];
    const hasRole = requiredRoles.some((role) => userEffectiveRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
