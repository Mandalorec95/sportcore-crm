import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    example: 3500,
    description: 'Amount accepted for this payment. If omitted, the full payment amount is used.',
  })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}
