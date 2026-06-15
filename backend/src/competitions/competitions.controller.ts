import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto, CreateResultDto } from './dto/create-competition.dto';

@ApiTags('competitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CompetitionsController {
  constructor(private competitionsService: CompetitionsService) {}

  @Get('competitions')
  @ApiOperation({ summary: 'Список соревнований' })
  findAll(@CurrentUser() user: any) {
    return this.competitionsService.findAll(user.orgId);
  }

  @Post('competitions')
  @ApiOperation({ summary: 'Создать соревнование' })
  create(@Body() dto: CreateCompetitionDto, @CurrentUser() user: any) {
    return this.competitionsService.create(dto, user.orgId);
  }

  @Get('competitions/:id')
  @ApiOperation({ summary: 'Детали соревнования' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.competitionsService.findOne(id, user.orgId);
  }

  @Post('competitions/:id/results')
  @ApiOperation({ summary: 'Добавить результат' })
  addResult(@Param('id') id: string, @Body() dto: CreateResultDto, @CurrentUser() user: any) {
    return this.competitionsService.addResult(id, dto, user.orgId);
  }

  @Get('athletes/:athleteId/competitions')
  @ApiOperation({ summary: 'Соревнования спортсмена' })
  getAthleteResults(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.competitionsService.getAthleteResults(athleteId, user.orgId);
  }

  @Patch('competitions/:id')
  @ApiOperation({ summary: 'Обновить соревнование' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.competitionsService.update(id, user.orgId, body);
  }

  @Delete('competitions/:id')
  @ApiOperation({ summary: 'Удалить соревнование' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.competitionsService.remove(id, user.orgId);
  }

  @Get('competitions/:id/approvals')
  @ApiOperation({ summary: 'Запросы допуска к соревнованию' })
  getApprovals(@Param('id') id: string, @CurrentUser() user: any) {
    return this.competitionsService.getApprovals(id, user.orgId);
  }

  @Post('competitions/:id/approvals')
  @ApiOperation({ summary: 'Создать/обновить запрос допуска' })
  upsertApproval(@Param('id') id: string, @Body() body: { athleteId: string; status: string }, @CurrentUser() user: any) {
    return this.competitionsService.upsertApproval(id, body.athleteId, user.id, user.orgId, body.status);
  }

  @Patch('competitions/:id/approvals/:athleteId/respond')
  @ApiOperation({ summary: 'Родитель отвечает на запрос допуска' })
  parentRespond(
    @Param('id') id: string,
    @Param('athleteId') athleteId: string,
    @Body() body: { status: 'approved' | 'rejected'; comment?: string },
    @CurrentUser() user: any,
  ) {
    return this.competitionsService.parentRespond(id, athleteId, user.id, body.status, body.comment);
  }

  @Get('parent/competition-approvals')
  @ApiOperation({ summary: 'Запросы допуска для родителя' })
  getParentApprovals(@CurrentUser() user: any) {
    return this.competitionsService.getParentApprovals(user.id, user.orgId);
  }
}
