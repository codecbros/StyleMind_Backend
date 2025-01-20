import { PrismaService } from '@/shared/services/prisma.service';
import { Logger, Module } from '@nestjs/common';
import { AdminConsumer } from './consumers/admin.consumer';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './services/admin.service';
import adminConfig from './config/admin.config';

@Module({
  providers: [PrismaService, AdminConsumer, Logger, AdminService],
  imports: [ConfigModule.forFeature(adminConfig)],
  exports: [AdminService],
})
export class AdminModule {}
