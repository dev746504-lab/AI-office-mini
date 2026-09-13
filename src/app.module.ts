import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { AiConfigModule } from './ai-config/ai-config.module';
import { AuthModule } from './auth/auth.module';
import { BusinessPlanModule } from './business-plan/business-plan.module';
import { ContentModule } from './content/content.module';
import { AgentRunnerModule } from './agent-runner/agent-runner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SettingsModule,
    BusinessPlanModule,
    ReportsModule,
    ContentModule,
    AgentRunnerModule,
    AiConfigModule,
  ],
})
export class AppModule {}
