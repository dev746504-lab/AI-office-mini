import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Ca admin lan ai_manager deu duoc doc/ghi kich ban AI - chi can dang nhap. */
@Controller('api/ai-configs')
@UseGuards(JwtAuthGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  /** Danh sach cac phong ban / rang buoc he thong co the cau hinh - dung de dung sidebar dong o FE. */
  @Get()
  list() {
    return this.aiConfigService.listEntries();
  }

  @Get(':agentName')
  async getConfig(@Param('agentName') agentName: string) {
    return this.aiConfigService.readConfig(agentName);
  }

  @Post(':agentName')
  @HttpCode(200)
  async saveConfig(
    @Param('agentName') agentName: string,
    @Body() body: { content?: unknown },
  ) {
    if (typeof body?.content !== 'string') {
      throw new BadRequestException('Truong "content" phai la chuoi text.');
    }
    return this.aiConfigService.writeConfig(agentName, body.content);
  }
}
