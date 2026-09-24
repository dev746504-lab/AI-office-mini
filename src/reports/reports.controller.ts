import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PeriodKiotVietData } from './interfaces/kiotviet-data.interface';

interface AuthRequest extends Request {
  user: { userId: number; email: string; role: string };
}

interface CreateFeedbackDto {
  rating: number;
  comment?: string;
}

@Controller('api/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Lịch sử báo cáo ───────────────────────────────────────────────────────

  @Get('logs')
  @Roles('admin', 'ai_manager')
  async getReportLogs() {
    const logs = await this.prisma.reportLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      periodType: log.periodType,
      reportDate: log.reportDate,
      status: log.status,
      invoiceCount: log.invoiceCount,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      latestFeedback: log.feedbacks[0] ?? null,
    }));
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  @Post(':id/feedback')
  @HttpCode(200)
  @Roles('admin', 'ai_manager')
  async submitFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateFeedbackDto,
    @Request() req: AuthRequest,
  ) {
    const { rating, comment } = body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('rating phai la so nguyen tu 1 den 5');
    }

    const reportLog = await this.prisma.reportLog.findUnique({ where: { id } });
    if (!reportLog) {
      throw new Error(`Khong tim thay bao cao voi id=${id}`);
    }

    const feedback = await this.prisma.reportFeedback.create({
      data: {
        reportLogId: id,
        rating,
        comment: comment ?? null,
        createdBy: req.user?.email ?? 'unknown',
      },
    });

    this.logger.log(`[Feedback] Bao cao #${id} duoc danh gia ${rating}/5 boi ${feedback.createdBy}`);
    return feedback;
  }

  @Get('feedback')
  @Roles('admin')
  async getAllFeedback() {
    return this.prisma.reportFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        reportLog: {
          select: { periodType: true, reportDate: true, status: true },
        },
      },
    });
  }

  // ── Test email ────────────────────────────────────────────────────────────

  @Post('test-email')
  @HttpCode(200)
  @Roles('admin')
  async sendTestEmail(): Promise<{ message: string }> {
    this.logger.log('[TestEmail] Bat dau gui email test...');

    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const toDate = fmt(today);
    const fromDate = fmt(new Date(today.getTime() - 6 * 86400000));

    const fakeData: PeriodKiotVietData = {
      periodType: 'week',
      periodLabel: `Tuần ${toDate} (TEST)`,
      fromDate,
      toDate,
      totalRevenue: 18_500_000,
      totalInvoices: 73,
      totalDiscount: 1_200_000,
      newDebtInPeriod: 500_000,
      dailyBreakdown: [
        { date: fmt(new Date(today.getTime() - 6 * 86400000)), revenue: 2_100_000, invoiceCount: 9, discount: 150_000 },
        { date: fmt(new Date(today.getTime() - 5 * 86400000)), revenue: 3_200_000, invoiceCount: 12, discount: 200_000 },
        { date: fmt(new Date(today.getTime() - 4 * 86400000)), revenue: 2_800_000, invoiceCount: 11, discount: 180_000 },
        { date: fmt(new Date(today.getTime() - 3 * 86400000)), revenue: 2_500_000, invoiceCount: 10, discount: 160_000 },
        { date: fmt(new Date(today.getTime() - 2 * 86400000)), revenue: 3_100_000, invoiceCount: 13, discount: 210_000 },
        { date: fmt(new Date(today.getTime() - 1 * 86400000)), revenue: 2_900_000, invoiceCount: 11, discount: 190_000 },
        { date: toDate, revenue: 1_900_000, invoiceCount: 7, discount: 110_000 },
      ],
      topProducts: [
        { productName: 'Cà phê sữa đá', quantity: 42, revenue: 3_780_000 },
        { productName: 'Trà đào cam sả', quantity: 35, revenue: 2_975_000 },
        { productName: 'Bánh croissant', quantity: 28, revenue: 1_960_000 },
        { productName: 'Matcha latte', quantity: 22, revenue: 2_090_000 },
        { productName: 'Cà phê đen đá', quantity: 19, revenue: 1_330_000 },
      ],
      topDebtCustomers: [
        { customerName: 'Nguyễn Văn A', debtAmount: 300_000 },
        { customerName: 'Trần Thị B', debtAmount: 200_000 },
      ],
      invoices: null,
      businessPlan: {
        month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
        targetRevenue: 80_000_000,
        targetOrders: 300,
        targetAvgTicket: 267_000,
        costBudgetTotal: null,
        notes: 'Mục tiêu tháng này — data test',
      },
      financialSummary: {
        cogs: 5_550_000,
        laborCost: 3_700_000,
        opex: 2_000_000,
        fixedCosts: 1_500_000,
        variableCostRatio: 0.3,
        netProfit: 7_250_000,
        primeCostPct: 49.7,
        foodCostPct: 30.0,
        laborCostPct: 20.0,
        netProfitMarginPct: 39.2,
        breakEvenRevenue: 7_692_308,
        breakEvenOrders: 29,
        costsByCategory: [
          { category: 'Nguyên liệu F&B', type: 'cogs', amount: 5_550_000 },
          { category: 'Nhân viên pha chế', type: 'labor', amount: 2_500_000 },
          { category: 'Nhân viên phục vụ', type: 'labor', amount: 1_200_000 },
          { category: 'Thuê mặt bằng', type: 'opex', amount: 1_200_000 },
          { category: 'Điện nước', type: 'opex', amount: 500_000 },
          { category: 'Marketing', type: 'opex', amount: 300_000 },
        ],
        previousPeriod: {
          netRevenue: 16_800_000,
          cogs: 5_040_000,
          laborCost: 3_360_000,
          netProfit: 6_200_000,
        },
      },
      historicalMonths: null,
    };

    const htmlBody = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;font-family:Arial,sans-serif;">
        <tr><td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:680px;">
            <tr>
              <td style="background:#1a1a2e;padding:20px 28px;">
                <h2 style="margin:0;color:#00d4aa;font-size:18px;">EMAIL TEST — ${fakeData.periodLabel}</h2>
                <p style="margin:4px 0 0;color:#aaa;font-size:13px;">Dữ liệu giả — kiểm tra kết nối SMTP &amp; file Excel đính kèm</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#e0e0e0;">
                  <tr style="background:#f1f3f4;">
                    <th style="text-align:left;font-size:13px;">Chỉ số</th>
                    <th style="text-align:right;font-size:13px;">Giá trị</th>
                  </tr>
                  <tr><td>Doanh thu tuần</td><td style="text-align:right;">18.500.000 đ</td></tr>
                  <tr style="background:#f9f9f9;"><td>Số hóa đơn</td><td style="text-align:right;">73</td></tr>
                  <tr><td>Chiết khấu</td><td style="text-align:right;">1.200.000 đ</td></tr>
                  <tr style="background:#f9f9f9;"><td>Lợi nhuận ròng</td><td style="text-align:right;color:#1e7e34;">7.250.000 đ</td></tr>
                </table>
                <p style="margin:20px 0 0;font-size:13px;color:#555;">
                  Nếu bạn nhận được email này kèm file Excel, hệ thống SMTP đã hoạt động đúng.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 20px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:11px;color:#999;">Email test tự động — AI Office Mini</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    `;

    await this.emailService.sendReport('week', fakeData.periodLabel, htmlBody, fakeData);
    this.logger.log('[TestEmail] Gui email test thanh cong.');
    return { message: 'Email test đã được gửi thành công.' };
  }
}
