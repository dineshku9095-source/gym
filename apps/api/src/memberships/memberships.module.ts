import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { AuditModule } from '../audit/audit.module';
import { MembersModule } from '../members/members.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule, MembersModule],
  controllers: [MembershipsController],
  providers: [MembershipsService, TenantService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
