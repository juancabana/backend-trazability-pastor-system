import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.PASTOR]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) return false;

    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
    // User passes if their level >= any required role's level
    return requiredRoles.some(
      (role) => userLevel >= (ROLE_HIERARCHY[role] ?? 999),
    );
  }
}
