import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── Interfaces for financial calculations ──

export interface CostBreakdownItem {
  category: string;
  type: 'cogs' | 'labor' | 'opex';
  amount: number;
}

export interface PreviousPeriodSummary {
  netRevenue: number;
  cogs: number;
  laborCost: number;
  netProfit: number;
}

export interface FinancialSummary {
  cogs: number;
  laborCost: number;
  opex: number;
  fixedCosts: number;
  variableCostRatio: number;
  netProfit: number;
  primeCostPct: number;
  foodCostPct: number;
  laborCostPct: number;
  netProfitMarginPct: number;
  breakEvenRevenue: number;
  breakEvenOrders: number;
  costsByCategory: CostBreakdownItem[];
  previousPeriod: PreviousPeriodSummary | null;
}

export interface HistoricalMonth {
  month: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

export interface NetProfitResult {
  grossRevenue: number;
  discount: number;
  netRevenue: number;
  cogs: number;
  laborCost: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPct: number;
  netProfitMarginPct: number;
}

export interface BreakEvenResult {
  breakEvenRevenue: number;
  breakEvenOrders: number;
  breakEvenDays: number;
  marginOfSafety: number;
  marginOfSafetyPct: number;
  isAboveBreakEven: boolean;
}

export interface MonthlyPlanSuggestion {
  suggestedRevenue: number;
  suggestedOrders: number;
  suggestedAvgTicket: number;
  avgGrowthPct: number;
  basedOnMonths: number;
  note: string;
}

export interface PerformanceStatus {
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'AHEAD';
  progressPct: number;
  adjustedProgressPct: number;
  daysElapsed: number;
  totalDays: number;
  dailyRunRate: number;
  requiredDailyRate: number;
  projectedMonthEnd: number;
  gapToTarget: number;
}

// ── Service ──

@Injectable()
export class FnbFinanceService {
  private readonly logger = new Logger(FnbFinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate full P&L (Net Profit) from revenue and categorized costs.
   */
  calculateNetProfit(
    netRevenue: number,
    discount: number,
    costs: CostBreakdownItem[],
  ): NetProfitResult {
    const grossRevenue = netRevenue + discount;
    const cogs = costs.filter((c) => c.type === 'cogs').reduce((sum, c) => sum + c.amount, 0);
    const laborCost = costs.filter((c) => c.type === 'labor').reduce((sum, c) => sum + c.amount, 0);
    const opex = costs.filter((c) => c.type === 'opex').reduce((sum, c) => sum + c.amount, 0);
    const grossProfit = netRevenue - cogs;
    const netProfit = grossProfit - laborCost - opex;

    return {
      grossRevenue,
      discount,
      netRevenue,
      cogs,
      laborCost,
      opex,
      grossProfit,
      netProfit,
      grossMarginPct: netRevenue > 0 ? round1((grossProfit / netRevenue) * 100) : 0,
      netProfitMarginPct: netRevenue > 0 ? round1((netProfit / netRevenue) * 100) : 0,
    };
  }

  /**
   * Calculate F&B key ratios: Food Cost %, Labor Cost %, Prime Cost %.
   */
  calculateFnbRatios(netRevenue: number, cogs: number, laborCost: number) {
    const primeCost = cogs + laborCost;
    return {
      foodCostPct: netRevenue > 0 ? round1((cogs / netRevenue) * 100) : 0,
      laborCostPct: netRevenue > 0 ? round1((laborCost / netRevenue) * 100) : 0,
      primeCostPct: netRevenue > 0 ? round1((primeCost / netRevenue) * 100) : 0,
    };
  }

  /**
   * Break-even analysis: how much revenue / how many orders needed to cover fixed costs.
   */
  calculateBreakEven(
    fixedCosts: number,
    variableCostRatio: number,
    actualRevenue: number,
    avgTicket: number,
    daysInPeriod: number,
    avgDailyRevenue: number,
  ): BreakEvenResult {
    const contributionMarginRatio = 1 - variableCostRatio;
    const breakEvenRevenue =
      contributionMarginRatio > 0 ? Math.ceil(fixedCosts / contributionMarginRatio) : 0;
    const breakEvenOrders = avgTicket > 0 ? Math.ceil(breakEvenRevenue / avgTicket) : 0;
    const breakEvenDays =
      avgDailyRevenue > 0 ? Math.ceil(breakEvenRevenue / avgDailyRevenue) : daysInPeriod;
    const marginOfSafety = actualRevenue - breakEvenRevenue;
    const marginOfSafetyPct =
      breakEvenRevenue > 0 ? round1((marginOfSafety / breakEvenRevenue) * 100) : 0;

    return {
      breakEvenRevenue,
      breakEvenOrders,
      breakEvenDays,
      marginOfSafety,
      marginOfSafetyPct,
      isAboveBreakEven: actualRevenue >= breakEvenRevenue,
    };
  }

  /**
   * Suggest a monthly plan based on historical revenue data.
   * Returns null if fewer than 2 months of history available.
   */
  generateMonthlyPlan(history: HistoricalMonth[]): MonthlyPlanSuggestion | null {
    if (history.length < 2) return null;

    const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
    const growthRates: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].revenue > 0) {
        growthRates.push(
          ((sorted[i].revenue - sorted[i - 1].revenue) / sorted[i - 1].revenue) * 100,
        );
      }
    }

    const avgGrowthPct =
      growthRates.length > 0
        ? round1(growthRates.reduce((s, r) => s + r, 0) / growthRates.length)
        : 0;

    const lastMonth = sorted[sorted.length - 1];
    const suggestedRevenue = Math.round(lastMonth.revenue * (1 + avgGrowthPct / 100));
    const lastAvgTicket =
      lastMonth.orders > 0 ? Math.round(lastMonth.revenue / lastMonth.orders) : lastMonth.avgTicket;
    const suggestedOrders =
      lastAvgTicket > 0 ? Math.round(suggestedRevenue / lastAvgTicket) : lastMonth.orders;

    return {
      suggestedRevenue,
      suggestedOrders,
      suggestedAvgTicket: lastAvgTicket,
      avgGrowthPct,
      basedOnMonths: sorted.length,
      note: `De xuat dua tren tang truong binh quan ${avgGrowthPct}%/thang cua ${sorted.length} thang gan nhat. Day la de xuat can Admin xac nhan tai man hinh Ke hoach Kinh doanh.`,
    };
  }

  /**
   * Check actual performance against the business plan target.
   */
  checkPerformance(
    actualRevenue: number,
    targetRevenue: number,
    daysElapsed: number,
    totalDaysInMonth: number,
  ): PerformanceStatus {
    const progressPct = targetRevenue > 0 ? round1((actualRevenue / targetRevenue) * 100) : 0;
    const timeProgressPct = totalDaysInMonth > 0 ? (daysElapsed / totalDaysInMonth) * 100 : 100;
    const adjustedProgressPct = timeProgressPct > 0 ? round1(progressPct / (timeProgressPct / 100)) : 0;

    const dailyRunRate = daysElapsed > 0 ? Math.round(actualRevenue / daysElapsed) : 0;
    const remainingDays = totalDaysInMonth - daysElapsed;
    const remainingTarget = targetRevenue - actualRevenue;
    const requiredDailyRate = remainingDays > 0 ? Math.round(remainingTarget / remainingDays) : 0;
    const projectedMonthEnd = dailyRunRate * totalDaysInMonth;
    const gapToTarget = projectedMonthEnd - targetRevenue;

    let status: PerformanceStatus['status'];
    if (adjustedProgressPct >= 105) status = 'AHEAD';
    else if (adjustedProgressPct >= 95) status = 'ON_TRACK';
    else if (adjustedProgressPct >= 80) status = 'AT_RISK';
    else status = 'OFF_TRACK';

    return {
      status,
      progressPct,
      adjustedProgressPct,
      daysElapsed,
      totalDays: totalDaysInMonth,
      dailyRunRate,
      requiredDailyRate,
      projectedMonthEnd,
      gapToTarget,
    };
  }

  /**
   * Build the complete FinancialSummary for a given month by aggregating
   * cost data from the database. Returns null if no cost data exists.
   */
  async buildFinancialSummary(
    month: string,
    netRevenue: number,
    totalOrders: number,
    previousMonthRevenue?: number,
  ): Promise<FinancialSummary | null> {
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0);

    const dailyCosts = await this.prisma.dailyCost.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    if (dailyCosts.length === 0) {
      this.logger.log(`[FnbFinance] Khong co du lieu chi phi cho thang ${month}`);
      return null;
    }

    const costsByCategory: CostBreakdownItem[] = [];
    const categoryTotals = new Map<number, { name: string; type: string; total: number }>();

    for (const dc of dailyCosts) {
      const existing = categoryTotals.get(dc.categoryId);
      if (existing) {
        existing.total += dc.amount;
      } else {
        categoryTotals.set(dc.categoryId, {
          name: dc.category.name,
          type: dc.category.type,
          total: dc.amount,
        });
      }
    }

    for (const [, val] of categoryTotals) {
      costsByCategory.push({
        category: val.name,
        type: val.type as CostBreakdownItem['type'],
        amount: val.total,
      });
    }

    const cogs = costsByCategory
      .filter((c) => c.type === 'cogs')
      .reduce((s, c) => s + c.amount, 0);
    const laborCost = costsByCategory
      .filter((c) => c.type === 'labor')
      .reduce((s, c) => s + c.amount, 0);
    const opex = costsByCategory
      .filter((c) => c.type === 'opex')
      .reduce((s, c) => s + c.amount, 0);
    const netProfit = netRevenue - cogs - laborCost - opex;

    const ratios = this.calculateFnbRatios(netRevenue, cogs, laborCost);

    const fixedCategories = await this.prisma.costCategory.findMany({ where: { isFixed: true } });
    const fixedCategoryIds = new Set(fixedCategories.map((c) => c.id));
    const fixedCosts = dailyCosts
      .filter((dc) => fixedCategoryIds.has(dc.categoryId))
      .reduce((s, dc) => s + dc.amount, 0);

    const variableCosts = cogs + laborCost + opex - fixedCosts;
    const variableCostRatio = netRevenue > 0 ? round1(variableCosts / netRevenue * 100) / 100 : 0;

    const avgTicket = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;
    const daysInMonth = endDate.getDate();
    const avgDailyRevenue = daysInMonth > 0 ? Math.round(netRevenue / daysInMonth) : 0;

    const breakEven = this.calculateBreakEven(
      fixedCosts,
      variableCostRatio,
      netRevenue,
      avgTicket,
      daysInMonth,
      avgDailyRevenue,
    );

    let previousPeriod: PreviousPeriodSummary | null = null;
    if (previousMonthRevenue !== undefined) {
      const prevMonth = mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, '0')}`;
      const prevSummary = await this.buildPreviousPeriodCosts(prevMonth);
      if (prevSummary) {
        previousPeriod = {
          netRevenue: previousMonthRevenue,
          cogs: prevSummary.cogs,
          laborCost: prevSummary.laborCost,
          netProfit: previousMonthRevenue - prevSummary.cogs - prevSummary.laborCost - prevSummary.opex,
        };
      }
    }

    return {
      cogs,
      laborCost,
      opex,
      fixedCosts,
      variableCostRatio,
      netProfit,
      ...ratios,
      netProfitMarginPct: netRevenue > 0 ? round1((netProfit / netRevenue) * 100) : 0,
      breakEvenRevenue: breakEven.breakEvenRevenue,
      breakEvenOrders: breakEven.breakEvenOrders,
      costsByCategory,
      previousPeriod,
    };
  }

  /**
   * Fetch historical monthly summaries from ReportLog + cost data
   * for plan suggestion.
   */
  async getHistoricalMonths(count: number): Promise<HistoricalMonth[]> {
    const logs = await this.prisma.reportLog.findMany({
      where: { periodType: 'month', status: 'success' },
      orderBy: { reportDate: 'desc' },
      take: count,
    });

    return logs.map((log) => {
      const d = new Date(log.reportDate);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        month: monthStr,
        revenue: 0,
        orders: log.invoiceCount,
        avgTicket: 0,
      };
    });
  }

  private async buildPreviousPeriodCosts(
    month: string,
  ): Promise<{ cogs: number; laborCost: number; opex: number } | null> {
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0);

    const costs = await this.prisma.dailyCost.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    if (costs.length === 0) return null;

    let cogs = 0, laborCost = 0, opex = 0;
    for (const c of costs) {
      if (c.category.type === 'cogs') cogs += c.amount;
      else if (c.category.type === 'labor') laborCost += c.amount;
      else opex += c.amount;
    }
    return { cogs, laborCost, opex };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
