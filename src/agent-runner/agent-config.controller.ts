import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgentRunnerService } from './agent-runner.service';
import type { AgentSendConfig } from '@prisma/client';

interface SaveAgentConfigDto {
  agentName: string;
  sendHour: number;
  sendMinute: number;
  enabled: boolean;
}

@Controller('api/agent-runner/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AgentConfigController {
  constructor(private readonly agentRunnerService: AgentRunnerService) {}

  @Get()
  getAll(): Promise<AgentSendConfig[]> {
    return this.agentRunnerService.getAllConfigs();
  }

  @Post()
  @HttpCode(200)
  save(@Body() body: SaveAgentConfigDto): Promise<AgentSendConfig> {
    const hour = Math.min(23, Math.max(0, Math.trunc(body.sendHour)));
    const minute = Math.min(59, Math.max(0, Math.trunc(body.sendMinute)));
    return this.agentRunnerService.saveConfig(body.agentName, hour, minute, body.enabled);
  }
}
