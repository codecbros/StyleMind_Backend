import { Logger, Module } from '@nestjs/common';
import { WardrobeController } from './controllers/wardrobe/wardrobe.controller';
import { WardrobeService } from './services/wardrobe.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { MultimediaModule } from '../multimedia/multimedia.module';
import { BullModule } from '@nestjs/bullmq';
import { CombinationsService } from './services/combinations.service';

@Module({
  controllers: [WardrobeController],
  providers: [WardrobeService, Logger, PrismaService, CombinationsService],
  imports: [MultimediaModule, BullModule.registerQueue({ name: 'images' })],
})
export class WardrobeModule {}
