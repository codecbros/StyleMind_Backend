import { Logger, Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories/categories.controller';
import { CategoriesService } from './services/categories.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { CategoriesConsumer } from './consumers/categories.consumer';
import { AdminModule } from '../admin/admin.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, Logger, CategoriesConsumer],
  imports: [AdminModule],
  exports: [CategoriesService],
})
export class CategoriesModule {}
