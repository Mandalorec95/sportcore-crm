import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiKeysService } from './api-keys.service';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Список API-ключей организации' })
  findAll(@CurrentUser() user: any) {
    return this.apiKeysService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать API-ключ' })
  create(@Body() body: { name: string; scopes: string[] }, @CurrentUser() user: any) {
    return this.apiKeysService.create(user.orgId, body.name, body.scopes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отозвать API-ключ' })
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.apiKeysService.revoke(id, user.orgId);
  }
}
