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
        smtpPort: this.configService.get<number>('SMTP_PORT', 465),
        smtpSecure: this.configService.get('SMTP_SECURE', 'true') === 'true',
        smtpUser: this.configService.get('SMTP_USER') ?? null,
        smtpPass: this.configService.get('SMTP_PASS') ?? null,
        reportEmailFrom: this.configService.get('REPORT_EMAIL_FROM') ?? null,
        reportEmailTo: this.configService.get('REPORT_EMAIL_TO') ?? null,
        reportSendHour: this.configService.get<number>('REPORT_SEND_HOUR', 23),
        reportSendMinute: this.configService.get<number>('REPORT_SEND_MINUTE', 0),
        contentSendHour: this.configService.get<number>('CONTENT_SEND_HOUR', 8),
        contentSendMinute: this.configService.get<number>('CONTENT_SEND_MINUTE', 0),
      },
    });
  }

  async saveSettings(dto: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings> {
    if (dto.reportSendHour != null) {
      dto.reportSendHour = Math.min(23, Math.max(0, Math.trunc(dto.reportSendHour)));
    }
    if (dto.reportSendMinute != null) {
      dto.reportSendMinute = Math.min(59, Math.max(0, Math.trunc(dto.reportSendMinute)));
    }
    if (dto.contentSendHour != null) {
      dto.contentSendHour = Math.min(23, Math.max(0, Math.trunc(dto.contentSendHour)));
    }
    if (dto.contentSendMinute != null) {
      dto.contentSendMinute = Math.min(59, Math.max(0, Math.trunc(dto.contentSendMinute)));
    }

    // Dam bao row id=1 da ton tai (bootstrap tu .env neu can) truoc khi upsert de
    // khong bi thieu cac truong bat buoc/co default khi tao moi.
    await this.getSettings();

    const updated = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: dto as Prisma.AppSettingsUpdateInput,
    });
    this.logger.log('[Settings] Da luu config moi vao DB.');
    return updated;
  }
}
