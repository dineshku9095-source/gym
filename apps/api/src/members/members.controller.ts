import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { MembersService } from './members.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get('member/cards')
  myCards(@CurrentUser() user: RequestUser) {
    return this.members.myCards(user);
  }

  @Get('gyms/:gymId/members')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  list(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.members.list(user, gymId);
  }

  @Get('gyms/:gymId/members/lookup')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER'] })
  lookup(
    @Param('gymId') gymId: string,
    @Query('memberId') memberId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.members.findByMemberId(user, gymId, memberId);
  }

  @Get('gyms/:gymId/members/export.csv')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  @Header('Content-Type', 'text/csv')
  async exportCsv(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const csv = await this.members.exportCsv(user, gymId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="members-${gymId}.csv"`,
    );
    res.send(csv);
  }
}
