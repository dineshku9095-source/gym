import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule],
  controllers: [PlansController],
  providers: [PlansService, TenantService],
  exports: [PlansService],
})
export class PlansModule {}
