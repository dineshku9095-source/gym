import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { JwtPayload } from '@gymverse/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/request-user';

function cookieExtractor(req: Request): string | null {
  const name = process.env.COOKIE_NAME || 'gymverse_token';
  if (req?.cookies?.[name]) return req.cookies[name];
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        staffAssignments: {
          where: { isActive: true },
          include: { gym: { select: { id: true, slug: true, name: true, status: true } } },
        },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User inactive or missing');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
      staffAssignments: user.staffAssignments.map((s) => ({
        gymId: s.gymId,
        role: s.role,
        gymSlug: s.gym.slug,
        gymName: s.gym.name,
        gymStatus: s.gym.status,
      })),
    };
  }
}
