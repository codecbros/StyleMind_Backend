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
import { PaginatedResponseDto } from '@/shared/dtos/paginated-response.dto';
import { MultimediaService } from '@/modules/multimedia/services/multimedia.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WardrobeService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    private multimediaService: MultimediaService,
    @InjectQueue('images')
    private imageQueue: Queue,
  ) {}

  private async verifyItemInCategories(
    name: string,
    categoriesId: string[],
    userId: string,
    excludeItemId?: string,
  ) {
    for (const categoryId of categoriesId) {
      const existClothes = await this.db.wardrobeCategory.findFirst({
        where: {
          categoryId,
          status: true,
          wardrobeItem: {
            name: name,
            status: true,
            userId: userId,
            ...(excludeItemId && { id: { not: excludeItemId } }),
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
    const clothes = await this.db.wardrobeItem
      .findUniqueOrThrow({
        where: { id: itemId },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No existe la prenda');
      });

    if (!clothes.status)
      throw new BadRequestException('La prenda se encuentra desactivada');
  }

  async create(
    data: CreateClothesDto,
    userId: string,
  ): Promise<ResponseDataInterface<any>> {
    const created = await this.db.$transaction(async (cnx) => {
      await this.verifyItemInCategories(data.name, data.categoriesId, userId);

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
          select: {
            id: true,
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

      return itemCreated;
    });

    return {
      message: 'Prenda agregada correctamente',
      data: {
        id: created.id,
      },
    };
  }

  async getClothes(
    userId: string,
    pagination: PaginationDto,
    categoryId?: string,
  ): Promise<PaginatedResponseDto<any>> {
    const whereClause = {
      userId,
      categories: {
        some: {
          categoryId: categoryId ?? undefined,
        },
      },
      name: {
        contains: pagination.search,
        mode: 'insensitive' as const,
      },
      status: pagination.status,
    };

    const [data, total] = await Promise.all([
      this.db.wardrobeItem.findMany({
        where: whereClause,
        skip: pagination.offset,
        take: pagination.limit,
        select: {
          id: true,
          name: true,
          season: true,
          primaryColor: true,
          secondaryColor: true,
          style: true,
          size: true,
          images: {
            select: {
              id: true,
            },
            where: {
              status: true,
            },
          },
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
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.db.wardrobeItem.count({
        where: whereClause,
      }),
    ]);

    for (const item of data) {
      item.images = await this.getImages(item.images);
      // Aplanar estructura de categorías: { category: { id, name } } -> { id, name }
      (item as any).categories = item.categories.map((c) => c.category);
    }

    const totalPages = Math.ceil(total / pagination.limit);
    const hasMore = pagination.page < totalPages;

    return {
      data,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasMore,
      nextPage: hasMore ? pagination.page + 1 : null,
    };
  }

  async getClothesById(id: string): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(id);

    const clothes = await this.db.wardrobeItem
      .findUniqueOrThrow({
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

    clothes.images = await this.getImages(clothes.images);
    // Aplanar estructura de categorías: { category: { id, name } } -> { id, name }
    (clothes as any).categories = clothes.categories.map((c) => c.category);

    return {
      data: clothes,
      message: 'Prenda encontrada',
    };
  }

  private async getImages(images: { id: string }[]) {
    const auxImages = [];
    for (const image of images) {
      const url = await this.multimediaService.getUrlImage(image.id);
      auxImages.push({
        id: image.id,
        url,
      });
    }

    return auxImages;
  }

  async update(
    data: UpdateClothesDto,
    id: string,
  ): Promise<ResponseDataInterface<any>> {
    const item = await this.db.wardrobeItem
      .findUniqueOrThrow({
        where: { id },
        select: {
          status: true,
          userId: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No existe la prenda');
      });

    if (!item.status)
      throw new BadRequestException('La prenda se encuentra desactivada');

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

      await this.verifyItemInCategories(data.name, categories, item.userId, id);
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

  async uploadFiles(files: Storage.MultipartFile[], itemId: string) {
    const item = await this.db.wardrobeItem
      .findUniqueOrThrow({
        where: {
          id: itemId,
        },
        select: {
          images: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('El item no existe');
      });

    if (4 - item.images.length <= 0)
      throw new BadRequestException(
        'Sólo es permitido tener 4 imágenes por prenda',
      );

    for (const file of files) {
      await this.imageQueue.add('compress', {
        filename: file.filename,
        itemId,
        buffer: file.buffer,
      });
    }

    return { message: 'Archivo subido' };
  }

  private async updateImageStatus(
    itemId: string,
    imageId: string,
    newStatus: boolean,
  ): Promise<ResponseDataInterface<any>> {
    await this.verifyStatus(itemId);

    const image = await this.db.image.findFirst({
      where: {
        id: imageId,
        wardrobeItemId: itemId,
      },
      select: {
        status: true,
      },
    });

    if (!image)
      throw new NotFoundException(
        'La imagen no existe o no pertenece a esta prenda',
      );

    if (image.status === newStatus) {
      throw new BadRequestException(
        newStatus
          ? 'La imagen ya se encuentra activada'
          : 'La imagen ya se encuentra desactivada',
      );
    }

    await this.db.image
      .update({
        where: { id: imageId },
        data: { status: newStatus },
      })
      .catch((e) => {
        this.logger.error(e.message, WardrobeService.name);
        throw new InternalServerErrorException(
          'No se pudo actualizar el estado de la imagen',
        );
      });

    return {
      message: newStatus
        ? 'Imagen activada con éxito'
        : 'Imagen desactivada con éxito',
      data: null,
    };
  }

  async deactivateImage(
    itemId: string,
    imageId: string,
  ): Promise<ResponseDataInterface<any>> {
    return this.updateImageStatus(itemId, imageId, false);
  }

  async activateImage(
    itemId: string,
    imageId: string,
  ): Promise<ResponseDataInterface<any>> {
    return this.updateImageStatus(itemId, imageId, true);
  }
}
