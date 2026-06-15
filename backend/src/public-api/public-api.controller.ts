import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PublicApiGuard } from './public-api.guard';
import { AthletesService } from '../athletes/athletes.service';
import { GroupsService } from '../groups/groups.service';
import { CompetitionsService } from '../competitions/competitions.service';
import { PaymentsService } from '../payments/payments.service';
import { AttendanceService } from '../attendance/attendance.service';
import { ProgressService } from '../progress/progress.service';

@ApiTags('public-api')
@ApiSecurity('api-key')
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
  getSportPassport(@Param('id') id: string, @Req() req: any) {
    return this.athletesService.getSportPassport(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/attendance')
  @ApiOperation({ summary: '[PUBLIC] Посещаемость спортсмена' })
  getAttendance(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.getAthleteAttendance(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/progress')
  @ApiOperation({ summary: '[PUBLIC] Прогресс спортсмена' })
  getProgress(@Param('id') id: string, @Req() req: any) {
    return this.progressService.findByAthlete(id);
  }

  @Get('athletes/:id/competitions')
  @ApiOperation({ summary: '[PUBLIC] Соревнования спортсмена' })
  getCompetitions(@Param('id') id: string, @Req() req: any) {
    return this.competitionsService.getAthleteResults(id, req.apiContext.orgId);
  }

  @Get('athletes/:id/payments')
  @ApiOperation({ summary: '[PUBLIC] Статус оплат спортсмена' })
  getPayments(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.getAthleteBalance(id, req.apiContext.orgId);
  }

  @Get('groups/:id/schedule')
  @ApiOperation({ summary: '[PUBLIC] Расписание группы' })
  getSchedule(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(id, req.apiContext.orgId).then((g) => g.schedules);
  }

  @Get('competitions')
  @ApiOperation({ summary: '[PUBLIC] Список соревнований' })
  getCompetitionsList(@Req() req: any) {
    return this.competitionsService.findAll(req.apiContext.orgId);
  }
}
