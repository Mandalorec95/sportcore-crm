import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Мои уведомления' })
  findAll(@CurrentUser() user: any) {
    return this.notificationsService.findForUser(user.sub, user.orgId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Кол-во непрочитанных' })
  unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить прочитанным' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Get('all')
  @ApiOperation({ summary: 'Все уведомления организации (admin)' })
  findAllOrg(@CurrentUser() user: any) {
    return this.notificationsService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать уведомление' })
  create(@Body() body: { recipientId?: string; type: string; title: string; message: string }, @CurrentUser() user: any) {
    const recipientId = body.recipientId || user.sub;
    return this.notificationsService.create(user.orgId, recipientId, body.type, body.title, body.message);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить уведомление' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.notificationsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
