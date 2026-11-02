import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { createGymSchema } from '@gymverse/shared-validation';
import { GymsService } from './gyms.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class GymsController {
  constructor(private readonly gyms: GymsService) {}

  @Public()
  @Get('gyms')
  list(@Query('city') city?: string, @Query('q') q?: string) {
    return this.gyms.listPublic({ city, q });
  }

  @Public()
  @Get('gyms/by-slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.gyms.getBySlug(slug);
  }

  @Post('gyms')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createGymSchema)) body: any,
  ) {
    return this.gyms.create(user, body);
  }

  @Get('gyms/:gymId')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  getOne(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.gyms.getForStaff(user, gymId);
  }

  @Patch('gyms/:gymId')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  update(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.gyms.update(user, gymId, body as any);
  }

  @Get('gyms/:gymId/dashboard')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  dashboard(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.gyms.dashboard(user, gymId);
  }
}
