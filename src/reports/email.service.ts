import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { ExcelService } from './excel.service';
import type { AppSettings } from '@prisma/client';
import type { PeriodKiotVietData, ReportPeriodType } from './interfaces/kiotviet-data.interface';

const PERIOD_LABEL_VN: Record<ReportPeriodType, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly excelService: ExcelService,
  ) {}

  private createTransporter(s: AppSettings): Transporter {
    return nodemailer.createTransport({
      host: s.smtpHost ?? '',
      port: s.smtpPort ?? 465,
      secure: s.smtpSecure ?? true,
      auth: {
        user: s.smtpUser ?? '',
        pass: s.smtpPass ?? '',
      },
    });
  }

  private buildSubject(periodType: ReportPeriodType, periodLabel: string): string {
    return `[Bao cao KiotViet] Ket qua kinh doanh - ${PERIOD_LABEL_VN[periodType]}: ${periodLabel}`;
  }

  async sendContent(dateStr: string, fbPost: string, adScript: string): Promise<void> {
    const s = await this.settingsService.getSettings();

    if (!s.smtpHost || !s.smtpUser || !s.smtpPass) {
      throw new Error('SMTP chua duoc cau hinh. Vao Settings de dien vao.');
    }
    if (!s.reportEmailTo) {
      throw new Error('Chua cau hinh email nguoi nhan. Vao Settings de dien vao.');
    }

    const [y, m, d] = dateStr.split('-');
    const dateLabel = `${d}/${m}/${y}`;
    const subject = `[Content AI] Nội dung ngày ${dateLabel}`;

    const htmlBody = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
        <tr><td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:680px;">
            <tr>
              <td style="background:#1a1a2e;padding:20px 28px;">
                <h2 style="margin:0;color:#00d4aa;font-size:18px;font-family:Arial,sans-serif;">📱 NỘI DUNG HÀNG NGÀY</h2>
                <p style="margin:4px 0 0;color:#aaa;font-size:13px;">${dateLabel} — Được tạo tự động bởi AI</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:15px;border-left:4px solid #1877f2;padding-left:10px;">
                  📘 Bài đăng Facebook / Zalo
                </h3>
                <div style="background:#f0f4ff;border-radius:6px;padding:16px;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;">${this.escapeHtml(fbPost)}</div>

                <div style="height:24px;"></div>

                <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:15px;border-left:4px solid #f04;padding-left:10px;">
                  🎬 Kịch bản Quảng cáo
                </h3>
                <div style="background:#fff5f5;border-radius:6px;padding:16px;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;">${this.escapeHtml(adScript)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 20px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:11px;color:#999;">Nội dung được tạo tự động bởi hệ thống AI. Vui lòng review trước khi đăng.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    `;

    const transporter = this.createTransporter(s);
    const from = s.reportEmailFrom ?? s.smtpUser;

    this.logger.log(`[EmailService] Dang gui email content (${dateStr}) toi: ${s.reportEmailTo}`);

    try {
      const info = await transporter.sendMail({ from, to: s.reportEmailTo, subject, html: htmlBody });
      this.logger.log(`[EmailService] Gui email content thanh cong. messageId=${info.messageId}`);
    } catch (error) {
      this.logger.error(`[EmailService] Gui email content that bai: ${(error as Error).message}`);
      throw error;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async sendAgentOutput(agentName: string, agentLabel: string, dateStr: string, content: string): Promise<void> {
    const s = await this.settingsService.getSettings();

    if (!s.smtpHost || !s.smtpUser || !s.smtpPass) {
      throw new Error('SMTP chua duoc cau hinh. Vao Settings de dien vao.');
    }
    if (!s.reportEmailTo) {
      throw new Error('Chua cau hinh email nguoi nhan. Vao Settings de dien vao.');
    }

    const [y, m, d] = dateStr.split('-');
    const dateLabel = `${d}/${m}/${y}`;
    const subject = `[AI ${agentLabel}] Tư vấn ngày ${dateLabel}`;

    const accentColor = agentName === 'finance' ? '#10b981' : agentName === 'business' ? '#3b82f6' : '#8b5cf6';
    const icon = agentName === 'finance' ? '🧮' : agentName === 'business' ? '📊' : '📣';

    // Convert plain text paragraphs to HTML paragraphs
    const htmlContent = this.escapeHtml(content)
      .split(/\n\n+/)
      .map((para) => `<p style="margin:0 0 14px;line-height:1.7;">${para.replace(/\n/g, '<br>')}</p>`)
      .join('');

    const htmlBody = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
        <tr><td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:680px;">
            <tr>
              <td style="background:#1a1a2e;padding:20px 28px;border-bottom:3px solid ${accentColor};">
                <h2 style="margin:0;color:${accentColor};font-size:18px;font-family:Arial,sans-serif;">${icon} TƯ VẤN ${agentLabel.toUpperCase()} HÀNG NGÀY</h2>
                <p style="margin:4px 0 0;color:#aaa;font-size:13px;">${dateLabel} — Được tạo tự động bởi AI</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:14px;color:#333;">${htmlContent}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px 20px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:11px;color:#999;">Nội dung được tạo tự động bởi hệ thống AI. Mang tính tham khảo — hãy đối chiếu với thực tế cửa hàng.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    `;

    const transporter = this.createTransporter(s);
    const from = s.reportEmailFrom ?? s.smtpUser;
    this.logger.log(`[EmailService] Dang gui email agent ${agentName} (${dateStr}) toi: ${s.reportEmailTo}`);

    try {
      const info = await transporter.sendMail({ from, to: s.reportEmailTo, subject, html: htmlBody });
      this.logger.log(`[EmailService] Gui email agent ${agentName} thanh cong. messageId=${info.messageId}`);
    } catch (error) {
      this.logger.error(`[EmailService] Gui email agent ${agentName} that bai: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendReport(
    periodType: ReportPeriodType,
    periodLabel: string,
    htmlBody: string,
    data: PeriodKiotVietData,
  ): Promise<void> {
    const s = await this.settingsService.getSettings();

    if (!s.smtpHost || !s.smtpUser || !s.smtpPass) {
      throw new Error('SMTP chua duoc cau hinh. Vao Settings de dien vao.');
    }
    if (!s.reportEmailTo) {
      throw new Error('Chua cau hinh email nguoi nhan. Vao Settings de dien vao.');
    }

    const transporter = this.createTransporter(s);
    const from = s.reportEmailFrom ?? s.smtpUser;
    const to = s.reportEmailTo;

    const fullHtml = `
      <div style="background-color:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
        ${htmlBody}
      </div>
    `;

    const safeLabel = periodLabel.replace(/[\/\\:*?"<>|]/g, '-');
    const filename = `BaoCao_${safeLabel}.xlsx`;

    this.logger.log(`[EmailService] Dang tao file Excel dinh kem...`);
    const excelBuffer = await this.excelService.buildReportBuffer(data);

    this.logger.log(`[EmailService] Dang gui email bao cao (${periodType}) toi: ${to}`);

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: this.buildSubject(periodType, periodLabel),
        html: fullHtml,
        attachments: [
          {
            filename,
            content: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });
      this.logger.log(`[EmailService] Gui email thanh cong. messageId=${info.messageId}`);
    } catch (error) {
      this.logger.error(`[EmailService] Gui email that bai: ${(error as Error).message}`);
      throw error;
    }
  }
}
