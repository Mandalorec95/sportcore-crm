import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Список API-ключей организации' })
  @ApiOkResponse({ description: 'Active API keys without raw secret values.' })
  findAll(@CurrentUser() user: any) {
    return this.apiKeysService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать API-ключ',
    description: 'Raw key is returned only once in this response. Store it securely on the integration side.',
  })
  @ApiCreatedResponse({ description: 'API key created. Response contains the raw key once.' })
  create(@Body() body: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.apiKeysService.create(user.orgId, body.name, body.scopes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отозвать API-ключ' })
  @ApiOkResponse({ description: 'API key revoked.' })
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.apiKeysService.revoke(id, user.orgId);
  }
}
