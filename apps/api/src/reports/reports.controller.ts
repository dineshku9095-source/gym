import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('gyms/:gymId/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('revenue')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  revenue(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Query('days') days?: string,
  ) {
    return this.reports.revenue(user, gymId, days ? Number(days) : 30);
  }

  @Get('attendance')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  attendance(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Query('days') days?: string,
  ) {
    return this.reports.attendance(user, gymId, days ? Number(days) : 30);
  }
}
