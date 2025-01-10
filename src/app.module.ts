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
import { ConfigModule } from '@nestjs/config';
import serverConfig from './shared/config/server.config';

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
      load: [serverConfig],
    }),
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
