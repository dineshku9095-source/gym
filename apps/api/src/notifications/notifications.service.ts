import { Injectable, Logger } from '@nestjs/common';
import { MembershipStatus, NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_OFFSETS = [7, 3, 1, 0, -1];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async processReminders() {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'reminder.offsets' },
    });
    const offsets = Array.isArray(setting?.value)
      ? (setting!.value as number[])
      : DEFAULT_OFFSETS;

    // Expire due memberships first
    const now = new Date();
    const expired = await this.prisma.membership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: { status: MembershipStatus.EXPIRED },
    });
    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} memberships`);
    }

    const memberships = await this.prisma.membership.findMany({
      where: {
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.EXPIRED] },
        endDate: { not: null },
      },
      include: {
        gym: true,
        gymMember: { include: { user: true } },
        plan: true,
      },
      take: 500,
    });

    let enqueued = 0;
    for (const m of memberships) {
      if (!m.endDate) continue;
      const daysUntil = Math.round(
        (m.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (!offsets.includes(daysUntil)) continue;

      const userId = m.gymMember.userId;
      const dedupeKey = `membership:${m.id}:offset:${daysUntil}:email`;

      const existing = await this.prisma.notificationLog.findUnique({
        where: { dedupeKey },
      });
      if (existing) continue;

      const title =
        daysUntil > 0
          ? `Membership expires in ${daysUntil} day(s)`
          : daysUntil === 0
            ? 'Membership expires today'
            : 'Membership expired';
      const body = `${m.gym.name} — ${m.plan.name} (${m.gymMember.memberId})`;

      const notif = await this.prisma.notification.create({
        data: {
          userId,
          title,
          body,
          channel: NotificationChannel.IN_APP,
          meta: { membershipId: m.id, offsetDays: daysUntil },
        },
      });

      await this.prisma.notificationLog.create({
        data: {
          gymId: m.gymId,
          notificationId: notif.id,
          userId,
          membershipId: m.id,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.SENT,
          dedupeKey,
          offsetDays: daysUntil,
          attemptCount: 1,
          sentAt: new Date(),
        },
      });

      // Console transport when SMTP not configured
      this.logger.log(
        `[email→console] to=${m.gymMember.user.email} subject="${title}" ${body}`,
      );
      enqueued += 1;
    }

    return { expired: expired.count, enqueued };
  }
}
