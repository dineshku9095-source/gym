import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

function generateMemberId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `GYM-${suffix}`;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  async list(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId);
    return this.prisma.gymMember.findMany({
      where: { gymId },
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { plan: true },
        },
      },
    });
  }

  async findByMemberId(user: RequestUser, gymId: string, memberId: string) {
    this.tenant.assertStaff(user, gymId);
    const member = await this.prisma.gymMember.findFirst({
      where: { gymId, memberId: memberId.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { endDate: 'desc' },
        },
      },
    });
    if (!member) throw new NotFoundException('Member not found in this gym');
    return member;
  }

  async ensureGymMember(gymId: string, userId: string) {
    const existing = await this.prisma.gymMember.findUnique({
      where: { gymId_userId: { gymId, userId } },
    });
    if (existing) return existing;

    for (let attempt = 0; attempt < 8; attempt++) {
      const memberId = generateMemberId();
      try {
        return await this.prisma.gymMember.create({
          data: { gymId, userId, memberId },
        });
      } catch (e: any) {
        if (e?.code === 'P2002') continue;
        throw e;
      }
    }
    throw new ConflictException('Could not allocate Member ID');
  }

  async myCards(user: RequestUser) {
    return this.prisma.gymMember.findMany({
      where: { userId: user.id },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverUrl: true,
            status: true,
          },
        },
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
      },
    });
  }

  async exportCsv(user: RequestUser, gymId: string) {
    const rows = await this.list(user, gymId);
    const header = [
      'memberId',
      'email',
      'firstName',
      'lastName',
      'phone',
      'joinedAt',
      'activeMembership',
    ];
    const lines = [header.join(',')];
    for (const r of rows) {
      const active = r.memberships.find((m) => m.status === 'ACTIVE');
      lines.push(
        [
          r.memberId,
          r.user.email,
          r.user.firstName,
          r.user.lastName,
          r.user.phone || '',
          r.joinedAt.toISOString(),
          active ? active.plan.name : '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
    }
    return lines.join('\n');
  }
}
