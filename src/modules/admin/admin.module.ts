import { PrismaService } from '@/shared/services/prisma.service';
import { Logger, Module } from '@nestjs/common';
import { AdminConsumer } from './consumers/admin.consumer';
import { ConfigModule } from '@nestjs/config';
import adminConfig from './config/admin.config';

@Module({
  providers: [PrismaService, AdminConsumer, Logger],
  imports: [ConfigModule.forFeature(adminConfig)],
})
export class AdminModule {}
