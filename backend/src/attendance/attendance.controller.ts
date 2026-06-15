import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('sessions/:sessionId/attendance')
  @ApiOperation({ summary: 'Посещаемость на тренировке' })
  getSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getSessionAttendance(sessionId);
  }

  @Post('sessions/:sessionId/attendance/bulk')
  @ApiOperation({ summary: 'Отметить посещаемость (массово)' })
  bulk(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.bulkCreate(sessionId, dto, user.sub);
  }

  @Get('athletes/:athleteId/attendance')
  @ApiOperation({ summary: 'Посещаемость спортсмена' })
  getAthleteAttendance(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.attendanceService.getAthleteAttendance(athleteId, user.orgId);
  }

  @Get('athletes/:athleteId/attendance-stats')
  @ApiOperation({ summary: 'Статистика посещаемости спортсмена' })
  getAthleteStats(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.attendanceService.getAthleteStats(athleteId, user.orgId);
  }
}
