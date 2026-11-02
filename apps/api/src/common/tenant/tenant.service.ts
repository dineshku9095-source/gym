import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { StaffRole } from '@gymverse/shared-types';
import type { RequestUser } from '../types/request-user';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Resolves gym tenancy from the authenticated user — never from a
 * client-supplied gymId alone for authorization decisions.
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  isSuperAdmin(user: RequestUser) {
    return user.platformRole === 'SUPER_ADMIN';
  }

  getAssignment(user: RequestUser, gymId: string) {
    return user.staffAssignments.find((a) => a.gymId === gymId);
  }

  assertStaff(
    user: RequestUser,
    gymId: string,
    allowed: StaffRole[] = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'],
  ) {
    if (this.isSuperAdmin(user)) {
      return { gymId, role: 'OWNER' as StaffRole, bypass: true };
    }
    const assignment = this.getAssignment(user, gymId);
    if (!assignment || !allowed.includes(assignment.role)) {
      throw new ForbiddenException('No access to this gym');
    }
    return { ...assignment, bypass: false };
  }

  /** Primary gym for desk staff when route omits gymId — from JWT staff, not body. */
  resolvePrimaryGymId(user: RequestUser): string {
    if (!user.staffAssignments.length) {
      throw new ForbiddenException('No gym assignment');
    }
    return user.staffAssignments[0].gymId;
  }

  async assertGymExists(gymId: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');
    return gym;
  }
}
