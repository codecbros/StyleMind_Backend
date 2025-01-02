import { Logger, Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories/categories.controller';
import { CategoriesService } from './services/categories.service';
import { PrismaService } from '@/shared/services/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, Logger],
})
export class CategoriesModule {}
