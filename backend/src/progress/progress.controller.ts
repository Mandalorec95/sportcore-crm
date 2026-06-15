import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('athletes/:athleteId/progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Прогресс спортсмена' })
  findByAthlete(@Param('athleteId') athleteId: string) {
    return this.progressService.findByAthlete(athleteId);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить запись прогресса' })
  create(@Param('athleteId') athleteId: string, @Body() dto: CreateProgressDto, @CurrentUser() user: any) {
    return this.progressService.create(athleteId, dto, user.coachId ?? undefined);
  }
}
