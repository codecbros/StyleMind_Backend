import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from '../dtos/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {
    this.createDefaultCategories();
  }

  private async createDefaultCategories() {
    const defaultCategories = [
      'Sin categoría',
      'Camisetas',
      'Pantalones',
      'Zapatos',
    ];

    for (const category of defaultCategories) {
      const existCategory = await this.db.category.findFirst({
        where: {
          name: category,
          isDefault: true,
        },
      });

      if (existCategory) {
        continue;
      }

      await this.db.category
        .create({
          data: {
            name: category,
            isPublic: true,
            isDefault: true,
          },
        })
        .catch((error) => {
          this.logger.error(error);
          throw new InternalServerErrorException(
            'Error al crear las categorías por defecto',
          );
        });
    }
  }

  async createCategory(
    data: CreateCategoryDto,
    userId: string,
  ): Promise<ResponseDataInterface> {
    const newCategory = this.db.category
      .create({
        data: {
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          createdBy: {
            connect: {
              id: userId,
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw new BadRequestException('Error al crear la categoría');
      });

    return {
      data: newCategory,
      message: 'Categoría creada',
    };
  }

  async getMyCategories(
    userId: string,
    status: boolean,
  ): Promise<ResponseDataInterface> {
    const categories = await this.db.category
      .findMany({
        where: {
          status,
          OR: [
            {
              isDefault: true,
            },
            {
              createdBy: {
                id: userId,
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          isDefault: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw new InternalServerErrorException(
          'Error al obtener las categorías',
        );
      });

    return {
      data: categories,
      message: 'Categories encontradas',
    };
  }

  async getPublicCategories(userId: string): Promise<ResponseDataInterface> {
    const categories = await this.db.category
      .findMany({
        where: {
          isPublic: true,
          isDefault: false,
          NOT: {
            createdById: userId,
          },
          status: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw new InternalServerErrorException(
          'Error al obtener las categorías',
        );
      });

    return {
      data: categories,
      message: 'Categories encontradas',
    };
  }

  async getCategoryById(
    userId: string,
    categoryId: string,
  ): Promise<ResponseDataInterface> {
    const category = await this.db.category
      .findUniqueOrThrow({
        where: {
          id: categoryId,
          createdById: userId,
        },
        select: {
          id: true,
          name: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          wardrobeItems: {
            select: {
              id: true,
              wardrobeItem: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Categoría no encontrada');
      });

    return {
      data: category,
      message: 'Categoría encontrada',
    };
  }
}
