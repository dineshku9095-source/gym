import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PlatformRole, StaffRole } from '@gymverse/shared-types';
import { ROLES_KEY, RoleRequirement } from '../decorators/roles.decorator';
import type { RequestUser } from '../types/request-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleRequirement[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    if (user.platformRole === 'SUPER_ADMIN') return true;

    const platformNeeded = new Set<PlatformRole>();
    const staffNeeded = new Set<StaffRole>();

    for (const r of required) {
      if (typeof r === 'string') {
        if (r === 'SUPER_ADMIN' || r === 'USER') platformNeeded.add(r);
        else staffNeeded.add(r as StaffRole);
      } else {
        r.platform?.forEach((p) => platformNeeded.add(p));
        r.staff?.forEach((s) => staffNeeded.add(s));
      }
    }

    if (platformNeeded.size > 0 && platformNeeded.has(user.platformRole)) {
      return true;
    }

    if (staffNeeded.size === 0) {
      throw new ForbiddenException('Insufficient role');
    }

    // Prefer gymId from route params — never trust body.gymId alone for auth.
    const gymId =
      request.params?.gymId ||
      request.query?.gymId ||
      request.headers['x-gym-id'];

    const assignments = user.staffAssignments || [];
    const match = gymId
      ? assignments.find(
          (a) => a.gymId === gymId && staffNeeded.has(a.role),
        )
      : assignments.find((a) => staffNeeded.has(a.role));

    if (!match) {
      throw new ForbiddenException('Insufficient gym role');
    }
    return true;
  }
}
