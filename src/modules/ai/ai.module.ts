import { Logger, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';

@Module({
  providers: [AiService, Logger],
  exports: [AiService],
  imports: [ConfigModule.forFeature(aiConfig)],
})
export class AiModule {}
