import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { checkInSchema } from '@gymverse/shared-validation';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get('member/attendance')
  myHistory(@CurrentUser() user: RequestUser) {
    return this.attendance.myHistory(user);
  }

  @Get('gyms/:gymId/attendance')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  list(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.list(user, gymId, { from, to });
  }

  @Get('gyms/:gymId/attendance/verify')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  verify(
    @Param('gymId') gymId: string,
    @Query('memberId') memberId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.attendance.verify(user, gymId, memberId);
  }

  @Post('gyms/:gymId/attendance/check-in')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  checkIn(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(checkInSchema))
    body: { memberId: string; overrideReason?: string; notes?: string },
  ) {
    return this.attendance.checkIn(user, gymId, body);
  }
}
