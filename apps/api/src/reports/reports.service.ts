import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async revenue(user: RequestUser, gymId: string, days = 30) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const payments = await this.prisma.payment.findMany({
      where: {
        gymId,
        status: { in: ['COMPLETED', 'PARTIAL'] },
        paidAt: { gte: since },
      },
      orderBy: { paidAt: 'asc' },
    });

    const byDay = new Map<string, number>();
    for (const p of payments) {
      const key = p.paidAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + Number(p.amount));
    }

    return {
      days,
      total: payments.reduce((s, p) => s + Number(p.amount), 0),
      series: Array.from(byDay.entries()).map(([date, amount]) => ({
        date,
        amount,
      })),
    };
  }

  async attendance(user: RequestUser, gymId: string, days = 30) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceUtc = new Date(
      Date.UTC(since.getFullYear(), since.getMonth(), since.getDate()),
    );

    const rows = await this.prisma.attendance.groupBy({
      by: ['localDate'],
      where: { gymId, localDate: { gte: sinceUtc } },
      _count: { _all: true },
      orderBy: { localDate: 'asc' },
    });

    return {
      days,
      series: rows.map((r) => ({
        date: r.localDate.toISOString().slice(0, 10),
        count: r._count._all,
      })),
      total: rows.reduce((s, r) => s + r._count._all, 0),
    };
  }
}
