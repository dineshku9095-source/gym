import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { TenantService } from '../common/tenant/tenant.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('gyms/:gymId/audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly tenant: TenantService,
  ) {}

  @Get()
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  list(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    this.tenant.assertStaff(user, gymId, ['OWNER', 'MANAGER']);
    return this.audit.listForGym(gymId);
  }
}
