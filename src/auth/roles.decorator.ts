import { SetMetadata } from '@nestjs/common';
import type { UserRole } from './user-role.type';

export const ROLES_KEY = 'roles';

/** Danh dau route/controller chi cho phep 1 hoac nhieu role cu the truy cap. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
