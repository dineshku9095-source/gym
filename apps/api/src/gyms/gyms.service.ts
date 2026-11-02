import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

@Injectable()
export class GymsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  async listPublic(query?: { city?: string; q?: string }) {
    const where: Prisma.GymWhereInput = {
      status: 'APPROVED',
    };
    if (query?.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query?.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { city: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.gym.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        facilities: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' }, take: 4 },
        plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getBySlug(slug: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { slug },
      include: {
        facilities: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!gym || gym.status !== 'APPROVED') {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async getForStaff(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId);
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        facilities: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        plans: { orderBy: { sortOrder: 'asc' } },
        staff: {
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
    if (!gym) throw new NotFoundException('Gym not found');
    return gym;
  }

  async create(user: RequestUser, data: Prisma.GymCreateWithoutOwnerInput) {
    const existing = await this.prisma.gym.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');

    const gym = await this.prisma.gym.create({
      data: {
        ...data,
        ownerId: user.id,
        status: 'PENDING',
        staff: {
          create: { userId: user.id, role: 'OWNER' },
        },
        platformSubscription: {
          create: { planName: 'free', status: 'trial' },
        },
      },
    });

    await this.audit.log({
      gymId: gym.id,
      actorId: user.id,
      action: 'GYM_CREATE',
      entityType: 'Gym',
      entityId: gym.id,
    });
    return gym;
  }

  async update(
    user: RequestUser,
    gymId: string,
    data: Prisma.GymUpdateInput,
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    const gym = await this.prisma.gym.update({
      where: { id: gymId },
      data,
    });
    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'GYM_UPDATE',
      entityType: 'Gym',
      entityId: gymId,
    });
    return gym;
  }

  async dashboard(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayUtc = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);

    const [
      activeMembers,
      checkInsToday,
      revenueAgg,
      expiringSoon,
      dues,
    ] = await Promise.all([
      this.prisma.membership.count({
        where: { gymId, status: 'ACTIVE' },
      }),
      this.prisma.attendance.count({
        where: { gymId, localDate: todayUtc },
      }),
      this.prisma.payment.aggregate({
        where: {
          gymId,
          status: { in: ['COMPLETED', 'PARTIAL'] },
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.membership.count({
        where: {
          gymId,
          status: 'ACTIVE',
          endDate: { lte: in7, gte: now },
        },
      }),
      this.prisma.membership.findMany({
        where: { gymId, status: { in: ['ACTIVE', 'EXPIRED', 'REQUESTED'] } },
        select: { amountDue: true, amountPaid: true },
      }),
    ]);

    const outstandingDues = dues.reduce((sum, m) => {
      const due = Number(m.amountDue) - Number(m.amountPaid);
      return sum + (due > 0 ? due : 0);
    }, 0);

    return {
      activeMembers,
      checkInsToday,
      revenueThisMonth: Number(revenueAgg._sum.amount || 0),
      expiringSoon,
      outstandingDues,
    };
  }
}
