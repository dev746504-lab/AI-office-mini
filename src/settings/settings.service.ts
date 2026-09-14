import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppSettings, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lay settings tu DB. Lan dau chay (chua co row), tu dong bootstrap tu .env.
   */
  async getSettings(): Promise<AppSettings> {
    const existing = await this.prisma.appSettings.findUnique({ where: { id: 1 } });
    if (existing) {
      return existing;
    }

    this.logger.log('[Settings] Chua co config trong DB, bootstrap tu .env...');
    return this.prisma.appSettings.create({
      data: {
        id: 1,
        kiotvietClientId: this.configService.get('KIOTVIET_CLIENT_ID') ?? null,
        kiotvietClientSecret: this.configService.get('KIOTVIET_CLIENT_SECRET') ?? null,
        kiotvietRetailer: this.configService.get('KIOTVIET_RETAILER') ?? null,
        kiotvietTokenUrl: this.configService.get('KIOTVIET_TOKEN_URL', 'https://id.kiotviet.vn/connect/token'),
        kiotvietApiBaseUrl: this.configService.get('KIOTVIET_API_BASE_URL', 'https://public.kiotviet.vn'),
        anthropicApiKey: this.configService.get('ANTHROPIC_API_KEY') ?? null,
        smtpHost: this.configService.get('SMTP_HOST') ?? null,
        smtpPort: parseInt(this.configService.get('SMTP_PORT', '465'), 10),
        smtpSecure: this.configService.get('SMTP_SECURE', 'true') === 'true',
        smtpUser: this.configService.get('SMTP_USER') ?? null,
        smtpPass: this.configService.get('SMTP_PASS') ?? null,
        reportEmailFrom: this.configService.get('REPORT_EMAIL_FROM') ?? null,
        reportEmailTo: this.configService.get('REPORT_EMAIL_TO') ?? null,
        reportSendHour: parseInt(this.configService.get('REPORT_SEND_HOUR', '23'), 10),
        reportSendMinute: parseInt(this.configService.get('REPORT_SEND_MINUTE', '0'), 10),
        contentSendHour: parseInt(this.configService.get('CONTENT_SEND_HOUR', '8'), 10),
        contentSendMinute: parseInt(this.configService.get('CONTENT_SEND_MINUTE', '0'), 10),
      },
    });
  }

  async saveSettings(dto: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings> {
    // Strip id/updatedAt at runtime — frontend sends the full Prisma object back
    // and Prisma throws "Unknown argument 'id'" if id is present in update data.
    const { id: _id, updatedAt: _updatedAt, ...safeDto } = dto as AppSettings;

    if (safeDto.reportSendHour != null) {
      safeDto.reportSendHour = Math.min(23, Math.max(0, Math.trunc(safeDto.reportSendHour)));
    }
    if (safeDto.reportSendMinute != null) {
      safeDto.reportSendMinute = Math.min(59, Math.max(0, Math.trunc(safeDto.reportSendMinute)));
    }
    if (safeDto.contentSendHour != null) {
      safeDto.contentSendHour = Math.min(23, Math.max(0, Math.trunc(safeDto.contentSendHour)));
    }
    if (safeDto.contentSendMinute != null) {
      safeDto.contentSendMinute = Math.min(59, Math.max(0, Math.trunc(safeDto.contentSendMinute)));
    }

    // Dam bao row id=1 da ton tai (bootstrap tu .env neu can) truoc khi upsert de
    // khong bi thieu cac truong bat buoc/co default khi tao moi.
    await this.getSettings();

    const updated = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: safeDto as Prisma.AppSettingsUpdateInput,
    });
    this.logger.log('[Settings] Da luu config moi vao DB.');
    return updated;
  }
}
