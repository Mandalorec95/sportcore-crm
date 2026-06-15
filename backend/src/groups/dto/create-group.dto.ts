import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sportType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coachId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() ageFrom?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() ageTo?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() level?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() monthlyFee?: number;
}
