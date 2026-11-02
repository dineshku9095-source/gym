import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TenantService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
