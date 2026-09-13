import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessPlanService } from './business-plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/** Chi Admin duoc xem/sua ke hoach kinh doanh. */
@Controller('api/business-plan')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BusinessPlanController {
  constructor(private readonly businessPlanService: BusinessPlanService) {}

  @Get()
  list() {
    return this.businessPlanService.list();
  }

  @Get(':month')
  async getOne(@Param('month') month: string) {
    const plan = await this.businessPlanService.getByMonth(month);
    if (!plan) {
      throw new NotFoundException(`Chua co ke hoach kinh doanh cho thang ${month}.`);
    }
    return plan;
  }

  @Post()
  @HttpCode(200)
  upsert(@Body() body: { month?: unknown; targetRevenue?: unknown; notes?: unknown }) {
    const month = typeof body?.month === 'string' ? body.month : '';
    const targetRevenue =
      typeof body?.targetRevenue === 'number' ? body.targetRevenue : Number(body?.targetRevenue);
    const notes = typeof body?.notes === 'string' && body.notes.trim() !== '' ? body.notes : null;
    return this.businessPlanService.upsert(month, targetRevenue, notes);
  }

  @Delete(':month')
  async remove(@Param('month') month: string) {
    await this.businessPlanService.delete(month);
    return { success: true };
  }
}
