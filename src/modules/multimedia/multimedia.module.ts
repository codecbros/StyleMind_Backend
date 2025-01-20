import { Module } from '@nestjs/common';
import { MultimediaController } from './controllers/multimedia.controller';
import { MultimediaService } from './services/multimedia.service';
import multimediaConfig from './config/multimedia.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [MultimediaController],
  providers: [MultimediaService],
  imports: [ConfigModule.forFeature(multimediaConfig)],
})
export class MultimediaModule {}
