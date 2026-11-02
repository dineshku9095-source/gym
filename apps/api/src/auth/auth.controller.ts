import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { loginSchema, registerSchema } from '@gymverse/shared-validation';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  private cookieName() {
    return process.env.COOKIE_NAME || 'gymverse_token';
  }

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema))
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(body);
    res.cookie(this.cookieName(), result.accessToken, this.cookieOptions());
    return result;
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body.email, body.password);
    res.cookie(this.cookieName(), result.accessToken, this.cookieOptions());
    return result;
  }

  @HttpCode(200)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.cookieName(), { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    if (!user) throw new UnauthorizedException();
    return this.auth.me(user.id);
  }
}
