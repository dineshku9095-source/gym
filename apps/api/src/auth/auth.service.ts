import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { JwtPayload } from '@gymverse/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        notificationPrefs: { create: {} },
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: user.id,
    });

    return this.issueForUser(user.id);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.audit.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
    });

    return this.issueForUser(user.id);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffAssignments: {
          where: { isActive: true },
          include: {
            gym: { select: { id: true, slug: true, name: true, status: true } },
          },
        },
        gymMemberships: {
          include: {
            gym: { select: { id: true, slug: true, name: true } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  private async issueForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        staffAssignments: {
          where: { isActive: true },
          include: {
            gym: { select: { id: true, slug: true, name: true, status: true } },
          },
        },
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const { passwordHash: _, ...safe } = user;

    return {
      accessToken,
      user: {
        ...safe,
        staffAssignments: user.staffAssignments.map((s) => ({
          gymId: s.gymId,
          role: s.role,
          gymSlug: s.gym.slug,
          gymName: s.gym.name,
          gymStatus: s.gym.status,
        })),
      },
    };
  }
}
