import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Список групп' })
  findAll(@CurrentUser() user: any) {
    return this.groupsService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать группу' })
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.create(dto, user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка группы' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.findOne(id, user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить группу' })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.update(id, dto, user.orgId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Добавить спортсмена в группу' })
  addMember(@Param('id') id: string, @Body() body: { athleteId: string }, @CurrentUser() user: any) {
    return this.groupsService.addMember(id, body.athleteId, user.orgId);
  }

  @Delete(':id/members/:athleteId')
  @ApiOperation({ summary: 'Убрать спортсмена из группы' })
  removeMember(@Param('id') id: string, @Param('athleteId') athleteId: string, @CurrentUser() user: any) {
    return this.groupsService.removeMember(id, athleteId, user.orgId);
  }
}
