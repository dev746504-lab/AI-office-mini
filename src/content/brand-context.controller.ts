import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContentService } from './content.service';
import type { BrandContext } from '@prisma/client';

@Controller('api/content/brand-context')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BrandContextController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  get(): Promise<BrandContext | null> {
    return this.contentService.getBrandContext();
  }

  @Post()
  @HttpCode(200)
  save(@Body() body: Partial<Omit<BrandContext, 'id' | 'updatedAt'>>): Promise<BrandContext> {
    return this.contentService.saveBrandContext(body);
  }
}
