import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceItemDto {
  @ApiProperty() @IsString() athleteId: string;
  @ApiProperty({ enum: ['present', 'absent', 'late', 'sick', 'competition'] })
  @IsEnum(['present', 'absent', 'late', 'sick', 'competition'])
  status: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional() @IsInt() @Min(1) @Max(5)
  grade?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ type: [AttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items: AttendanceItemDto[];
}
