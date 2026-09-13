import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AgentRunnerService } from './agent-runner.service';

const AGENT_TIMEZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class AgentCronService {
  private readonly logger = new Logger(AgentCronService.name);
  private readonly inFlight = new Set<string>();

  constructor(private readonly agentRunnerService: AgentRunnerService) {}

  @Cron('0 * * * * *', { timeZone: AGENT_TIMEZONE })
  async handleAgentTick(): Promise<void> {
    const configs = await this.agentRunnerService.getAllConfigs();
    const now = this.getVnParts(new Date());
    const todayStr = this.getTodayVnDateStr(new Date());

    for (const cfg of configs) {
      if (!cfg.enabled) continue;
      if (now.hour !== cfg.sendHour || now.minute !== cfg.sendMinute) continue;

      const key = `${cfg.agentName}:${todayStr}`;
      if (this.inFlight.has(key)) continue;

      this.inFlight.add(key);
      this.logger.log(`[AgentCron] Kich hoat agent ${cfg.agentName} cho ngay ${todayStr}`);

      this.agentRunnerService
        .runAgent(cfg.agentName, todayStr)
        .finally(() => this.inFlight.delete(key));
    }
  }

  private getVnParts(date: Date): { hour: number; minute: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: AGENT_TIMEZONE,
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
      timeZone: AGENT_TIMEZONE,
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
