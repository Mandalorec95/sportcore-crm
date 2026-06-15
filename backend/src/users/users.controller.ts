import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Все пользователи организации' })
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать пользователя' })
  create(
    @Body() body: { fullName: string; email: string; role: 'admin' | 'coach' | 'parent'; phone?: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.create(user.orgId, body);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Обновить свой профиль' })
  updateProfile(
    @Body() body: { fullName?: string; email?: string; phone?: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Сменить пароль' })
  changePassword(@Body() body: { newPassword: string }, @CurrentUser() user: any) {
    return this.usersService.changePassword(user.sub, body.newPassword);
  }

  @Post(':id/generate-password')
  @ApiOperation({ summary: 'Сгенерировать новый пароль для пользователя' })
  generatePassword(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.generateNewPassword(id, user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  update(
    @Param('id') id: string,
    @Body() body: { fullName?: string; email?: string; phone?: string; role?: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, user.orgId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.orgId);
  }
}
