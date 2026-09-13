import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt-auth.guard';
import type { UserRole } from './user-role.type';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email?: unknown; password?: unknown }) {
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
      throw new UnauthorizedException('Thieu email hoac mat khau.');
    }
    return this.authService.login(body.email.trim().toLowerCase(), body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.findPublicById(user.sub);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listUsers() {
    return this.authService.listUsers();
  }

  @Post('users')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createUser(@Body() body: { email?: unknown; password?: unknown; role?: unknown }) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = (typeof body?.role === 'string' ? body.role : 'ai_manager') as UserRole;
    return this.authService.createUser(email, password, role);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    await this.authService.deleteUser(id, user.sub);
    return { success: true };
  }
}
