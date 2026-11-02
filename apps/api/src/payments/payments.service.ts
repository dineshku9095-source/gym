import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

/**
 * Manual payment ledger only — no payment gateway / Stripe / Razorpay / etc.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  async record(
    user: RequestUser,
    gymId: string,
    input: {
      gymMemberId: string;
      membershipId?: string;
      amount: number;
      method: PaymentMethod;
      status?: PaymentStatus;
      paidAt?: string;
      referenceNumber?: string;
      notes?: string;
    },
  ) {
    this.tenant.assertStaff(user, gymId, [
      'OWNER',
      'MANAGER',
      'RECEPTIONIST',
    ]);

    const member = await this.prisma.gymMember.findFirst({
      where: { id: input.gymMemberId, gymId },
    });
    if (!member) throw new NotFoundException('Member not in this gym');

    if (input.membershipId) {
      const membership = await this.prisma.membership.findFirst({
        where: { id: input.membershipId, gymId, gymMemberId: member.id },
      });
      if (!membership) throw new NotFoundException('Membership not found');
    }

    const status = input.status || PaymentStatus.COMPLETED;

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          gymId,
          gymMemberId: member.id,
          membershipId: input.membershipId,
          amount: new Prisma.Decimal(input.amount),
          method: input.method,
          status,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          recordedById: user.id,
        },
      });

      if (
        input.membershipId &&
        (status === PaymentStatus.COMPLETED || status === PaymentStatus.PARTIAL)
      ) {
        await tx.membership.update({
          where: { id: input.membershipId },
          data: { amountPaid: { increment: input.amount } },
        });
      }
      return created;
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'PAYMENT_RECORD',
      entityType: 'Payment',
      entityId: payment.id,
      meta: { amount: input.amount, method: input.method },
    });
    return payment;
  }

  async correct(
    user: RequestUser,
    gymId: string,
    paymentId: string,
    reason: string,
  ) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    if (!reason || reason.length < 3) {
      throw new BadRequestException('Correction reason required');
    }

    const original = await this.prisma.payment.findFirst({
      where: { id: paymentId, gymId },
    });
    if (!original) throw new NotFoundException('Payment not found');
    if (original.status === PaymentStatus.CORRECTED) {
      throw new BadRequestException('Already corrected');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.CORRECTED, notes: reason },
      });

      if (
        original.membershipId &&
        (original.status === PaymentStatus.COMPLETED ||
          original.status === PaymentStatus.PARTIAL)
      ) {
        await tx.membership.update({
          where: { id: original.membershipId },
          data: { amountPaid: { decrement: original.amount } },
        });
      }

      const correction = await tx.payment.create({
        data: {
          gymId,
          gymMemberId: original.gymMemberId,
          membershipId: original.membershipId,
          amount: original.amount,
          method: original.method,
          status: PaymentStatus.CANCELLED,
          notes: `Correction of ${original.id}: ${reason}`,
          recordedById: user.id,
          correctsPaymentId: original.id,
          referenceNumber: original.referenceNumber,
        },
      });

      return { cancelled, correction };
    });

    await this.audit.log({
      gymId,
      actorId: user.id,
      action: 'PAYMENT_CORRECT',
      entityType: 'Payment',
      entityId: paymentId,
      meta: { reason },
    });
    return result;
  }

  async list(
    user: RequestUser,
    gymId: string,
    opts?: { method?: string; status?: string },
  ) {
    this.tenant.assertStaff(user, gymId);
    return this.prisma.payment.findMany({
      where: {
        gymId,
        ...(opts?.method ? { method: opts.method as PaymentMethod } : {}),
        ...(opts?.status ? { status: opts.status as PaymentStatus } : {}),
      },
      orderBy: { paidAt: 'desc' },
      take: 200,
      include: {
        gymMember: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async dues(user: RequestUser, gymId: string) {
    this.tenant.assertStaff(user, gymId);
    const memberships = await this.prisma.membership.findMany({
      where: {
        gymId,
        status: { in: ['ACTIVE', 'EXPIRED', 'REQUESTED', 'SUSPENDED'] },
      },
      include: {
        gymMember: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        plan: true,
      },
    });
    return memberships
      .map((m) => {
        const outstanding = Number(m.amountDue) - Number(m.amountPaid);
        return { ...m, outstanding };
      })
      .filter((m) => m.outstanding > 0);
  }

  async myPayments(user: RequestUser) {
    return this.prisma.payment.findMany({
      where: { gymMember: { userId: user.id } },
      orderBy: { paidAt: 'desc' },
      include: {
        gym: { select: { id: true, name: true, slug: true } },
        membership: { include: { plan: true } },
      },
    });
  }

  async myDues(user: RequestUser) {
    const memberships = await this.prisma.membership.findMany({
      where: { gymMember: { userId: user.id } },
      include: {
        gym: { select: { id: true, name: true, slug: true } },
        plan: true,
        gymMember: true,
      },
    });
    return memberships
      .map((m) => ({
        ...m,
        outstanding: Number(m.amountDue) - Number(m.amountPaid),
      }))
      .filter((m) => m.outstanding > 0);
  }
}
