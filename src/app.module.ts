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
import { BullModule } from '@nestjs/bull';
import { AdminModule } from './modules/admin/admin.module';
import { WardrobeModule } from './modules/wardrobe/wardrobe.module';
import redisConfig from './shared/config/redis.config';
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 2000,
      max: 1000,
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
      load: [serverConfig, redisConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          username: configService.get('redis.username'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.ssl')
            ? {
                rejectUnauthorized: false,
              }
            : null,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    AdminModule,
    WardrobeModule,
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
