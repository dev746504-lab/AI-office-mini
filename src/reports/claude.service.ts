import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PeriodKiotVietData } from './interfaces/kiotviet-data.interface';
import { SettingsService } from '../settings/settings.service';
import { KiotVietService } from './kiotviet.service';

interface ClaudeSettings {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface AgentToolCall {
  tool: string;
  input: Record<string, unknown>;
  result: 'ok' | 'error';
  iteration: number;
}

export interface AgentTraceEntry {
  agent: string;
  status: 'success' | 'failed';
  toolCalls: AgentToolCall[];
  error?: string;
}

export interface GenerateReportResult {
  html: string;
  agentTrace: AgentTraceEntry[];
}

const CLAUDE_DIR = path.join(process.cwd(), '.claude');

/**
 * Wiring agent file → skill files. Noi dung that nam trong .claude/skills/*.md.
 * Xem CLAUDE.md: khong hardcode prompt trong TypeScript.
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

/**
 * Wiring agent file → Anthropic tools duoc phep goi trong execution loop.
 * Agent co the goi them tool de lay du lieu bo sung thay vi nhan tat ca upfront.
 * Danh sach tool rong = khong dung loop, chi goi Claude 1 lan.
 */
const AGENT_TOOLS: Record<string, Anthropic.Tool[]> = {
  'finance.md': [
    {
      name: 'fetch_comparison_data',
      description:
        'Lấy dữ liệu doanh thu KiotViet của một kỳ khác để so sánh. Dùng khi cần so sánh với kỳ trước (hôm qua, tuần trước, tháng trước) để đưa ra nhận định tài chính. Chú ý: chỉ gọi tool này khi dữ liệu so sánh thực sự cần thiết và chưa có trong JSON gốc.',
      input_schema: {
        type: 'object' as const,
        properties: {
          fromDate: { type: 'string', description: 'Ngày bắt đầu kỳ so sánh (YYYY-MM-DD)' },
          toDate: { type: 'string', description: 'Ngày kết thúc kỳ so sánh (YYYY-MM-DD)' },
        },
        required: ['fromDate', 'toDate'],
      },
    },
  ],
  'business.md': [
    {
      name: 'fetch_comparison_data',
      description:
        'Lấy dữ liệu doanh thu KiotViet của một kỳ khác để so sánh hiệu suất bán hàng và tiến độ kế hoạch. Chỉ gọi khi cần dữ liệu kỳ trước mà chưa có trong JSON gốc.',
      input_schema: {
        type: 'object' as const,
        properties: {
          fromDate: { type: 'string', description: 'Ngày bắt đầu kỳ so sánh (YYYY-MM-DD)' },
          toDate: { type: 'string', description: 'Ngày kết thúc kỳ so sánh (YYYY-MM-DD)' },
        },
        required: ['fromDate', 'toDate'],
      },
    },
  ],
  'marketing.md': [
    {
      name: 'analyze_top_products',
      description:
        'Phân tích cơ cấu sản phẩm bán chạy: tỷ trọng doanh thu, tỷ lệ đóng góp, giá bán trung bình của từng sản phẩm trong kỳ. Dùng khi cần hiểu sâu hơn về product mix.',
      input_schema: {
        type: 'object' as const,
        properties: {
          limit: { type: 'number', description: 'Số sản phẩm cần phân tích (mặc định 5, tối đa 10)' },
        },
      },
    },
  ],
  'finance-daily.md': [],
  'business-daily.md': [],
  'marketing-daily.md': [],
  'content-creator.md': [],
  'synthesizer.md': [],
};

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly kiotVietService: KiotVietService,
  ) {}

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

  /**
   * Thuc thi tool duoc agent yeu cau. Dung du lieu da fetch hoac goi KiotViet API.
   * Khong log so lieu nhay cam ra console — chi log ten tool va ket qua ok/error.
   */
  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    currentData: PeriodKiotVietData,
  ): Promise<unknown> {
    if (toolName === 'fetch_comparison_data') {
      const { fromDate, toDate } = input as { fromDate: string; toDate: string };
      const data = await this.kiotVietService.fetchReportData(
        fromDate,
        toDate,
        currentData.periodType,
        `${fromDate} → ${toDate}`,
        null,
      );
      return {
        totalRevenue: data.totalRevenue,
        totalInvoices: data.totalInvoices,
        totalDiscount: data.totalDiscount,
        newDebtInPeriod: data.newDebtInPeriod,
        topProducts: data.topProducts.slice(0, 5),
        dailyBreakdown: data.dailyBreakdown,
      };
    }

    if (toolName === 'analyze_top_products') {
      const limit = Math.min(Number((input as { limit?: number }).limit ?? 5), 10);
      const products = currentData.topProducts.slice(0, limit);
      const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
      return products.map((p) => ({
        productName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue,
        revenueShare: totalRevenue > 0 ? `${((p.revenue / totalRevenue) * 100).toFixed(1)}%` : 'N/A',
        avgUnitPrice: p.quantity > 0 ? Math.round(p.revenue / p.quantity) : 0,
      }));
    }

    throw new Error(`Tool khong duoc ho tro: ${toolName}`);
  }

  /**
   * Execution loop: agent co the goi tool nhieu lan de lay du lieu bo sung.
   * Dung khi AGENT_TOOLS[agentFile] co it nhat 1 tool.
   * Fallback ve callClaude() don gian neu agent khong co tools.
   * maxIterations = 6 de tranh loop vo han.
   */
  private async runAgentLoop(
    client: Anthropic,
    systemPrompt: string,
    initialUserContent: string,
    settings: ClaudeSettings,
    agentFile: string,
    currentData: PeriodKiotVietData,
    maxIterations = 6,
  ): Promise<{ text: string; toolCalls: AgentToolCall[] }> {
    const tools = AGENT_TOOLS[agentFile] ?? [];
    const toolCalls: AgentToolCall[] = [];

    if (tools.length === 0) {
      const text = await this.callClaude(client, systemPrompt, initialUserContent, settings);
      return { text, toolCalls };
    }

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: initialUserContent }];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await client.messages.create({
        model: settings.model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        system: systemPrompt,
        messages,
        tools,
      });

      if (response.stop_reason !== 'tool_use') {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
        if (textBlock) {
          return { text: textBlock.text.trim(), toolCalls };
        }
        break;
      }

      messages.push({ role: 'assistant', content: response.content });
      const toolResultContent: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const callEntry: AgentToolCall = {
          tool: block.name,
          input: block.input as Record<string, unknown>,
          result: 'ok',
          iteration,
        };
        this.logger.log(`[ClaudeService] Agent ${agentFile} goi tool "${block.name}" (iteration ${iteration + 1})`);

        try {
          const result = await this.executeTool(block.name, block.input as Record<string, unknown>, currentData);
          toolResultContent.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
          this.logger.log(`[ClaudeService] Tool "${block.name}" hoan tat OK`);
        } catch (err) {
          callEntry.result = 'error';
          const errMsg = (err as Error).message;
          this.logger.warn(`[ClaudeService] Tool "${block.name}" loi: ${errMsg}`);
          toolResultContent.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Lỗi khi thực thi tool: ${errMsg}`,
            is_error: true,
          });
        }
        toolCalls.push(callEntry);
      }

      messages.push({ role: 'user', content: toolResultContent });
    }

    // Fallback khi dat maxIterations ma van chua co text response
    return {
      text: 'Không đủ dữ liệu để đưa ra kết luận sau tối đa số vòng lặp truy vấn. Phần phân tích này sẽ bị thiếu trong báo cáo.',
      toolCalls,
    };
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

  /**
   * Pipeline Multi-Agent: Finance + Business + Marketing chay song song qua execution loop,
   * sau do Synthesizer hop nhat thanh HTML email.
   * - Tung agent dung Promise.allSettled → khong bao gio throw du 1/2/3 agent loi.
   * - Synthesizer nhan fallback text cho agent loi, ghi ro "loi ky thuat" trong email.
   * - Tra ve { html, agentTrace } de cron.service log trace vao report_logs.
   */
  async generateReport(data: PeriodKiotVietData): Promise<GenerateReportResult> {
    this.logger.log(`[ClaudeService] Bat dau pipeline Multi-Agent (ky: ${data.periodType})...`);

    const appSettings = await this.settingsService.getSettings();
    if (!appSettings.anthropicApiKey) {
      throw new Error('Anthropic API Key chua duoc cau hinh. Vao Settings de dien vao.');
    }

    const client = this.getClient(appSettings.anthropicApiKey);
    const claudeSettings = await this.readSettings();
    const rawDataJson = JSON.stringify(data, null, 2);

    try {
      this.logger.log('[ClaudeService] Dang build system prompts cho 3 agent...');
      const [financeSystem, businessSystem, marketingSystem] = await Promise.all([
        this.buildSystemPrompt(['data-strict.md'], 'finance.md'),
        this.buildSystemPrompt(['data-strict.md'], 'business.md'),
        this.buildSystemPrompt(['data-strict.md'], 'marketing.md'),
      ]);

      this.logger.log('[ClaudeService] Dang chay Finance/Business/Marketing song song (co execution loop)...');
      const [financeResult, businessResult, marketingResult] = await Promise.allSettled([
        this.runAgentLoop(client, financeSystem, rawDataJson, claudeSettings, 'finance.md', data),
        this.runAgentLoop(client, businessSystem, rawDataJson, claudeSettings, 'business.md', data),
        this.runAgentLoop(client, marketingSystem, rawDataJson, claudeSettings, 'marketing.md', data),
      ]);

      const agentTrace: AgentTraceEntry[] = [];

      const extractResult = (
        result: PromiseSettledResult<{ text: string; toolCalls: AgentToolCall[] }>,
        agentName: string,
        fallbackMsg: string,
      ): string => {
        if (result.status === 'fulfilled') {
          agentTrace.push({ agent: agentName, status: 'success', toolCalls: result.value.toolCalls });
          return result.value.text;
        }
        const error = (result.reason as Error).message ?? 'Loi khong xac dinh';
        this.logger.error(`[ClaudeService] Agent ${agentName} that bai: ${error}`);
        agentTrace.push({ agent: agentName, status: 'failed', toolCalls: [], error });
        return fallbackMsg;
      };

      const financeAnalysis = extractResult(
        financeResult,
        'finance',
        '[Agent Tài chính không có dữ liệu do lỗi kỹ thuật — xem agent_trace để biết chi tiết]',
      );
      const businessAnalysis = extractResult(
        businessResult,
        'business',
        '[Agent Kinh doanh không có dữ liệu do lỗi kỹ thuật — xem agent_trace để biết chi tiết]',
      );
      const marketingAnalysis = extractResult(
        marketingResult,
        'marketing',
        '[Agent Marketing không có dữ liệu do lỗi kỹ thuật — xem agent_trace để biết chi tiết]',
      );

      const successCount = agentTrace.filter((e) => e.status === 'success').length;
      this.logger.log(`[ClaudeService] ${successCount}/3 agent thanh cong. Dang goi Synthesizer...`);

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
      return { html: htmlReport, agentTrace };
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
