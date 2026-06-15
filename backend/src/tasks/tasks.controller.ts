import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Список задач' })
  findAll(@CurrentUser() user: any) {
    return this.tasksService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать задачу' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(dto, user.orgId, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задачу' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>, @CurrentUser() user: any) {
    return this.tasksService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user.orgId);
  }
}
