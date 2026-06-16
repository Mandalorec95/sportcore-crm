import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AthletesService } from './athletes.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';

@ApiTags('athletes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('athletes')
export class AthletesController {
  constructor(
    private athletesService: AthletesService,
    private attendanceService: AttendanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список спортсменов' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.athletesService.findAll(user.orgId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Создать спортсмена' })
  create(@Body() dto: CreateAthleteDto, @CurrentUser() user: any) {
    return this.athletesService.create(dto, user.orgId);
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Готовность всех спортсменов к соревнованиям' })
  getAllReadiness(@CurrentUser() user: any) {
    return this.attendanceService.getAllAthletesReadiness(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка спортсмена' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.athletesService.findOne(id, user.orgId);
  }

  @Get(':id/sport-passport')
  @ApiOperation({ summary: 'Цифровой паспорт спортсмена' })
  getSportPassport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.athletesService.getSportPassport(id, user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить спортсмена' })
  update(@Param('id') id: string, @Body() dto: UpdateAthleteDto, @CurrentUser() user: any) {
    return this.athletesService.update(id, dto, user.orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Полностью удалить спортсмена' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.athletesService.remove(id, user.orgId, user);
  }
}
