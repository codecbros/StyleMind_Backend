import { Logger, Module } from '@nestjs/common';
import { WardrobeController } from './controllers/wardrobe/wardrobe.controller';
import { WardrobeService } from './services/wardrobe.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { MultimediaModule } from '../multimedia/multimedia.module';
import { BullModule } from '@nestjs/bullmq';
import { CombinationsService } from './services/combinations.service';
import { CombinationsController } from './controllers/combinations/combinations.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  controllers: [WardrobeController, CombinationsController],
  providers: [WardrobeService, Logger, PrismaService, CombinationsService],
  imports: [
    MultimediaModule,
    BullModule.registerQueue({ name: 'images' }),
    AiModule,
  ],
})
export class WardrobeModule {}
