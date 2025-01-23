import { Logger, Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories/categories.controller';
import { CategoriesService } from './services/categories.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, Logger],
  imports: [AdminModule],
  exports: [CategoriesService],
})
export class CategoriesModule {}
