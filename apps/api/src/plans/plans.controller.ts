import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { createPlanSchema } from '@gymverse/shared-validation';
import { PlansService } from './plans.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Public()
  @Get('public/gyms/:gymId/plans')
  listPublic(@Param('gymId') gymId: string) {
    return this.plans.listPublic(gymId);
  }

  @Get('gyms/:gymId/plans')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  list(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.plans.listStaff(user, gymId);
  }

  @Post('gyms/:gymId/plans')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  create(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createPlanSchema)) body: any,
  ) {
    return this.plans.create(user, gymId, body);
  }

  @Patch('gyms/:gymId/plans/:planId')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  update(
    @Param('gymId') gymId: string,
    @Param('planId') planId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.plans.update(user, gymId, planId, body);
  }
}
