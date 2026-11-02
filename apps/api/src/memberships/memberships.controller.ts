import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { requestMembershipSchema } from '@gymverse/shared-validation';
import { MembershipsService } from './memberships.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get('member/memberships')
  mine(@CurrentUser() user: RequestUser) {
    return this.memberships.myMemberships(user);
  }

  @Post('gyms/:gymId/memberships/request')
  request(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(requestMembershipSchema))
    body: { planId: string; notes?: string },
  ) {
    return this.memberships.request(user, gymId, body.planId, body.notes);
  }

  @Get('gyms/:gymId/memberships')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  list(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ) {
    return this.memberships.listForGym(user, gymId, status);
  }

  @Post('gyms/:gymId/memberships/:id/activate')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  activate(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memberships.activate(user, gymId, id);
  }

  @Post('gyms/:gymId/memberships/:id/cancel')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  cancel(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { note?: string },
  ) {
    return this.memberships.cancel(user, gymId, id, body?.note);
  }

  @Post('gyms/:gymId/memberships/:id/renew')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  renew(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memberships.renew(user, gymId, id);
  }
}
