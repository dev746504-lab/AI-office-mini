import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PeriodKiotVietData } from './interfaces/kiotviet-data.interface';
import { SettingsService } from '../settings/settings.service';

interface ClaudeSettings {
  model: string;
  temperature: number;
  max_tokens: number;
}

const CLAUDE_DIR = path.join(process.cwd(), '.claude');

/**
 * Ky nang bo sung cho tung agent - chi la DANH SACH TEN FILE (wiring), khong
 * phai noi dung prompt nghiep vu, nen khong vi pham nguyen tac "khong hardcode
 * prompt trong TypeScript" cua du an (xem CLAUDE.md). Noi dung that nam trong
 * .claude/skills/*.md, sua duoc qua man hinh "Cau hinh AI".
 */
const AGENT_SKILLS: Record<string, string[]> = {
  'finance.md': ['expense-summary.md', 'fnb-financial-analysis.md'],
  'business.md': ['plan-tracking.md', 'fnb-financial-analysis.md'],
  'marketing.md': ['content-writing.md', 'market-research.md', 'customer-psychology.md', 'marketing-psychology-retail.md', 'customer-behavior-signals.md'],
  'content-creator.md': ['social-post.md', 'ad-script.md'],
  'finance-daily.md': [],
  'business-daily.md': [],
  'marketing-daily.md': ['market-research.md', 'customer-psychology.md', 'marketing-psychology-retail.md'],
};

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private getClient(apiKey: string): Anthropic {
    return new Anthropic({ apiKey });
  }

  private async readTextFile(relativePath: string): Promise<string> {
    const fullPath = path.join(CLAUDE_DIR, relativePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Khong doc duoc file context ".claude/${relativePath}": ${(error as Error).message}`);
    }
  }

  private async readSettings(): Promise<ClaudeSettings> {
    const raw = await this.readTextFile('settings.json');
    try {
      return JSON.parse(raw) as ClaudeSettings;
    } catch (error) {
      throw new Error(`.claude/settings.json khong phai JSON hop le: ${(error as Error).message}`);
    }
  }

  private async buildSystemPrompt(ruleFiles: string[], agentFile: string): Promise<string> {
    const skillFiles = AGENT_SKILLS[agentFile] ?? [];
    const parts = await Promise.all([
      ...ruleFiles.map((f) => this.readTextFile(path.join('rules', f))),
      ...skillFiles.map((f) => this.readTextFile(path.join('skills', f))),
      this.readTextFile(path.join('agents', agentFile)),
    ]);
    return parts.join('\n\n---\n\n');
  }

  private async callClaude(
    client: Anthropic,
    systemPrompt: string,
    userContent: string,
    settings: ClaudeSettings,
  ): Promise<string> {
    const response = await client.messages.create({
      model: settings.model,
      max_tokens: settings.max_tokens,
      temperature: settings.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (!textBlock) {
      throw new Error(`Claude khong tra ve noi dung text (stop_reason=${response.stop_reason}).`);
    }

    return textBlock.text.trim();
  }

  async runAgentWithScenario(agentFile: string, userContent: string): Promise<string> {
    this.logger.log(`[ClaudeService] Dang goi agent tu dong: ${agentFile}`);

    const appSettings = await this.settingsService.getSettings();
    if (!appSettings.anthropicApiKey) {
      throw new Error('Anthropic API Key chua duoc cau hinh. Vao Settings de dien vao.');
    }

    const client = this.getClient(appSettings.anthropicApiKey);
    const claudeSettings = await this.readSettings();
    const systemPrompt = await this.buildSystemPrompt([], agentFile);

    return this.callClaude(client, systemPrompt, userContent, claudeSettings);
  }

  async generateContent(userContent: string): Promise<string> {
    this.logger.log('[ClaudeService] Dang tao content hang ngay...');

    const appSettings = await this.settingsService.getSettings();
    if (!appSettings.anthropicApiKey) {
      throw new Error('Anthropic API Key chua duoc cau hinh. Vao Settings de dien vao.');
    }

    const client = this.getClient(appSettings.anthropicApiKey);
    const claudeSettings = await this.readSettings();
    const systemPrompt = await this.buildSystemPrompt([], 'content-creator.md');

    return this.callClaude(client, systemPrompt, userContent, claudeSettings);
  }

  async generateReport(data: PeriodKiotVietData): Promise<string> {
    this.logger.log(`[ClaudeService] Dang tai settings va context tu .claude/... (ky: ${data.periodType})`);

    const appSettings = await this.settingsService.getSettings();
    if (!appSettings.anthropicApiKey) {
      throw new Error('Anthropic API Key chua duoc cau hinh. Vao Settings de dien vao.');
    }

    const client = this.getClient(appSettings.anthropicApiKey);
    const claudeSettings = await this.readSettings();
    const rawDataJson = JSON.stringify(data, null, 2);

    try {
      this.logger.log('[ClaudeService] Dang goi Agent Finance, Business va Marketing song song...');

      const [financeSystem, businessSystem, marketingSystem] = await Promise.all([
        this.buildSystemPrompt(['data-strict.md'], 'finance.md'),
        this.buildSystemPrompt(['data-strict.md'], 'business.md'),
        this.buildSystemPrompt(['data-strict.md'], 'marketing.md'),
      ]);

      const [financeAnalysis, businessAnalysis, marketingAnalysis] = await Promise.all([
        this.callClaude(client, financeSystem, rawDataJson, claudeSettings),
        this.callClaude(client, businessSystem, rawDataJson, claudeSettings),
        this.callClaude(client, marketingSystem, rawDataJson, claudeSettings),
      ]);

      this.logger.log('[ClaudeService] Da nhan phan tich tu ca 3 agent. Dang goi Agent Synthesizer...');

      const synthesizerSystem = await this.buildSystemPrompt(
        ['data-strict.md', 'output-html.md'],
        'synthesizer.md',
      );

      const synthesizerUserContent = [
        '## DU LIEU GOC (KiotViet JSON)',
        rawDataJson,
        '## NHAN DINH TU AGENT TAI CHINH',
        financeAnalysis,
        '## NHAN DINH TU AGENT KINH DOANH',
        businessAnalysis,
        '## NHAN DINH TU AGENT MARKETING',
        marketingAnalysis,
      ].join('\n\n');

      const htmlReport = await this.callClaude(client, synthesizerSystem, synthesizerUserContent, claudeSettings);

      this.logger.log('[ClaudeService] Da tao xong bao cao HTML.');
      return htmlReport;
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        this.logger.error('[ClaudeService] ANTHROPIC_API_KEY khong hop le.');
      } else if (error instanceof Anthropic.RateLimitError) {
        this.logger.error('[ClaudeService] Bi rate limit boi Anthropic API.');
      } else if (error instanceof Anthropic.APIError) {
        this.logger.error(`[ClaudeService] Loi API Anthropic (status=${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
