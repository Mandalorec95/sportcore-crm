import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ParentsService } from './parents.service';

@ApiTags('parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private parentsService: ParentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список родителей' })
  findAll(@CurrentUser() user: any) {
    return this.parentsService.findAll(user.orgId);
  }

  @Get('my-children')
  @ApiOperation({ summary: 'Мои дети (кабинет родителя)' })
  myChildren(@CurrentUser() user: any) {
    return this.parentsService.getMyChildren(user.parentId);
  }
}
