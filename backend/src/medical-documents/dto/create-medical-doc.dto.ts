import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMedicalDocDto {
  @ApiProperty({ enum: ['medical_cert', 'insurance', 'parental_consent'], example: 'medical_cert' })
  @IsEnum(['medical_cert', 'insurance', 'parental_consent'])
  docType: string;

  @ApiPropertyOptional({ example: '2026-06-01' }) @IsOptional() @IsDateString() issuedAt?: string;
  @ApiProperty({ example: '2027-06-01' }) @IsDateString() validUntil: string;
  @ApiPropertyOptional({ example: 'https://example.com/files/medical-cert.pdf' }) @IsOptional() @IsString() fileUrl?: string;
}

export class CreateMedicalDocWithAthleteDto extends CreateMedicalDocDto {
  @ApiProperty({ example: 'ath-001' })
  @IsString()
  athleteId: string;
}
