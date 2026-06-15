import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMedicalDocDto {
  @ApiProperty({ enum: ['medical_cert', 'insurance', 'parental_consent'] })
  @IsEnum(['medical_cert', 'insurance', 'parental_consent'])
  docType: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() issuedAt?: string;
  @ApiProperty() @IsDateString() validUntil: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
}
