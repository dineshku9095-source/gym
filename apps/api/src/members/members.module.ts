import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from '../common/tenant/tenant.service';

@Module({
  imports: [AuditModule],
  controllers: [MembersController],
  providers: [MembersService, TenantService],
  exports: [MembersService],
})
export class MembersModule {}
