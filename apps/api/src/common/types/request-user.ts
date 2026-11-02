import type { PlatformRole, StaffRole } from '@gymverse/shared-types';

export interface StaffAssignment {
  gymId: string;
  role: StaffRole;
  gymSlug?: string;
  gymName?: string;
  gymStatus?: string;
}

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
  staffAssignments: StaffAssignment[];
}
