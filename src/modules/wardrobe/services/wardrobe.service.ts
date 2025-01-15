import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateClothesDto } from '../dtos/wardrobe.dtos';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Injectable()
export class WardrobeService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {}

  async create(
    data: CreateClothesDto,
    userId: string,
  ): Promise<ResponseDataInterface<null>> {
    await this.db.$transaction(async (cnx) => {
      for (const categoryId of data.categoriesId) {
        const existClothes = await cnx.wardrobeCategory.findFirst({
          where: {
            categoryId,
            wardrobeItem: {
              name: data.name,
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
      },
      skip: pagination.page,
      take: pagination.limit,
    });

    return {
      message: 'Armario obtenido',
      data,
    };
  }
}
