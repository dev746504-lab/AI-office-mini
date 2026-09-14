import { Module } from '@nestjs/common';
import { KiotVietService } from './kiotviet.service';
import { ClaudeService } from './claude.service';
import { EmailService } from './email.service';
import { ExcelService } from './excel.service';
import { CronService } from './cron.service';
import { FnbFinanceService } from './fnb-finance.service';
import { SettingsModule } from '../settings/settings.module';
import { BusinessPlanModule } from '../business-plan/business-plan.module';

@Module({
  imports: [SettingsModule, BusinessPlanModule],
  providers: [KiotVietService, ClaudeService, EmailService, ExcelService, CronService, FnbFinanceService],
  exports: [CronService, ClaudeService, KiotVietService, EmailService, ExcelService, FnbFinanceService],
})
export class ReportsModule {}
