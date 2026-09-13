import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContentService } from './content.service';
import type { ContentSchedule } from '@prisma/client';

interface SaveScheduleItemDto {
  dayOfWeek: number;
  theme: string | null;
  notes: string | null;
}

@Controller('api/content/schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentScheduleController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  getAll(): Promise<ContentSchedule[]> {
    return this.contentService.getSchedule();
  }

  @Post()
  @HttpCode(200)
  saveItem(@Body() body: SaveScheduleItemDto): Promise<ContentSchedule> {
    return this.contentService.saveScheduleItem(body.dayOfWeek, body.theme ?? null, body.notes ?? null);
  }
}
