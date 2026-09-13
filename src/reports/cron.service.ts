import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KiotVietService } from './kiotviet.service';
import { ClaudeService } from './claude.service';
import { EmailService } from './email.service';
import { SettingsService } from '../settings/settings.service';
import { BusinessPlanService } from '../business-plan/business-plan.service';
import { PrismaService } from '../prisma/prisma.service';
import type { BusinessPlanSummary, ReportPeriodType } from './interfaces/kiotviet-data.interface';

const REPORT_TIMEZONE = 'Asia/Ho_Chi_Minh';

interface VnDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  /** Chan gui trung neu 1 lan chay bao cao keo dai qua phut ke tiep. Key: "periodType:reportDate". */
  private readonly inFlightKeys = new Set<string>();

  constructor(
    private readonly kiotVietService: KiotVietService,
    private readonly claudeService: ClaudeService,
    private readonly emailService: EmailService,
    private readonly settingsService: SettingsService,
    private readonly businessPlanService: BusinessPlanService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chay moi phut (dung giay :00, theo gio Viet Nam) va doi chieu voi gio
   * gui bao cao dang cau hinh trong Settings (DB). Tai dung thoi diem nay,
   * ngoai bao cao NGAY (luon chay), con tu dong kiem tra co phai vua hoan
   * tat 1 tuan (Thu Hai - Chu Nhat) hoac 1 thang khong de chay them bao cao
   * TUAN/THANG tuong ung - khong can cau hinh lich rieng.
   */
  @Cron('0 * * * * *', { timeZone: REPORT_TIMEZONE })
  async handleScheduleTick(): Promise<void> {
    const settings = await this.settingsService.getSettings();
    const targetHour = settings.reportSendHour ?? 23;
    const targetMinute = settings.reportSendMinute ?? 0;

    const now = this.getVnParts(new Date());
    if (now.hour !== targetHour || now.minute !== targetMinute) {
      return;
    }

    // Bao cao luon phan anh TRON VEN ky da ket thuc (khong bao gio bi thieu
    // du lieu vi ky chua ket thuc), bat ke gio gui duoc chon la luc nao.
    const yesterday = this.getYesterdayVnDateStr(new Date());

    await this.triggerIfNeeded('day', yesterday, yesterday);

    if (this.isSunday(yesterday)) {
      const monday = this.addDays(yesterday, -6);
      await this.triggerIfNeeded('week', monday, yesterday);
    }

    if (this.isLastDayOfMonth(yesterday)) {
      const firstOfMonth = yesterday.slice(0, 8) + '01';
      await this.triggerIfNeeded('month', firstOfMonth, yesterday);
    }
  }

  private async triggerIfNeeded(periodType: ReportPeriodType, fromDateStr: string, toDateStr: string): Promise<void> {
    const key = `${periodType}:${toDateStr}`;
    if (this.inFlightKeys.has(key)) return;

    const existing = await this.prisma.reportLog.findUnique({
      where: { periodType_reportDate: { periodType, reportDate: this.toDateOnly(toDateStr) } },
    });
    if (existing) return;

    this.inFlightKeys.add(key);
    try {
      await this.runReport(periodType, fromDateStr, toDateStr);
    } finally {
      this.inFlightKeys.delete(key);
    }
  }

  /**
   * Tach rieng logic chay bao cao (khong gan voi lich chay) de co the goi
   * thu cong khi can (vi du: chay lai bao cao cua 1 ky bi loi).
   */
  async runReport(periodType: ReportPeriodType, fromDateStr: string, toDateStr: string): Promise<void> {
    const periodLabel = this.buildPeriodLabel(periodType, fromDateStr, toDateStr);
    this.logger.log(`===== BAT DAU CHAY BAO CAO (${periodType.toUpperCase()}) ${periodLabel} =====`);

    let invoiceCount = 0;

    try {
      const businessPlan = await this.resolveBusinessPlan(toDateStr);

      this.logger.log('[Buoc 1/3] Lay du lieu tu KiotViet...');
      const reportData = await this.kiotVietService.fetchReportData(
        fromDateStr,
        toDateStr,
        periodType,
        periodLabel,
        businessPlan,
      );
      invoiceCount = reportData.totalInvoices;
      this.logger.log(`[Buoc 1/3] Hoan tat - ${invoiceCount} hoa don.`);

      this.logger.log('[Buoc 2/3] Goi Claude Multi-Agent de phan tich va dung bao cao...');
      const htmlReport = await this.claudeService.generateReport(reportData);
      this.logger.log('[Buoc 2/3] Hoan tat - da co noi dung bao cao HTML.');

      this.logger.log('[Buoc 3/3] Gui email bao cao...');
      await this.emailService.sendReport(periodType, periodLabel, htmlReport);
      this.logger.log('[Buoc 3/3] Hoan tat - da gui email.');

      await this.prisma.reportLog.create({
        data: {
          periodType,
          reportDate: this.toDateOnly(toDateStr),
          status: 'success',
          invoiceCount,
          errorMessage: null,
        },
      });

      this.logger.log(`===== HOAN TAT BAO CAO (${periodType.toUpperCase()}) ${periodLabel} THANH CONG =====`);
    } catch (error) {
      const message = (error as Error).message ?? 'Loi khong xac dinh';
      this.logger.error(`===== BAO CAO (${periodType.toUpperCase()}) ${periodLabel} THAT BAI: ${message} =====`);

      await this.prisma.reportLog.create({
        data: {
          periodType,
          reportDate: this.toDateOnly(toDateStr),
          status: 'failed',
          invoiceCount,
          errorMessage: message,
        },
      });
    }
  }

  /** Lay ke hoach kinh doanh cua thang chua ngay cuoi ky (toDateStr) - null neu chua cau hinh. */
  private async resolveBusinessPlan(toDateStr: string): Promise<BusinessPlanSummary | null> {
    const month = toDateStr.slice(0, 7); // "YYYY-MM"
    const plan = await this.businessPlanService.getByMonth(month);
    if (!plan) return null;
    return { month: plan.month, targetRevenue: plan.targetRevenue, notes: plan.notes };
  }

  private buildPeriodLabel(periodType: ReportPeriodType, fromDateStr: string, toDateStr: string): string {
    if (periodType === 'day') {
      return `Ngày ${this.toVnDMY(toDateStr)}`;
    }
    if (periodType === 'week') {
      return `Tuần ${this.toVnDM(fromDateStr)} - ${this.toVnDMY(toDateStr)}`;
    }
    const [year, month] = toDateStr.split('-');
    return `Tháng ${month}/${year}`;
  }

  private toVnDMY(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  private toVnDM(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  }

  /** Lay cac thanh phan gio/ngay theo timezone Viet Nam, bat ke server chay o dau. */
  private getVnParts(date: Date): VnDateParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: REPORT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const map: Record<string, string> = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== 'literal') {
        map[part.type] = part.value;
      }
    }

    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: map.hour === '24' ? 0 : Number(map.hour),
      minute: Number(map.minute),
    };
  }

  private getYesterdayVnDateStr(date: Date): string {
    const { year, month, day } = this.getVnParts(date);
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
    noonUtc.setUTCDate(noonUtc.getUTCDate() - 1);
    return this.formatUtcDate(noonUtc);
  }

  /** Cong/tru so ngay vao 1 chuoi "YYYY-MM-DD", tra ve chuoi moi cung dinh dang. */
  private addDays(dateStr: string, days: number): string {
    const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
    noonUtc.setUTCDate(noonUtc.getUTCDate() + days);
    return this.formatUtcDate(noonUtc);
  }

  private isSunday(dateStr: string): boolean {
    const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
    return noonUtc.getUTCDay() === 0;
  }

  private isLastDayOfMonth(dateStr: string): boolean {
    const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
    const currentMonth = noonUtc.getUTCMonth();
    noonUtc.setUTCDate(noonUtc.getUTCDate() + 1);
    return noonUtc.getUTCMonth() !== currentMonth;
  }

  private formatUtcDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toDateOnly(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00.000Z`);
  }
}
