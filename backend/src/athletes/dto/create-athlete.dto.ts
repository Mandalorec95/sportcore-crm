import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateParentDto {
  @ApiProperty() @IsString() fullName: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() relation?: 'mother' | 'father' | 'guardian';
}

export class CreateAthleteDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsDateString() birthDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sportType?: string;
  @ApiPropertyOptional() @IsOptional() level?: 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  @ApiPropertyOptional() @IsOptional() status?: 'trial' | 'active' | 'frozen' | 'archived';
  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => CreateParentDto) parent?: CreateParentDto;
}
