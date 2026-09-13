import { Injectable, Logger } from '@nestjs/common';
import type { AgentSendConfig, AgentSchedule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../reports/claude.service';
import { EmailService } from '../reports/email.service';
import { ContentService } from '../content/content.service';

export const AGENT_META: Record<string, { label: string; file: string }> = {
  finance: { label: 'Tài chính', file: 'finance-daily.md' },
  business: { label: 'Kinh doanh', file: 'business-daily.md' },
  marketing: { label: 'Marketing', file: 'marketing-daily.md' },
};

const DAY_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

@Injectable()
export class AgentRunnerService {
  private readonly logger = new Logger(AgentRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeService: ClaudeService,
    private readonly emailService: EmailService,
    private readonly contentService: ContentService,
  ) {}

  // ── Send Config ───────────────────────────────────────────────────────────

  async getAllConfigs(): Promise<AgentSendConfig[]> {
    const existing = await this.prisma.agentSendConfig.findMany();
    const agentNames = Object.keys(AGENT_META);

    // Bootstrap: tao row mac dinh cho agent chua co config
    const existingNames = new Set(existing.map((c) => c.agentName));
    for (const name of agentNames) {
      if (!existingNames.has(name)) {
        await this.prisma.agentSendConfig.create({ data: { agentName: name } });
      }
    }

    return this.prisma.agentSendConfig.findMany({ orderBy: { agentName: 'asc' } });
  }

  async saveConfig(agentName: string, sendHour: number, sendMinute: number, enabled: boolean): Promise<AgentSendConfig> {
    return this.prisma.agentSendConfig.upsert({
      where: { agentName },
      create: { agentName, sendHour, sendMinute, enabled },
      update: { sendHour, sendMinute, enabled },
    });
  }

  // ── Schedule ──────────────────────────────────────────────────────────────

  async getScheduleForAgent(agentName: string): Promise<AgentSchedule[]> {
    return this.prisma.agentSchedule.findMany({
      where: { agentName },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async saveScheduleItem(agentName: string, dayOfWeek: number, theme: string | null, notes: string | null): Promise<AgentSchedule> {
    return this.prisma.agentSchedule.upsert({
      where: { agentName_dayOfWeek: { agentName, dayOfWeek } },
      create: { agentName, dayOfWeek, theme, notes },
      update: { theme, notes },
    });
  }

  // ── Run ───────────────────────────────────────────────────────────────────

  async runAgent(agentName: string, dateStr: string): Promise<void> {
    const meta = AGENT_META[agentName];
    if (!meta) throw new Error(`Agent khong hop le: ${agentName}`);

    this.logger.log(`===== BAT DAU CHAY AGENT ${agentName.toUpperCase()} (${dateStr}) =====`);

    const runDate = new Date(`${dateStr}T00:00:00.000Z`);
    const existing = await this.prisma.agentLog.findUnique({
      where: { agentName_runDate: { agentName, runDate } },
    });
    if (existing) {
      this.logger.log(`[AgentRunner] Da co log cho ${agentName}/${dateStr}, bo qua.`);
      return;
    }

    try {
      const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
      const dow = noonUtc.getUTCDay();

      const [brandCtx, schedule] = await Promise.all([
        this.contentService.getBrandContext(),
        this.getScheduleForAgent(agentName),
      ]);

      const todaySchedule = schedule.find((s) => s.dayOfWeek === dow) ?? null;
      const userContent = this.buildPrompt(dateStr, dow, agentName, meta.label, brandCtx, todaySchedule);

      const output = await this.claudeService.runAgentWithScenario(meta.file, userContent);

      await this.prisma.agentLog.create({
        data: { agentName, runDate, output, status: 'success' },
      });

      await this.emailService.sendAgentOutput(agentName, meta.label, dateStr, output);
      this.logger.log(`===== AGENT ${agentName.toUpperCase()} (${dateStr}) HOAN TAT =====`);
    } catch (error) {
      const message = (error as Error).message ?? 'Loi khong xac dinh';
      this.logger.error(`===== AGENT ${agentName.toUpperCase()} (${dateStr}) THAT BAI: ${message} =====`);
      await this.prisma.agentLog.create({
        data: { agentName, runDate, status: 'failed', errorMessage: message },
      });
    }
  }

  private buildPrompt(
    dateStr: string,
    dow: number,
    agentName: string,
    agentLabel: string,
    brand: Awaited<ReturnType<ContentService['getBrandContext']>>,
    schedule: AgentSchedule | null,
  ): string {
    const parts: string[] = [];

    parts.push(`## NGÀY TƯ VẤN\n${dateStr} (${DAY_LABELS[dow]})`);

    if (brand) {
      const brandLines = [
        brand.storeName ? `Tên cửa hàng: ${brand.storeName}` : null,
        brand.storeAddress ? `Địa chỉ: ${brand.storeAddress}` : null,
        brand.productsOverview ? `Sản phẩm/dịch vụ: ${brand.productsOverview}` : null,
        brand.targetAudience ? `Đối tượng khách hàng: ${brand.targetAudience}` : null,
        brand.uniquePoints ? `Điểm khác biệt: ${brand.uniquePoints}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      parts.push(`## THÔNG TIN THƯƠNG HIỆU\n${brandLines}`);
    } else {
      parts.push('## THÔNG TIN THƯƠNG HIỆU\n[Chưa có Brand Context — hãy tư vấn theo hướng chung cho cửa hàng bán lẻ nhỏ]');
    }

    if (schedule?.theme) {
      parts.push(
        `## CHỦ ĐỀ TƯ VẤN HÔM NAY (${agentLabel})\nChủ đề: ${schedule.theme}${schedule.notes ? `\nGhi chú: ${schedule.notes}` : ''}`,
      );
    } else {
      parts.push(`## CHỦ ĐỀ TƯ VẤN HÔM NAY\n[Chưa có kịch bản cho ${DAY_LABELS[dow]} — hãy chọn chủ đề ${agentLabel.toLowerCase()} phù hợp nhất với ngữ cảnh cửa hàng]`);
    }

    return parts.join('\n\n');
  }
}
