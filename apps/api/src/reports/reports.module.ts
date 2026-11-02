import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, TenantService],
})
export class ReportsModule {}
