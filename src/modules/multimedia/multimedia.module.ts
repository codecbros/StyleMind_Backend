import { Logger, Module } from '@nestjs/common';
import { MultimediaController } from './controllers/multimedia.controller';
import { MultimediaService } from './services/multimedia.service';
import multimediaConfig from './config/multimedia.config';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ImagesConsumer } from './consumer/images.consumer';
import firebaseConfig from './config/firebase.config';
import { PrismaService } from '@/shared/services/prisma.service';

@Module({
  controllers: [MultimediaController],
  providers: [MultimediaService, ImagesConsumer, Logger, PrismaService],
  imports: [
    ConfigModule.forFeature(firebaseConfig),
    ConfigModule.forFeature(multimediaConfig),
    BullModule.registerQueue({ name: 'images' }),
  ],
})
export class MultimediaModule {}
