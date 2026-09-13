import { Module } from '@nestjs/common';
import { AgentRunnerService } from './agent-runner.service';
import { AgentCronService } from './agent-cron.service';
import { AgentConfigController } from './agent-config.controller';
import { AgentScheduleController } from './agent-schedule.controller';
import { ReportsModule } from '../reports/reports.module';
import { ContentModule } from '../content/content.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ReportsModule, ContentModule, AuthModule],
  controllers: [AgentConfigController, AgentScheduleController],
  providers: [AgentRunnerService, AgentCronService],
})
export class AgentRunnerModule {}
