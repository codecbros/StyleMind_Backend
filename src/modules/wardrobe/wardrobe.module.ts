import { Logger, Module } from '@nestjs/common';
import { WardrobeController } from './controllers/wardrobe/wardrobe.controller';
import { WardrobeService } from './services/wardrobe.service';
import { PrismaService } from '@/shared/services/prisma.service';

@Module({
  controllers: [WardrobeController],
  providers: [WardrobeService, Logger, PrismaService],
})
export class WardrobeModule {}
