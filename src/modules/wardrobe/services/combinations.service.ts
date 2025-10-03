import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AddItemsToCombinationDto,
  CreateCombinationDto,
  SaveCombinationDto,
} from '../dtos/combinations.dto';
import { ClothingItem } from '../interfaces/combinations.interface';
import { generateCombinationsPrompt } from '../prompts/combinations.prompts';
import { AiService } from '@/modules/ai/ai.service';
import { z } from 'zod';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Injectable()
export class CombinationsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
    private logger: Logger,
  ) {}

  async generateCombinations(payload: CreateCombinationDto) {
    const itemsBase: ClothingItem[] = await this.db.wardrobeItem.findMany({
      where: {
        id: {
          in: payload.clothingItemsBase,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        season: true,
        primaryColor: true,
        secondaryColor: true,
        style: true,
        material: true,
        size: true,
        categories: {
          select: {
            id: true,
          },
        },
      },
    });

    const combinationsItems = await this.db.category.findMany({
      where: {
        id: {
          in: payload.categories,
        },
      },
      select: {
        id: true,
        name: true,
        wardrobeItems: {
          select: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                description: true,
                season: true,
                primaryColor: true,
                secondaryColor: true,
                style: true,
                material: true,
                size: true,
                categories: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          take: payload.take ?? 5,
          skip: payload.page ? (payload.page - 1) * (payload.take ?? 5) : 0,
        },
      },
    });

    const categories = combinationsItems.map((category) => ({
      id: category.id,
      name: category.name,
    }));

    const items = combinationsItems.flatMap((category) =>
      category.wardrobeItems.map((item) => item.wardrobeItem),
    );

    const prompt = generateCombinationsPrompt(
      itemsBase,
      items,
      categories,
      payload.occasions,
      payload.description,
    );

    const schema = z.object({
      outfitRecommendation: z.array(
        z.object({
          id: z.string(),
          explanation: z.string(),
        }),
      ),
    });

    const combinations = await this.ai.generateJSON(prompt, schema, 0) as z.infer<typeof schema>;
    const outfitRecommendation: Array<{ explain: string; wardrobeItem: any }> = [];

    for (const item of combinations.outfitRecommendation) {
      const wardrobeItem = await this.db.wardrobeItem
        .findUniqueOrThrow({
          where: {
            id: item.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            season: true,
            primaryColor: true,
            secondaryColor: true,
            style: true,
            material: true,
            size: true,
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })
        .catch((error) => {
          this.logger.error(
            error.message,
            error.stack,
            CombinationsService.name,
          );

          throw new InternalServerErrorException(
            'No se pudo generar las combinaciones, vuelva a intentarlo',
          );
        });

      outfitRecommendation.push({
        explain: item.explanation,
        wardrobeItem,
      });
    }

    return {
      data: outfitRecommendation,
      message: 'Combinaciones generadas correctamente',
    };
  }

  async saveCombination(data: SaveCombinationDto, userId: string) {
    const { name, description, occasions, isAIGenerated } = data;

    const combination = await this.db.combination
      .create({
        data: {
          name,
          description,
          occasions,
          isAIGenerated,
          userId,
        },
        select: {
          id: true,
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new InternalServerErrorException(
          'No se pudo guardar la combinación, vuelva a intentarlo',
        );
      });

    const combinationItems = data.combinationItems.map((item) => ({
      wardrobeItemId: item.wardrobeItemId,
      aiDescription: item.explanation,
      combinationId: combination.id,
    }));

    await this.db.combinationItem.createMany({
      data: combinationItems,
    });

    return {
      message: 'Combinación guardada correctamente',
      data: combination,
    };
  }

  async getCombinations(userId: string, pagination: PaginationDto) {
    const combinations = await this.db.combination.findMany({
      where: {
        userId,
        status: pagination.status,
      },
      select: {
        id: true,
        description: true,
        occasions: true,
        isAIGenerated: true,
      },
      skip: pagination.page,
      take: pagination.limit,
    });

    if (combinations.length === 0) {
      throw new NotFoundException('No se encontraron combinaciones guardadas');
    }

    return {
      data: combinations,
      message: 'Combinaciones encontradas correctamente',
    };
  }

  async updateStatusCombination(combinationId: string) {
    const combination = await this.db.combination
      .findUniqueOrThrow({
        where: {
          id: combinationId,
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new NotFoundException('No se encontró la combinación');
      });

    await this.db.combination
      .update({
        where: {
          id: combinationId,
        },
        data: {
          status: !combination.status,
        },
      })
      .catch((error) => {
        this.logger.error(
          'No se pudo actualizar el estado de la combinación',
          error.stack,
          CombinationsService.name,
        );

        throw new InternalServerErrorException(
          'No se pudo actualizar el estado de la combinación, vuelva a intentarlo',
        );
      });

    return {
      message: 'Combinación actualizada correctamente',
    };
  }

  async getCombinationById(combinationId: string) {
    const combination = await this.db.combination
      .findUniqueOrThrow({
        where: {
          id: combinationId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          occasions: true,
          isAIGenerated: true,
          items: {
            select: {
              id: true,
              wardrobeItem: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  season: true,
                  primaryColor: true,
                  secondaryColor: true,
                  style: true,
                  material: true,
                  size: true,
                  categories: {
                    select: {
                      category: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              aiDescription: true,
            },
            where: {
              status: true,
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new NotFoundException('No se encontró la combinación');
      });

    return {
      message: 'Combinación encontrada correctamente',
      data: combination,
    };
  }

  async addItemsToCombination(items: AddItemsToCombinationDto) {
    const { combinationId, combinationItems } = items;

    const combination = await this.db.combination
      .findUniqueOrThrow({
        where: {
          id: combinationId,
        },
        select: {
          status: true,
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new NotFoundException('No se encontró la combinación');
      });

    if (!combination.status) {
      throw new InternalServerErrorException(
        'No se puede agregar prendas a una combinación eliminada',
      );
    }

    for (const item of combinationItems) {
      const combinationItem = await this.db.combinationItem.findFirst({
        where: {
          wardrobeItemId: item.wardrobeItemId,
          combinationId,
        },
        select: {
          id: true,
          status: true,
          wardrobeItem: {
            select: {
              name: true,
            },
          },
        },
      });

      if (combinationItem) {
        if (combinationItem.status) {
          throw new BadRequestException(
            `La prenda '${combinationItem.wardrobeItem.name}' ya está en la combinación`,
          );
        }

        await this.db.combinationItem
          .update({
            where: {
              id: combinationItem.id,
            },
            data: {
              status: true,
            },
          })
          .catch((error) => {
            this.logger.error(
              error.message,
              error.stack,
              CombinationsService.name,
            );

            throw new InternalServerErrorException(
              'No se pudo agregar la prenda a la combinación, vuelva a intentarlo',
            );
          });
      } else {
        await this.db.combinationItem
          .create({
            data: {
              wardrobeItemId: item.wardrobeItemId,
              combinationId,
              aiDescription: item.explanation,
            },
          })
          .catch((error) => {
            this.logger.error(
              error.message,
              error.stack,
              CombinationsService.name,
            );

            throw new InternalServerErrorException(
              'No se pudo agregar las prendas a la combinación, vuelva a intentarlo',
            );
          });
      }
    }

    return {
      message: 'Prendas agregadas correctamente a la combinación',
    };
  }

  async updateStatusItemFromCombination(
    combinationId: string,
    wardrobeItemId: string,
  ) {
    const item = await this.db.combinationItem
      .findFirstOrThrow({
        where: {
          combinationId,
          wardrobeItemId,
        },
        select: {
          status: true,
          combination: {
            select: {
              status: true,
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new NotFoundException('No se encontró la combinación');
      });

    if (!item.combination.status) {
      throw new InternalServerErrorException(
        'No se puede eliminar prendas de una combinación eliminada',
      );
    }

    await this.db.combinationItem
      .updateMany({
        where: {
          wardrobeItemId,
          combinationId,
        },
        data: {
          status: !item.status,
        },
      })
      .catch((error) => {
        this.logger.error(error.message, error.stack, CombinationsService.name);

        throw new InternalServerErrorException(
          'No se pudo eliminar la prenda de la combinación, vuelva a intentarlo',
        );
      });

    return {
      message: 'Prenda eliminada correctamente de la combinación',
    };
  }
}
