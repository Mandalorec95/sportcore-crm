import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Войти в систему' })
  @ApiOkResponse({
    description: 'JWT access token and current user profile.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user-admin-001',
          email: 'admin@sportcrm.ru',
          fullName: 'Дудаев Мовлади Сайд-Эмиевич',
          role: 'admin',
          orgId: 'org-demo-001',
          coachId: null,
          parentId: null,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь' })
  @ApiOkResponse({ description: 'Current user profile resolved from Bearer token.' })
  me(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }
}
