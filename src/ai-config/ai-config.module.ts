import { Module } from '@nestjs/common';
import { AiConfigController } from './ai-config.controller';
import { AiConfigService } from './ai-config.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AiConfigController],
  providers: [AiConfigService],
})
export class AiConfigModule {}
