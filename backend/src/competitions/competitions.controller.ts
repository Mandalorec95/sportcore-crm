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
}
