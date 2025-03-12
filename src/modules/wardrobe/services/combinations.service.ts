import { PrismaService } from '@/shared/services/prisma.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateCombinationDto,
  SaveCombinationDto,
} from '../dtos/combinations.dto';
import { ClothingItem } from '../interfaces/combinations.interface';
import { generateCombinationsPrompt } from '../prompts/combinations.prompts';
import { AiService } from '@/modules/ai/ai.service';
import { z } from 'zod';

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

    const combinations = await this.ai.generateJSON(prompt, schema, 0);

    const outfitRecommendation = [];

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

  async getCombinations(userId: string) {
    const combinations = await this.db.combination.findMany({
      where: {
        userId,
      },
      select: {
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
        },
        description: true,
        occasions: true,
        isAIGenerated: true,
      },
    });

    if (combinations.length === 0) {
      throw new NotFoundException('No se encontraron combinaciones guardadas');
    }

    return {
      data: combinations,
      message: 'Combinaciones encontradas correctamente',
    };
  }
}
