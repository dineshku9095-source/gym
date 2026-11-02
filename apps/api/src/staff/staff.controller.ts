import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { StaffService } from './staff.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('gyms/:gymId/staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  list(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.staff.list(user, gymId);
  }

  @Post()
  @Roles({ staff: ['OWNER'] })
  add(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { email: string; role: StaffRole },
  ) {
    return this.staff.add(user, gymId, body);
  }

  @Patch(':staffId/deactivate')
  @Roles({ staff: ['OWNER'] })
  deactivate(
    @Param('gymId') gymId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.staff.deactivate(user, gymId, staffId);
  }
}
