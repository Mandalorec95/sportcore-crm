import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Website integration' })
  @IsString()
  name: string;

  @ApiProperty({
    example: ['athletes:read', 'payments:read'],
    description: 'Scopes are stored with the key and can be used by integrations for access control.',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];
}
