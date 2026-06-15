import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty() @IsString() groupId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coachId?: string;
  @ApiProperty() @IsDateString() sessionDate: string;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
}
