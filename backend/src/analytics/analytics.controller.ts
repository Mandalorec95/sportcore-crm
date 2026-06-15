import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Дашборд организации' })
  dashboard(@CurrentUser() user: any) {
    return this.analyticsService.getDashboard(user.orgId);
  }

  @Get('athletes/:athleteId/risk')
  @ApiOperation({ summary: 'Риск ухода спортсмена' })
  risk(@Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.analyticsService.getAthleteRisk(athleteId, user.orgId);
  }
}
