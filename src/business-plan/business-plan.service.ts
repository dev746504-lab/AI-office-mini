import { BadRequestException, Injectable } from '@nestjs/common';
import type { BusinessPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

@Injectable()
export class BusinessPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getByMonth(month: string): Promise<BusinessPlan | null> {
    if (!MONTH_PATTERN.test(month)) return null;
    return this.prisma.businessPlan.findUnique({ where: { month } });
  }

  async list(limit = 12): Promise<BusinessPlan[]> {
    return this.prisma.businessPlan.findMany({ orderBy: { month: 'desc' }, take: limit });
  }

  async upsert(month: string, targetRevenue: number, notes: string | null): Promise<BusinessPlan> {
    if (!MONTH_PATTERN.test(month)) {
      throw new BadRequestException('Thang phai co dinh dang "YYYY-MM", vi du "2026-09".');
    }
    if (!Number.isFinite(targetRevenue) || targetRevenue < 0) {
      throw new BadRequestException('Muc tieu doanh thu phai la so khong am.');
    }

    return this.prisma.businessPlan.upsert({
      where: { month },
      create: { month, targetRevenue: Math.trunc(targetRevenue), notes },
      update: { targetRevenue: Math.trunc(targetRevenue), notes },
    });
  }

  async delete(month: string): Promise<void> {
    await this.prisma.businessPlan.deleteMany({ where: { month } });
  }
}
