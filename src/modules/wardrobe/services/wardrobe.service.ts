import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateClothesDto, UpdateClothesDto } from '../dtos/wardrobe.dtos';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Injectable()
export class WardrobeService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {}

  private async verifyItemInCategories(name: string, categoriesId: string[]) {
    for (const categoryId of categoriesId) {
      const existClothes = await this.db.wardrobeCategory.findFirst({
        where: {
          categoryId,
          wardrobeItem: {
            name: name,
          },
        },
        select: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      if (existClothes)
        throw new BadRequestException(
          `Ya existe la prenda en la categoría ${existClothes.category.name}`,
        );
    }
  }

  private async verifyStatus(itemId: string) {
    const clothes = await this.db.wardrobeItem.findUnique({
      where: { id: itemId },
      select: {
        status: true,
      },
    });

    if (!clothes.status)
      throw new BadRequestException('La prenda se encuentra desactivada');
  }

  async create(
    data: CreateClothesDto,
    userId: string,
  ): Promise<ResponseDataInterface<null>> {
    await this.db.$transaction(async (cnx) => {
      await this.verifyItemInCategories(data.name, data.categoriesId);

      const itemCreated = await cnx.wardrobeItem
        .create({
          data: {
            name: data.name,
            description: data.description,
            season: data.season,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            style: data.style,
            material: data.material,
            size: data.size,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        })
        .catch((e) => {
          this.logger.error(e.message, WardrobeService.name);
          throw new BadRequestException('No se pudo crear la prenda');
        });

      if (data.categoriesId?.length <= 0) return;

      const wardrobeCategories = data.categoriesId.map((category) => {
        return {
          wardrobeItemId: itemCreated.id,
          categoryId: category,
        };
      });

      await cnx.wardrobeCategory
        .createMany({
          data: wardrobeCategories,
        })
        .catch((e) => {
          this.logger.error(e.message, WardrobeService.name);
          throw new InternalServerErrorException(
            'No se pudo enlazar las categorías con las prenda',
          );
        });
    });

    return {
      message: 'Prenda agregada correctamente',
    };
  }

  async getClothes(
    userId: string,
    pagination: PaginationDto,
    categoryId?: string,
  ): Promise<ResponseDataInterface<any>> {
    const data = await this.db.wardrobeItem.findMany({
      where: {
        userId,
        categories: {
          some: {
            categoryId: categoryId ?? undefined,
          },
        },
        name: {
          contains: pagination.search,
          mode: 'insensitive',
        },
        status: pagination.status,
      },
      skip: pagination.page,
      take: pagination.limit,
      select: {
        id: true,
        name: true,
        description: true,
        season: true,
        primaryColor: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      message: 'Armario obtenido',
      data,
    };
  }

  async getClothesById(id: string): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(id);

    const clothes = await this.db.wardrobeItem
      .findUnique({
        where: {
          id,
        },
        select: {
          name: true,
          description: true,
          season: true,
          primaryColor: true,
          secondaryColor: true,
          style: true,
          material: true,
          size: true,
          createdAt: true,
          updatedAt: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              status: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
            where: {
              status: true,
            },
          },
          combinations: {
            select: {
              id: true,
            },
            where: {
              status: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No existe la prenda');
      });

    return {
      data: clothes,
      message: 'Prenda encontrada',
    };
  }

  async update(
    data: UpdateClothesDto,
    id: string,
  ): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(id);

    if (data.name) {
      const findCategories = await this.db.wardrobeCategory.findMany({
        where: {
          wardrobeItem: {
            id,
          },
          status: true,
        },
        select: {
          category: {
            select: {
              id: true,
            },
          },
        },
      });

      const categories = findCategories.map((c) => c.category.id);

      await this.verifyItemInCategories(data.name, categories);
    }

    await this.db.wardrobeItem
      .update({
        where: {
          id,
        },
        data: {
          name: data.name,
          description: data.description,
          season: data.season,
          primaryColor: data.primaryColor,
          style: data.style,
          material: data.material,
          size: data.size,
        },
      })
      .catch((e) => {
        this.logger.error(e.message);
        throw new BadRequestException('No se pudo actualizar la prenda');
      });

    return {
      message: 'Prenda actualizada con éxito',
      data: null,
    };
  }

  async updateStatus(id: string): Promise<ResponseDataInterface<any>> {
    const clothes = await this.db.wardrobeItem
      .findUniqueOrThrow({ where: { id }, select: { status: true } })
      .catch(() => {
        throw new NotFoundException('No existe la prenda');
      });

    await this.db.wardrobeItem
      .update({
        where: { id },
        data: { status: !clothes.status },
      })
      .catch((e) => {
        this.logger.error(e.message, WardrobeService.name);
        throw new BadRequestException('No se pudo actualizar la prenda');
      });

    return {
      data: null,
      message: 'Estado de la prenda actualizada con éxito',
    };
  }

  private async updateStatusCategory(
    id: string,
    categoryId: string,
    status: boolean,
  ): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(id);

    const existCategory = await this.db.wardrobeCategory
      .findFirstOrThrow({
        where: {
          wardrobeItemId: id,
          categoryId,
        },
      })
      .catch(() => {
        throw new NotFoundException('No existe la categoría');
      });

    await this.db.wardrobeCategory.update({
      data: {
        status,
      },
      where: {
        id: existCategory.id,
      },
    });

    return {
      message: 'Categoría actualizada con éxito',
      data: null,
    };
  }

  async deactivateCategory(
    itemId: string,
    categoryId: string,
  ): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(itemId);

    const itemCategory = await this.db.wardrobeCategory.findFirst({
      where: {
        categoryId,
        wardrobeItemId: itemId,
      },
      select: {
        status: true,
      },
    });

    if (!itemCategory.status)
      throw new BadRequestException(
        'La categoría ya se encuentra desactivada en esta prenda',
      );

    return await this.updateStatusCategory(itemId, categoryId, false);
  }

  async addCategory(
    itemId: string,
    categoryId: string,
  ): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(itemId);

    const exist = await this.db.wardrobeCategory.findFirst({
      where: {
        wardrobeItemId: itemId,
        categoryId,
      },
      select: {
        status: true,
      },
    });

    if (exist?.status)
      throw new BadRequestException(
        'La categoría ya está asociada/activada a la prenda',
      );

    if (exist) {
      return await this.updateStatusCategory(itemId, categoryId, true);
    }

    await this.db.wardrobeCategory
      .create({
        data: {
          category: {
            connect: {
              id: categoryId,
            },
          },
          wardrobeItem: {
            connect: {
              id: itemId,
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'No se pudo asociar la prenda a la categoría',
        );
      });

    return {
      message: 'Prenda asociada a la categoría con éxito',
      data: null,
    };
  }
}
