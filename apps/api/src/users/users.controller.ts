import { Body, Controller, Patch, Post } from '@nestjs/common';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '@gymverse/shared-validation';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(updateProfileSchema))
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      avatarUrl?: string | null;
    },
  ) {
    return this.users.updateProfile(user.id, body);
  }

  @Post('me/password')
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: { currentPassword: string; newPassword: string },
  ) {
    return this.users.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
