import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProgressDto {
  @ApiProperty() @IsString() skillName: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) score: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiProperty() @IsDateString() measuredAt: string;
}
