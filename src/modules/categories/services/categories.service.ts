import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/categories.dto';
import path from 'path';
import fs from 'fs';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { AdminService } from '@/modules/admin/services/admin.service';

@Injectable()
export class CategoriesService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    // @InjectQueue('admin_queue') private adminQueue: Queue,
    private adminService: AdminService,
  ) {}

  async createDefaultCategories() {
    const filePath = path.join(
      __dirname,
      '../../../../resources/categories.json',
    );
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const defaultCategories = JSON.parse(fileContent);

    for (const category of defaultCategories) {
      const existCategory = await this.db.category.findFirst({
        where: {
          name: category.name,
        },
      });

      if (existCategory) {
        continue;
      }

      const cretedCategory = await this.db.category
        .create({
          data: {
            name: category.name,
          },
        })
        .catch((error) => {
          this.logger.error(error);
          throw new InternalServerErrorException(
            'Error al crear las categorías por defecto',
          );
        });

      for (const gender of category.genders) {
        await this.db.categoryGender
          .create({
            data: {
              category: {
                connect: {
                  id: cretedCategory.id,
                },
              },
              gender: {
                connect: {
                  name: gender.name,
                },
              },
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

    this.logger.log('Categorías generadas con éxito', CategoriesService.name);
    await this.adminService.createAdmin();
  }

  async createCategory(
    data: CreateCategoryDto,
  ): Promise<ResponseDataInterface<any>> {
    const createdCategory = await this.db.$transaction(async (cnx) => {
      const newCategory = await cnx.category
        .create({
          data: {
            name: data.name,
            description: data.description,
          },
        })
        .catch((error) => {
          this.logger.error(error);
          throw new BadRequestException('Error al crear la categoría');
        });

      const genders = data.gendersIds.map((id) => ({
        categoryId: newCategory.id,
        genderId: id,
      }));

      await cnx.categoryGender.createMany({
        data: genders,
      });
    });

    return {
      data: createdCategory,
      message: 'Categoría creada',
    };
  }

  async getMyCategories(
    userId: string,
    search: string = '',
  ): Promise<ResponseDataInterface<any>> {
    const userData = await this.db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        gender: {
          select: {
            id: true,
          },
        },
        showAllCategories: true,
      },
    });

    const categories = await this.db.category
      .findMany({
        where: {
          CategoryGender: userData.showAllCategories
            ? null
            : {
                some: {
                  gender: {
                    id: userData.gender.id,
                  },
                },
              },
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
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

  async getCategories(
    pagination: PaginationDto,
  ): Promise<ResponseDataInterface<any>> {
    const categories = await this.db.category
      .findMany({
        where: {
          status: true,
          name: {
            contains: pagination.search,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          CategoryGender: {
            select: {
              id: true,
              gender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: pagination.limit,
        skip: pagination.page,
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
    categoryId: string,
  ): Promise<ResponseDataInterface<any>> {
    const category = await this.db.category
      .findUniqueOrThrow({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
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

  async updateCategory(
    data: UpdateCategoryDto,
    id: string,
  ): Promise<ResponseDataInterface<any>> {
    const category = await this.db.category
      .update({
        where: {
          id,
        },
        data: {
          name: data.name,
          description: data.description,
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw new BadRequestException('Error al actualizar la categoría');
      });

    return {
      data: category,
      message: 'Categoría actualizada',
    };
  }

  async updateStatus(id: string): Promise<ResponseDataInterface<any>> {
    const category = await this.db.category
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Categoría no encontrada');
      });

    const updatedCategory = await this.db.category
      .update({
        where: {
          id,
        },
        data: {
          status: !category.status,
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw new BadRequestException(
          'Error al actualizar el estado de la categoría',
        );
      });

    return {
      data: updatedCategory,
      message: 'Estado de la categoría actualizado',
    };
  }
}
