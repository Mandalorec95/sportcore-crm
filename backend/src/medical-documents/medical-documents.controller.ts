import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MedicalDocumentsService } from './medical-documents.service';
import { CreateMedicalDocDto, CreateMedicalDocWithAthleteDto } from './dto/create-medical-doc.dto';
import { UpdateMedicalDocDto } from './dto/update-medical-doc.dto';

@ApiTags('medical-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MedicalDocumentsController {
  constructor(private medDocService: MedicalDocumentsService) {}

  @Get('athletes/:athleteId/medical-documents')
  @ApiOperation({ summary: 'Документы спортсмена' })
  findByAthlete(@Param('athleteId') athleteId: string) {
    return this.medDocService.findByAthlete(athleteId);
  }

  @Post('athletes/:athleteId/medical-documents')
  @ApiOperation({ summary: 'Добавить документ' })
  create(@Param('athleteId') athleteId: string, @Body() dto: CreateMedicalDocDto) {
    return this.medDocService.create(athleteId, dto);
  }

  @Get('medical-documents/expiring')
  @ApiOperation({ summary: 'Истекающие документы' })
  @ApiQuery({ name: 'days', required: false, example: 14, description: 'How many days ahead to check.' })
  expiring(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.medDocService.getExpiring(user.orgId, days ? parseInt(days) : 14);
  }

  @Get('medical-documents')
  @ApiOperation({ summary: 'Все медицинские документы' })
  findAll(@CurrentUser() user: any) {
    return this.medDocService.findAll(user.orgId);
  }

  @Post('medical-documents')
  @ApiOperation({ summary: 'Создать документ' })
  createDoc(@Body() body: CreateMedicalDocWithAthleteDto, @CurrentUser() user: any) {
    return this.medDocService.create(body.athleteId, body as any);
  }

  @Patch('medical-documents/:id')
  @ApiOperation({ summary: 'Обновить документ' })
  update(@Param('id') id: string, @Body() body: UpdateMedicalDocDto) {
    return this.medDocService.update(id, body);
  }

  @Post('medical-documents/athletes/:athleteId/parent-consent/request')
  @ApiOperation({ summary: 'Отправить запрос родительского согласия' })
  requestParentConsent(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.medDocService.requestParentConsent(athleteId, user.orgId, user);
  }

  @Get('parent/consent-requests')
  @ApiOperation({ summary: 'Запросы родительского согласия' })
  getParentConsentRequests(@CurrentUser() user: any) {
    return this.medDocService.getParentConsentRequests(user);
  }

  @Patch('parent/consent-requests/:id/respond')
  @ApiOperation({ summary: 'Ответить на запрос родительского согласия' })
  respondParentConsent(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected' }, @CurrentUser() user: any) {
    return this.medDocService.respondParentConsent(id, user, body.status);
  }

  @Delete('medical-documents/:id')
  @ApiOperation({ summary: 'Удалить документ' })
  remove(@Param('id') id: string) {
    return this.medDocService.remove(id);
  }
}
