import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список тренировок' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.sessionsService.findAll(user.orgId, query);
  }

  @Get('today')
  @ApiOperation({ summary: 'Тренировки сегодня' })
  today(@CurrentUser() user: any) {
    return this.sessionsService.getTodaySessions(user.orgId, user.coachId ?? undefined);
  }

  @Post()
  @ApiOperation({ summary: 'Создать тренировку' })
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: any) {
    return this.sessionsService.create(dto, user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали тренировки' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.findOne(id, user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тренировку' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.sessionsService.update(id, body, user.orgId);
  }
}
