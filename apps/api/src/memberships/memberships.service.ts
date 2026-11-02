import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MembersService } from '../members/members.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly members: MembersService,
    private readonly tenant: TenantService,
  ) {}

  async request(
    user: RequestUser,
    gymId: string,
    planId: string,
    notes?: string,
  ) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.status !== 'APPROVED') {
      throw new NotFoundException('Gym not available');
    }
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, gymId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const gymMember = await this.members.ensureGymMember(gymId, user.id);
    const membership = await this.prisma.membership.create({
      data: {
        gymId,
        gymMemberId: gymMember.id,
        planId: plan.id,
        status: MembershipStatus.REQUESTED,
        amountDue: plan.price,
        amountPaid: 0,
        notes,
        events: {
          create: {
            type: 'REQUESTED',
            toStatus: 'REQUESTED',
            actorUserId: user.id,
            note: notes,
          },
        },
      },
      include: { plan: true, gymMember: true },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'MEMBERSHIP_REQUEST',
      entityType: 'Membership',
      entityId: membership.id,
    });
    return membership;
  }

  async listForGym(user: RequestUser, gymId: string, status?: string) {
    this.tenant.assertStaff(user, gymId);
    return this.prisma.membership.findMany({
      where: {
        gymId,
        ...(status ? { status: status as MembershipStatus } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        gymMember: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async myMemberships(user: RequestUser) {
    return this.prisma.membership.findMany({
      where: { gymMember: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        gym: { select: { id: true, name: true, slug: true } },
        gymMember: true,
        payments: { orderBy: { paidAt: 'desc' }, take: 10 },
      },
    });
  }

  async activate(user: RequestUser, gymId: string, membershipId: string) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, gymId },
      include: { plan: true },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.status === 'ACTIVE') {
      throw new BadRequestException('Already active');
    }

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + membership.plan.durationDays);

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.ACTIVE,
        startDate: start,
        endDate: end,
        activatedAt: start,
        events: {
          create: {
            type: 'ACTIVATED',
            fromStatus: membership.status,
            toStatus: 'ACTIVE',
            actorUserId: user.id,
          },
        },
      },
      include: { plan: true, gymMember: true },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'MEMBERSHIP_ACTIVATE',
      entityType: 'Membership',
      entityId: membershipId,
    });
    return updated;
  }

  async cancel(
    user: RequestUser,
    gymId: string,
    membershipId: string,
    note?: string,
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, gymId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.CANCELLED,
        cancelledAt: new Date(),
        events: {
          create: {
            type: 'CANCELLED',
            fromStatus: membership.status,
            toStatus: 'CANCELLED',
            actorUserId: user.id,
            note,
          },
        },
      },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'MEMBERSHIP_CANCEL',
      entityType: 'Membership',
      entityId: membershipId,
      meta: { note },
    });
    return updated;
  }

  async renew(user: RequestUser, gymId: string, membershipId: string) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const old = await this.prisma.membership.findFirst({
      where: { id: membershipId, gymId },
      include: { plan: true },
    });
    if (!old) throw new NotFoundException('Membership not found');

    const start = old.endDate && old.endDate > new Date() ? old.endDate : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + old.plan.durationDays);

    const created = await this.prisma.membership.create({
      data: {
        gymId,
        gymMemberId: old.gymMemberId,
        planId: old.planId,
        status: MembershipStatus.ACTIVE,
        startDate: start,
        endDate: end,
        amountDue: old.plan.price,
        amountPaid: 0,
        activatedAt: new Date(),
        events: {
          create: {
            type: 'RENEWED',
            toStatus: 'ACTIVE',
            actorUserId: user.id,
            note: `Renewed from ${old.id}`,
          },
        },
      },
      include: { plan: true },
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'MEMBERSHIP_RENEW',
      entityType: 'Membership',
      entityId: created.id,
      meta: { from: old.id },
    });
    return created;
  }
}
