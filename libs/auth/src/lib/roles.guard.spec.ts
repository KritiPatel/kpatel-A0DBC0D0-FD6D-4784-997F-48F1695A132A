import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@task-manager/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole: Role): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', email: 'test@test.com', role: userRole, organizationId: 'org1' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(Role.VIEWER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Owner access to Owner-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
    const context = createMockContext(Role.OWNER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny Admin access to Owner-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
    const context = createMockContext(Role.ADMIN);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny Viewer access to Owner-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
    const context = createMockContext(Role.VIEWER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow Owner access to Admin routes (role inheritance)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.OWNER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Admin access to Admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny Viewer access to Admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.VIEWER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow all roles access to Viewer routes (role inheritance)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

    expect(guard.canActivate(createMockContext(Role.OWNER))).toBe(true);
    expect(guard.canActivate(createMockContext(Role.ADMIN))).toBe(true);
    expect(guard.canActivate(createMockContext(Role.VIEWER))).toBe(true);
  });

  it('should allow access when user has any of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER, Role.ADMIN]);
    expect(guard.canActivate(createMockContext(Role.ADMIN))).toBe(true);
  });

  it('should throw ForbiddenException when no user in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
