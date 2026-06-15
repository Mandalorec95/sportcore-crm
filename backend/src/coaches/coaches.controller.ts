import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CoachesService } from './coaches.service';

@ApiTags('coaches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coaches')
export class CoachesController {
  constructor(private coachesService: CoachesService) {}

  @Get()
  @ApiOperation({ summary: 'Список тренеров' })
  findAll(@CurrentUser() user: any) {
    return this.coachesService.findAll(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка тренера' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coachesService.findOne(id, user.orgId);
  }

  @Get(':id/today-sessions')
  @ApiOperation({ summary: 'Тренировки тренера сегодня' })
  todaySessions(@Param('id') id: string) {
    return this.coachesService.getTodaySessions(id);
  }
}
