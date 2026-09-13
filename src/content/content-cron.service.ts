import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentService } from './content.service';
import { SettingsService } from '../settings/settings.service';

const CONTENT_TIMEZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class ContentCronService {
  private readonly logger = new Logger(ContentCronService.name);

  private readonly inFlight = new Set<string>();

  constructor(
    private readonly contentService: ContentService,
    private readonly settingsService: SettingsService,
  ) {}

  @Cron('0 * * * * *', { timeZone: CONTENT_TIMEZONE })
  async handleContentTick(): Promise<void> {
    const settings = await this.settingsService.getSettings();
    const targetHour = settings.contentSendHour ?? 8;
    const targetMinute = settings.contentSendMinute ?? 0;

    const now = this.getVnParts(new Date());
    if (now.hour !== targetHour || now.minute !== targetMinute) return;

    // Content cho NGAY HOM NAY (khac voi report la lay "yesterday")
    const todayStr = this.getTodayVnDateStr(new Date());

    if (this.inFlight.has(todayStr)) return;
    this.inFlight.add(todayStr);

    try {
      this.logger.log(`[ContentCron] Bat dau tao content cho ngay ${todayStr}`);
      await this.contentService.runDailyContent(todayStr);
    } finally {
      this.inFlight.delete(todayStr);
    }
  }

  private getVnParts(date: Date): { hour: number; minute: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: CONTENT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const map: Record<string, string> = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== 'literal') map[part.type] = part.value;
    }
    return {
      hour: map.hour === '24' ? 0 : Number(map.hour),
      minute: Number(map.minute),
    };
  }

  private getTodayVnDateStr(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: CONTENT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const map: Record<string, string> = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== 'literal') map[part.type] = part.value;
    }
    return `${map.year}-${map.month}-${map.day}`;
  }
}
