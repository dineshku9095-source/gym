import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  list(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    return this.prisma.gymStaff.findMany({
      where: { gymId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async add(
    user: RequestUser,
    gymId: string,
    input: { email: string; role: StaffRole },
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER']);
    if (input.role === 'OWNER') {
      throw new BadRequestException('Cannot assign OWNER via this endpoint');
    }
    const target = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!target) throw new NotFoundException('User not found — they must register first');

    const staff = await this.prisma.gymStaff.upsert({
      where: { gymId_userId: { gymId, userId: target.id } },
      create: { gymId, userId: target.id, role: input.role },
      update: { role: input.role, isActive: true },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'STAFF_UPSERT',
      entityType: 'GymStaff',
      entityId: staff.id,
      meta: { role: input.role, email: input.email },
    });
    return staff;
  }

  async deactivate(user: RequestUser, gymId: string, staffId: string) {
    this.tenant.assertStaff(user, gymId, ['OWNER']);
    const staff = await this.prisma.gymStaff.findFirst({
      where: { id: staffId, gymId },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    if (staff.role === 'OWNER') {
      throw new BadRequestException('Cannot deactivate owner');
    }
    const updated = await this.prisma.gymStaff.update({
      where: { id: staffId },
      data: { isActive: false },
    });
    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'STAFF_DEACTIVATE',
      entityType: 'GymStaff',
      entityId: staffId,
    });
    return updated;
  }
}
