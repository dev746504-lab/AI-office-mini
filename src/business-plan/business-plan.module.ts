import { Module } from '@nestjs/common';
import { BusinessPlanService } from './business-plan.service';
import { BusinessPlanController } from './business-plan.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessPlanController],
  providers: [BusinessPlanService],
  exports: [BusinessPlanService],
})
export class BusinessPlanModule {}
