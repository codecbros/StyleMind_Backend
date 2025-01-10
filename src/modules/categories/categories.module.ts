import { Logger, Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories/categories.controller';
import { CategoriesService } from './services/categories.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { BullModule } from '@nestjs/bull';
import { CategoriesConsumer } from './consumers/categories.consumer';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, Logger, CategoriesConsumer],
  imports: [
    BullModule.registerQueue({
      name: 'admin_queue',
    }),
  ],
})
export class CategoriesModule {}
