import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgentRunnerService } from './agent-runner.service';
import type { AgentSchedule } from '@prisma/client';

interface SaveScheduleItemDto {
  dayOfWeek: number;
  theme: string | null;
  notes: string | null;
}

@Controller('api/agent-runner/schedule/:agentName')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AgentScheduleController {
  constructor(private readonly agentRunnerService: AgentRunnerService) {}

  @Get()
  getAll(@Param('agentName') agentName: string): Promise<AgentSchedule[]> {
    return this.agentRunnerService.getScheduleForAgent(agentName);
  }

  @Post()
  @HttpCode(200)
  saveItem(
    @Param('agentName') agentName: string,
    @Body() body: SaveScheduleItemDto,
  ): Promise<AgentSchedule> {
    return this.agentRunnerService.saveScheduleItem(agentName, body.dayOfWeek, body.theme ?? null, body.notes ?? null);
  }
}
