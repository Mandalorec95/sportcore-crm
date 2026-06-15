import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PublicApiGuard } from './public-api.guard';
import { AthletesService } from '../athletes/athletes.service';
import { GroupsService } from '../groups/groups.service';
import { CompetitionsService } from '../competitions/competitions.service';
import { PaymentsService } from '../payments/payments.service';
import { AttendanceService } from '../attendance/attendance.service';
import { ProgressService } from '../progress/progress.service';

@ApiTags('public-api')
@ApiSecurity('api-key')
@ApiHeader({
  name: 'X-API-Key',
  required: true,
  description: 'API key created in the admin panel. Example: sp_live_...',
})
@ApiUnauthorizedResponse({ description: 'Missing, invalid, inactive, or insufficient API key.' })
@UseGuards(PublicApiGuard)
@Controller('public/v1')
export class PublicApiController {
  constructor(
    private athletesService: AthletesService,
    private groupsService: GroupsService,
    private competitionsService: CompetitionsService,
    private paymentsService: PaymentsService,
    private attendanceService: AttendanceService,
    private progressService: ProgressService,
  ) {}

  @Get('athletes/:id')
  @ApiOperation({ summary: '[PUBLIC] Цифровой паспорт спортсмена' })
  @ApiParam({ name: 'id', description: 'Athlete ID', example: 'ath-001' })
  @ApiOkResponse({ description: 'Athlete sport passport with profile, attendance, payments, documents, competitions, and progress.' })
  getSportPassport(@Param('id') id: string, @Req() req: any) {
    return this.athletesService.getSportPassport(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/attendance')
  @ApiOperation({ summary: '[PUBLIC] Посещаемость спортсмена' })
  @ApiParam({ name: 'id', description: 'Athlete ID', example: 'ath-001' })
  getAttendance(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.getAthleteAttendance(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/progress')
  @ApiOperation({ summary: '[PUBLIC] Прогресс спортсмена' })
  @ApiParam({ name: 'id', description: 'Athlete ID', example: 'ath-001' })
  getProgress(@Param('id') id: string, @Req() req: any) {
    return this.progressService.findByAthlete(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/competitions')
  @ApiOperation({ summary: '[PUBLIC] Соревнования спортсмена' })
  @ApiParam({ name: 'id', description: 'Athlete ID', example: 'ath-001' })
  getCompetitions(@Param('id') id: string, @Req() req: any) {
    return this.competitionsService.getAthleteResults(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/payments')
  @ApiOperation({ summary: '[PUBLIC] Статус оплат спортсмена' })
  @ApiParam({ name: 'id', description: 'Athlete ID', example: 'ath-001' })
  getPayments(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.getAthleteBalance(id, req.apiContext.orgId);
  }

  @Get('groups/:id/schedule')
  @ApiOperation({ summary: '[PUBLIC] Расписание группы' })
  @ApiParam({ name: 'id', description: 'Group ID', example: 'group-001' })
  getSchedule(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(id, req.apiContext.orgId).then((g) => g.schedules);
  }

  @Get('competitions')
  @ApiOperation({ summary: '[PUBLIC] Список соревнований' })
  getCompetitionsList(@Req() req: any) {
    return this.competitionsService.findAll(req.apiContext.orgId);
  }
}
