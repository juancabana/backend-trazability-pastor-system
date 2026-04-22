import { UserRole } from '../common/enums/user-role.enum.js';

export const BCRYPT_ROUNDS = 12;

export const JWT_EXPIRY = '7d';

export const THROTTLE_TTL = 60_000;
export const THROTTLE_LIMIT = 30;
export const THROTTLE_LOGIN_TTL = 60_000;
export const THROTTLE_LOGIN_LIMIT = 5;

export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.PASTOR]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
};
