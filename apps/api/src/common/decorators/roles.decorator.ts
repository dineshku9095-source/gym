import { SetMetadata } from '@nestjs/common';
import type { PlatformRole, StaffRole } from '@gymverse/shared-types';

export const ROLES_KEY = 'roles';

export type RoleRequirement =
  | { platform?: PlatformRole[]; staff?: StaffRole[] }
  | PlatformRole
  | StaffRole;

export const Roles = (...roles: RoleRequirement[]) =>
  SetMetadata(ROLES_KEY, roles);
