import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список платежей' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.paymentsService.findAll(user.orgId, query);
  }

  @Get('debtors')
  @ApiOperation({ summary: 'Список должников' })
  debtors(@CurrentUser() user: any) {
    return this.paymentsService.getDebtors(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать платёж' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(dto, user.orgId);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Подтвердить оплату' })
  confirm(@Param('id') id: string, @Body() body: { paidAmount?: number }, @CurrentUser() user: any) {
    return this.paymentsService.confirm(id, user.orgId, body.paidAmount);
  }

  @Get('athlete/:athleteId/balance')
  @ApiOperation({ summary: 'Баланс спортсмена' })
  balance(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.paymentsService.getAthleteBalance(athleteId, user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить платёж' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.paymentsService.update(id, user.orgId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить платёж' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.remove(id, user.orgId);
  }
}
