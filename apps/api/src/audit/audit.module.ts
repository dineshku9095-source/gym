import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  providers: [AuditService, TenantService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
