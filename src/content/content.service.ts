import { Injectable, Logger } from '@nestjs/common';
import type { BrandContext, ContentSchedule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../reports/claude.service';
import { KiotVietService } from '../reports/kiotviet.service';
import { EmailService } from '../reports/email.service';

export interface DailyContentResult {
  fbPost: string;
  adScript: string;
}

const DAY_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeService: ClaudeService,
    private readonly kiotVietService: KiotVietService,
    private readonly emailService: EmailService,
  ) {}

  // ── Brand Context ─────────────────────────────────────────────────────────

  async getBrandContext(): Promise<BrandContext | null> {
    return this.prisma.brandContext.findUnique({ where: { id: 1 } });
  }

  async saveBrandContext(
    data: Partial<Omit<BrandContext, 'id' | 'updatedAt'>>,
  ): Promise<BrandContext> {
    return this.prisma.brandContext.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  }

  // ── Content Schedule ──────────────────────────────────────────────────────

  async getSchedule(): Promise<ContentSchedule[]> {
    return this.prisma.contentSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } });
  }

  async saveScheduleItem(
    dayOfWeek: number,
    theme: string | null,
    notes: string | null,
  ): Promise<ContentSchedule> {
    return this.prisma.contentSchedule.upsert({
      where: { dayOfWeek },
      create: { dayOfWeek, theme, notes },
      update: { theme, notes },
    });
  }

  // ── Content Generation ────────────────────────────────────────────────────

  async runDailyContent(dateStr: string): Promise<void> {
    this.logger.log(`===== BAT DAU TAO CONTENT HANG NGAY (${dateStr}) =====`);

    const contentDate = new Date(`${dateStr}T00:00:00.000Z`);
    const existing = await this.prisma.contentLog.findUnique({ where: { contentDate } });
    if (existing) {
      this.logger.log(`[Content] Da co content cho ngay ${dateStr}, bo qua.`);
      return;
    }

    try {
      const result = await this.generateContent(dateStr);

      await this.prisma.contentLog.create({
        data: { contentDate, fbPost: result.fbPost, adScript: result.adScript, status: 'success' },
      });

      await this.emailService.sendContent(dateStr, result.fbPost, result.adScript);
      this.logger.log(`===== CONTENT HANG NGAY (${dateStr}) HOAN TAT =====`);
    } catch (error) {
      const message = (error as Error).message ?? 'Loi khong xac dinh';
      this.logger.error(`===== CONTENT HANG NGAY (${dateStr}) THAT BAI: ${message} =====`);

      await this.prisma.contentLog.create({
        data: { contentDate, status: 'failed', errorMessage: message },
      });
    }
  }

  private async generateContent(dateStr: string): Promise<DailyContentResult> {
    const [brandCtx, schedule] = await Promise.all([
      this.getBrandContext(),
      this.getSchedule(),
    ]);

    // Day of week từ dateStr (YYYY-MM-DD) — UTC noon để tránh timezone edge
    const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
    const dow = noonUtc.getUTCDay();
    const todaySchedule = schedule.find((s) => s.dayOfWeek === dow) ?? null;

    // Lấy top products hôm qua (optional — không fail nếu KiotViet chưa cấu hình)
    let topProductsText = '';
    try {
      const yesterdayStr = this.addDays(dateStr, -1);
      const kData = await this.kiotVietService.fetchReportData(
        yesterdayStr,
        yesterdayStr,
        'day',
        `Ngày ${yesterdayStr}`,
        null,
      );
      if (kData.topProducts && kData.topProducts.length > 0) {
        const lines = kData.topProducts
          .slice(0, 5)
          .map((p, i) => `${i + 1}. ${p.productName} — ${p.quantity} sản phẩm bán`)
          .join('\n');
        topProductsText = `## TOP SẢN PHẨM BÁN CHẠY HÔM QUA\n${lines}`;
      }
    } catch {
      this.logger.warn('[Content] Khong lay duoc du lieu KiotViet, tao content khong co so lieu ban hang.');
    }

    const userContent = this.buildContentPrompt(dateStr, dow, brandCtx, todaySchedule, topProductsText);
    const raw = await this.claudeService.generateContent(userContent);
    return this.parseContentOutput(raw);
  }

  private buildContentPrompt(
    dateStr: string,
    dow: number,
    brand: BrandContext | null,
    schedule: ContentSchedule | null,
    topProductsText: string,
  ): string {
    const parts: string[] = [];

    parts.push(`## NGÀY TẠO CONTENT\n${dateStr} (${DAY_LABELS[dow]})`);

    if (brand) {
      const brandLines = [
        brand.storeName ? `Tên cửa hàng: ${brand.storeName}` : null,
        brand.storeAddress ? `Địa chỉ: ${brand.storeAddress}` : null,
        brand.productsOverview ? `Sản phẩm/dịch vụ: ${brand.productsOverview}` : null,
        brand.targetAudience ? `Đối tượng khách hàng: ${brand.targetAudience}` : null,
        brand.toneOfVoice ? `Tone of voice: ${brand.toneOfVoice}` : null,
        brand.uniquePoints ? `Điểm khác biệt: ${brand.uniquePoints}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      parts.push(`## THÔNG TIN THƯƠNG HIỆU\n${brandLines}`);
    } else {
      parts.push('## THÔNG TIN THƯƠNG HIỆU\n[Chưa có Brand Context — tạo content gợi ý chung chung]');
    }

    if (schedule?.theme) {
      parts.push(
        `## CHỦ ĐỀ HÔM NAY (${DAY_LABELS[dow]})\nChủ đề: ${schedule.theme}${schedule.notes ? `\nGhi chú: ${schedule.notes}` : ''}`,
      );
    } else {
      parts.push(`## CHỦ ĐỀ HÔM NAY\n[Chưa có lịch content cho ${DAY_LABELS[dow]} — chọn chủ đề phù hợp nhất với thương hiệu]`);
    }

    if (topProductsText) {
      parts.push(topProductsText);
    }

    return parts.join('\n\n');
  }

  private parseContentOutput(raw: string): DailyContentResult {
    const fbMatch = raw.match(/\[FB_POST\]([\s\S]*?)\[\/FB_POST\]/);
    const adMatch = raw.match(/\[AD_SCRIPT\]([\s\S]*?)\[\/AD_SCRIPT\]/);

    if (!fbMatch || !adMatch) {
      throw new Error(`Claude tra ve dinh dang khong dung (thieu [FB_POST] hoac [AD_SCRIPT]). Raw:\n${raw.slice(0, 300)}`);
    }

    return {
      fbPost: fbMatch[1].trim(),
      adScript: adMatch[1].trim(),
    };
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
