import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentCronService } from './content-cron.service';
import { BrandContextController } from './brand-context.controller';
import { ContentScheduleController } from './content-schedule.controller';
import { ReportsModule } from '../reports/reports.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ReportsModule, SettingsModule, AuthModule],
  controllers: [BrandContextController, ContentScheduleController],
  providers: [ContentService, ContentCronService],
  exports: [ContentService],
})
export class ContentModule {}
