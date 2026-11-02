import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GymStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
@Roles({ platform: ['SUPER_ADMIN'] })
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('gyms')
  gyms(@Query('status') status?: string) {
    return this.admin.listGyms(status);
  }

  @Post('gyms/:gymId/status')
  setStatus(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { status: GymStatus; note?: string },
  ) {
    return this.admin.setGymStatus(user, gymId, body.status, body.note);
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Patch('users/:userId/active')
  setUserActive(
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { isActive: boolean },
  ) {
    return this.admin.setUserActive(user, userId, body.isActive);
  }

  @Get('tickets')
  tickets() {
    return this.admin.listTickets();
  }

  @Patch('tickets/:ticketId')
  updateTicket(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: RequestUser,
    @Body()
    body: { status?: string; priority?: string; assigneeId?: string | null },
  ) {
    return this.admin.updateTicket(user, ticketId, body);
  }

  @Get('settings')
  settings() {
    return this.admin.listSettings();
  }

  @Post('settings')
  upsertSetting(
    @CurrentUser() user: RequestUser,
    @Body() body: { key: string; value: unknown },
  ) {
    return this.admin.upsertSetting(user, body.key, body.value as any);
  }

  @Get('activity')
  activity() {
    return this.admin.recentActivity();
  }
}
