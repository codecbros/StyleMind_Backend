import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from '@shared/services/prisma.service';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import { SecurityModule } from '@modules/security/security.module';
import { UsersModule } from '@modules/users/users.module';
import winston from 'winston';
import { HealthController } from '@shared/controllers/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { CategoriesModule } from './modules/categories/categories.module';
import { DateFormatInterceptor } from './shared/interceptors/date-format.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import serverConfig from './shared/config/server.config';
import { BullModule } from '@nestjs/bullmq';
import { AdminModule } from './modules/admin/admin.module';
import { WardrobeModule } from './modules/wardrobe/wardrobe.module';
import redisConfig from './shared/config/redis.config';
import paginationConfig from './shared/config/pagination.config';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { MultimediaModule } from './modules/multimedia/multimedia.module';
import { AiModule } from './modules/ai/ai.module';
import minioConfig from './modules/multimedia/config/minio.config';
import firebaseConfig from './modules/multimedia/config/firebase.config';
import multimediaConfig from './modules/multimedia/config/multimedia.config';
import aiConfig from './modules/ai/config/ai.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15,
      },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 6000, lruSize: 5000 }),
          }),
          new KeyvRedis(
            configService.get('redis.username')
              ? `rediss://${configService.get('redis.username')}:${configService.get('redis.password')}@${configService.get('redis.host')}:${configService.get('redis.port')}`
              : `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
          ),
        ],
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('StyleMind', {
              colors: true,
              prettyPrint: true,
              processId: true,
              appName: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
    }),
    TerminusModule.forRoot({
      logger: Logger,
    }),
    SecurityModule,
    UsersModule,
    CategoriesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [
        serverConfig,
        redisConfig,
        paginationConfig,
        minioConfig,
        firebaseConfig,
        multimediaConfig,
        aiConfig,
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get('redis.username')
            ? `rediss://${configService.get('redis.username')}:${configService.get('redis.password')}@${configService.get('redis.host')}:${configService.get('redis.port')}`
            : `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: 50,
          removeOnFail: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    AdminModule,
    WardrobeModule,
    MultimediaModule,
    AiModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
  ],
})
export class AppModule {}
