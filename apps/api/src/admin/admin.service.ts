import { Injectable, NotFoundException } from '@nestjs/common';
import { GymStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async dashboard() {
    const [
      gymsTotal,
      gymsPending,
      gymsApproved,
      usersTotal,
      activeMemberships,
      ticketsOpen,
    ] = await Promise.all([
      this.prisma.gym.count(),
      this.prisma.gym.count({ where: { status: 'PENDING' } }),
      this.prisma.gym.count({ where: { status: 'APPROVED' } }),
      this.prisma.user.count(),
      this.prisma.membership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ]);
    return {
      gymsTotal,
      gymsPending,
      gymsApproved,
      usersTotal,
      activeMemberships,
      ticketsOpen,
    };
  }

  listGyms(status?: string) {
    return this.prisma.gym.findMany({
      where: status ? { status: status as GymStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: { select: { members: true, memberships: true } },
      },
    });
  }

  async setGymStatus(
    actor: RequestUser,
    gymId: string,
    status: GymStatus,
    note?: string,
  ) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');
    const updated = await this.prisma.gym.update({
      where: { id: gymId },
      data: { status },
    });
    await this.audit.log({
      gymId,
      actorId: actor.id,
      action: `GYM_${status}`,
      entityType: 'Gym',
      entityId: gymId,
      meta: { note, from: gym.status },
    });
    return updated;
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        platformRole: true,
        isActive: true,
        createdAt: true,
        staffAssignments: {
          select: { gymId: true, role: true, gym: { select: { name: true } } },
        },
      },
    });
  }

  async setUserActive(actor: RequestUser, userId: string, isActive: boolean) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
    await this.audit.log({
      actorId: actor.id,
      action: isActive ? 'USER_REACTIVATE' : 'USER_SUSPEND',
      entityType: 'User',
      entityId: userId,
    });
    return updated;
  }

  listTickets() {
    return this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        gym: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateTicket(
    actor: RequestUser,
    ticketId: string,
    data: { status?: string; priority?: string; assigneeId?: string | null },
  ) {
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: data.status as any,
        priority: data.priority as any,
        assigneeId: data.assigneeId === undefined ? undefined : data.assigneeId,
        resolvedAt:
          data.status === 'RESOLVED' || data.status === 'CLOSED'
            ? new Date()
            : undefined,
      },
    });
    await this.audit.log({
      actorId: actor.id,
      gymId: updated.gymId,
      action: 'TICKET_UPDATE',
      entityType: 'SupportTicket',
      entityId: ticketId,
      meta: data as Prisma.InputJsonValue,
    });
    return updated;
  }

  listSettings() {
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSetting(actor: RequestUser, key: string, value: Prisma.InputJsonValue) {
    const setting = await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'SETTING_UPSERT',
      entityType: 'PlatformSetting',
      entityId: setting.id,
      meta: { key },
    });
    return setting;
  }

  recentActivity() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actor: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        gym: { select: { id: true, name: true } },
      },
    });
  }
}
