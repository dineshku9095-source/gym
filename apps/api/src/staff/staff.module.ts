import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule],
  controllers: [StaffController],
  providers: [StaffService, TenantService],
})
export class StaffModule {}
