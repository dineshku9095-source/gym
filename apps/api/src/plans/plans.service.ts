import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  listPublic(gymId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listStaff(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId);
    return this.prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(
    user: RequestUser,
    gymId: string,
    data: {
      name: string;
      description?: string;
      durationDays: number;
      price: number;
      currency?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    const plan = await this.prisma.membershipPlan.create({
      data: {
        gymId,
        name: data.name,
        description: data.description,
        durationDays: data.durationDays,
        price: data.price,
        currency: data.currency || 'INR',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'PLAN_CREATE',
      entityType: 'MembershipPlan',
      entityId: plan.id,
    });
    return plan;
  }

  async update(
    user: RequestUser,
    gymId: string,
    planId: string,
    data: Record<string, unknown>,
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    const existing = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, gymId },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    const plan = await this.prisma.membershipPlan.update({
      where: { id: planId },
      data: data as any,
    });
    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'PLAN_UPDATE',
      entityType: 'MembershipPlan',
      entityId: planId,
    });
    return plan;
  }
}
