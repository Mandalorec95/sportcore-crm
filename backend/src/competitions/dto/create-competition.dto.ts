import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCompetitionDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsDateString() compDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sportType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateResultDto {
  @ApiProperty() @IsString() athleteId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discipline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() place?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() result?: string;
  @ApiPropertyOptional() @IsOptional() medal?: 'gold' | 'silver' | 'bronze' | 'none';
  @ApiPropertyOptional() @IsOptional() @IsString() coachComment?: string;
}

export class SetCompetitionParticipantsDto {
  @ApiProperty({ type: [String], example: ['ath-001', 'ath-002'] })
  @IsArray()
  @IsString({ each: true })
  athleteIds: string[];
}
