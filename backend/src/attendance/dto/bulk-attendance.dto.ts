import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceItemDto {
  @ApiProperty() @IsString() athleteId: string;
  @ApiProperty({ enum: ['present', 'absent', 'late', 'sick', 'competition'] })
  @IsEnum(['present', 'absent', 'late', 'sick', 'competition'])
  status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ type: [AttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items: AttendanceItemDto[];
}
