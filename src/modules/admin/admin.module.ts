import { PrismaService } from '@/shared/services/prisma.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './services/admin.service';
import adminConfig from './config/admin.config';

@Module({
  providers: [PrismaService, Logger, AdminService],
  imports: [ConfigModule.forFeature(adminConfig)],
  exports: [AdminService],
})
export class AdminModule {}
