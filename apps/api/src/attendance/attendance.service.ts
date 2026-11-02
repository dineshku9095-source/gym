import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

function localDateUtc(d = new Date()) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  /**
   * Manual Member ID check-in only — no QR/biometric.
   * gymId is resolved from staff assignment / route, never trusted from body alone.
   */
  async checkIn(
    user: RequestUser,
    gymId: string,
    input: { memberId: string; overrideReason?: string; notes?: string },
  ) {
    this.tenant.assertStaff(user, gymId, [
      'OWNER',
      'MANAGER',
      'RECEPTIONIST',
      'TRAINER',
    ]);

    const member = await this.prisma.gymMember.findFirst({
      where: { gymId, memberId: input.memberId.toUpperCase(), isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member ID not found at this gym');
    }

    const active = member.memberships[0];
    if (!active) {
      throw new BadRequestException('No active membership for this member');
    }
    if (active.endDate && active.endDate < new Date()) {
      throw new BadRequestException('Membership expired');
    }

    const day = localDateUtc();
    const existing = await this.prisma.attendance.findUnique({
      where: {
        gymId_gymMemberId_localDate: {
          gymId,
          gymMemberId: member.id,
          localDate: day,
        },
      },
    });

    if (existing) {
      if (!input.overrideReason) {
        throw new ConflictException(
          'Already checked in today — owner/manager override requires a reason',
        );
      }
      const assignment = this.tenant.getAssignment(user, gymId);
      const canOverride =
        this.tenant.isSuperAdmin(user) ||
        (assignment && ['OWNER', 'MANAGER'].includes(assignment.role));
      if (!canOverride) {
        throw new BadRequestException(
          'Only owner/manager can override duplicate check-in',
        );
      }
      // Unique constraint: update existing row instead of inserting a second.
      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkedInAt: new Date(),
          staffUserId: user.id,
          overrideReason: input.overrideReason,
          notes: input.notes,
          membershipId: active.id,
        },
        include: {
          gymMember: { include: { user: true } },
        },
      });
      await this.audit.log({
        gymId,
        actorId: user.id,
        action: 'ATTENDANCE_OVERRIDE',
        entityType: 'Attendance',
        entityId: updated.id,
        meta: { reason: input.overrideReason, memberId: member.memberId },
      });
      return updated;
    }

    const record = await this.prisma.attendance.create({
      data: {
        gymId,
        gymMemberId: member.id,
        membershipId: active.id,
        localDate: day,
        staffUserId: user.id,
        notes: input.notes,
      },
      include: {
        gymMember: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'ATTENDANCE_CHECKIN',
      entityType: 'Attendance',
      entityId: record.id,
      meta: { memberId: member.memberId },
    });

    return record;
  }

  async verify(user: RequestUser, gymId: string, memberId: string) {
    this.tenant.assertStaff(user, gymId);
    const member = await this.prisma.gymMember.findFirst({
      where: { gymId, memberId: memberId.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    });
    if (!member) throw new NotFoundException('Member not found in this gym');
    const day = localDateUtc();
    const today = await this.prisma.attendance.findUnique({
      where: {
        gymId_gymMemberId_localDate: {
          gymId,
          gymMemberId: member.id,
          localDate: day,
        },
      },
    });
    return {
      member,
      activeMembership: member.memberships[0] || null,
      alreadyCheckedInToday: Boolean(today),
    };
  }

  async list(
    user: RequestUser,
    gymId: string,
    opts?: { from?: string; to?: string },
  ) {
    this.tenant.assertStaff(user, gymId);
    const where: any = { gymId };
    if (opts?.from || opts?.to) {
      where.localDate = {};
      if (opts.from) where.localDate.gte = new Date(opts.from);
      if (opts.to) where.localDate.lte = new Date(opts.to);
    }
    return this.prisma.attendance.findMany({
      where,
      orderBy: { checkedInAt: 'desc' },
      take: 200,
      include: {
        gymMember: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async myHistory(user: RequestUser) {
    return this.prisma.attendance.findMany({
      where: { gymMember: { userId: user.id } },
      orderBy: { checkedInAt: 'desc' },
      take: 100,
      include: {
        gym: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}
