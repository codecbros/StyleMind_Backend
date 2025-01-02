import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CategoriesService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {}

  async getCategories(
    userId: string,
    isPublic: boolean = false,
  ): Promise<ResponseDataInterface> {
    const categories = this.db.category.findMany({
      where: {
        isPublic,
      },
    });

    return {
      data: categories,
      message: 'Categories encontradas',
    };
  }
}
