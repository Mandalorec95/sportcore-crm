import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional({ enum: ['new', 'in_progress', 'completed', 'done'] })
  @IsOptional() @IsEnum(['new', 'in_progress', 'completed', 'done'])
  status?: 'new' | 'in_progress' | 'completed' | 'done';
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';
}
