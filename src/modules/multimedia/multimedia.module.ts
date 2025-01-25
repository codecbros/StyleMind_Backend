import { Logger, Module } from '@nestjs/common';
import { MultimediaController } from './controllers/multimedia.controller';
import { MultimediaService } from './services/multimedia.service';
import { ConfigModule } from '@nestjs/config';
import { ImagesConsumer } from './consumer/images.consumer';
import firebaseConfig from './config/firebase.config';
import { PrismaService } from '@/shared/services/prisma.service';

@Module({
  controllers: [MultimediaController],
  providers: [MultimediaService, ImagesConsumer, Logger, PrismaService],
  imports: [ConfigModule.forFeature(firebaseConfig)],
  exports: [MultimediaService],
})
export class MultimediaModule {}
