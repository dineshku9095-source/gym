import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, TenantService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
