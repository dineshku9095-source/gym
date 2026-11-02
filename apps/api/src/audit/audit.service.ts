import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    gymId?: string | null;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    meta?: Prisma.InputJsonValue;
    ip?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        gymId: input.gymId ?? undefined,
        actorId: input.actorId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        meta: input.meta,
        ip: input.ip ?? undefined,
      },
    });
  }

  async listForGym(gymId: string, take = 50) {
    return this.prisma.auditLog.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        actor: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
