import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { recordPaymentSchema } from '@gymverse/shared-validation';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('member/payments')
  myPayments(@CurrentUser() user: RequestUser) {
    return this.payments.myPayments(user);
  }

  @Get('member/dues')
  myDues(@CurrentUser() user: RequestUser) {
    return this.payments.myDues(user);
  }

  @Get('gyms/:gymId/payments')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  list(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Query('method') method?: string,
    @Query('status') status?: string,
  ) {
    return this.payments.list(user, gymId, { method, status });
  }

  @Get('gyms/:gymId/payments/dues')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  dues(@Param('gymId') gymId: string, @CurrentUser() user: RequestUser) {
    return this.payments.dues(user, gymId);
  }

  @Post('gyms/:gymId/payments')
  @Roles({ staff: ['OWNER', 'MANAGER', 'RECEPTIONIST'] })
  record(
    @Param('gymId') gymId: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(recordPaymentSchema)) body: any,
  ) {
    return this.payments.record(user, gymId, body);
  }

  @Post('gyms/:gymId/payments/:paymentId/correct')
  @Roles({ staff: ['OWNER', 'MANAGER'] })
  correct(
    @Param('gymId') gymId: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { reason: string },
  ) {
    return this.payments.correct(user, gymId, paymentId, body.reason);
  }
}
