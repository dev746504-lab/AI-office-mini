import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { AppSettings } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/** Chi Admin duoc xem/sua cau hinh he thong. */
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(): Promise<AppSettings> {
    return this.settingsService.getSettings();
  }

  @Post()
  @HttpCode(200)
  saveSettings(
    @Body() body: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>,
  ): Promise<AppSettings> {
    return this.settingsService.saveSettings(body);
  }
}
