import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AddItemsToCombinationDto,
  CreateCombinationDto,
  QuickGenerateCombinationDto,
  SaveCombinationDto,
} from '../dtos/combinations.dto';
import {
  ClothingItem,
  GenerationSession,
  QuickGenerationResponse,
} from '../interfaces/combinations.interface';
import {
  generateCombinationsPrompt,
  generateQuickCombinationsPrompt,
} from '../prompts/combinations.prompts';
import { AiService } from '@/modules/ai/ai.service';
import { z } from 'zod';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { MultimediaService } from '@/modules/multimedia/services/multimedia.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CombinationsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
    private logger: Logger,
    private multimediaService: MultimediaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async generateCombinations(payload: CreateCombinationDto, userId: string) {
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

    const combinationsItems = await this.db.wardrobeItem.findMany({
      where: {
        categories: {
          some: {
            categoryId: {
              in: payload.categories,
            },
          },
        },
        user: {
          id: userId,
        }
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
              }
            }
          },
        },
      }
    });

    const categories = await this.db.category.findMany({
      where: {
        id: {
          in: payload.categories,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const items = combinationsItems.map((item) => ({
      ...item,
      categories: item.categories.map((category) => ({
        id: category.category.id,
      })),
    }));

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
        }),
      ),
      overallExplanation: z.string(),
    });

    const combinations = (await this.ai.agent(
      prompt,
      schema,
    )) as z.infer<typeof schema>;
    const outfitItems = [];

    for (const item of combinations.outfitRecommendation) {
      const wardrobeItem = await this.db.wardrobeItem
        .findUniqueOrThrow({
          where: {
            id: item.id,
          },
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
            images: {
              select: {
                id: true,
              },
              where: {
                status: true,
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

      // Generate image URLs
      const imageUrls = await Promise.all(
        wardrobeItem.images.map((image) =>
          this.multimediaService.getUrlImage(image.id),
        ),
      );

      outfitItems.push({
        id: wardrobeItem.id,
        name: wardrobeItem.name,
        primaryColor: wardrobeItem.primaryColor,
        secondaryColor: wardrobeItem.secondaryColor,
        images: imageUrls,
      });
    }

    return {
      data: {
        explanation: combinations.overallExplanation,
        items: outfitItems,
      },
      message: 'Combinaciones generadas correctamente',
    };
  }

  async saveCombination(data: SaveCombinationDto, userId: string) {
    const { name, description, occasions, isAIGenerated, explanation } = data;

    const combination = await this.db.combination
      .create({
        data: {
          name,
          description,
          occasions,
          isAIGenerated,
          userId,
          aiDescription: explanation,
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
      combinationId: combination.id,
    }));

    await this.db.combinationItem.createMany({
      data: combinationItems,
    });

    // Clear generation session if this was a quick-generated combination
    if (occasions && occasions.length > 0) {
      await this._deleteGenerationSession(userId, occasions[0]);
    }

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
      skip: pagination.offset,
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

  // Quick Generation Methods

  async generateQuickCombination(
    payload: QuickGenerateCombinationDto,
    userId: string,
  ): Promise<QuickGenerationResponse> {
    // 1. Validate minimum wardrobe size
    const wardrobeCount = await this.db.wardrobeItem.count({
      where: { userId, status: true },
    });

    if (wardrobeCount < 5) {
      throw new BadRequestException({
        message:
          'Insufficient wardrobe items. You need at least 5 items to generate an outfit. Please add more items to your wardrobe.',
        code: 'INSUFFICIENT_ITEMS',
      });
    }

    // 2. Retrieve or create generation session
    const session = await this._getOrCreateSession(userId, payload.occasion);
    const excludeItemIds = payload.requestAlternative
      ? session.previousOutfits.flatMap((o) => o.itemIds)
      : [];

    // 3. Fetch all active wardrobe items (with pre-filtering for large wardrobes)
    const allItems = await this._fetchWardrobeItems(userId, excludeItemIds);

    if (allItems.length === 0) {
      throw new NotFoundException({
        message:
          'No viable alternatives exist with your current wardrobe items. Try adding more items or starting a new search with a different occasion.',
        code: 'NO_ALTERNATIVES',
      });
    }

    // 4. Generate outfit with AI (includes retry logic)
    const aiResponse = await this._attemptGeneration(allItems, payload.occasion);

    // 5. Validate AI response
    if (
      aiResponse.outfitRecommendation.length < 3 ||
      aiResponse.outfitRecommendation.length > 10
    ) {
      throw new InternalServerErrorException('AI generated invalid outfit size');
    }

    // 6. Fetch full item details with images
    const outfitItems = await this._fetchOutfitDetails(
      aiResponse.outfitRecommendation,
    );

    // 7. Update session with new outfit
    await this._updateSession(
      userId,
      payload.occasion,
      aiResponse.outfitRecommendation,
    );

    // 8. Return response
    return {
      outfit: outfitItems,
      explanation: aiResponse.overallExplanation,
      occasion: payload.occasion,
      itemCount: outfitItems.length,
      generatedAt: new Date(),
    };
  }

  private async _getOrCreateSession(
    userId: string,
    occasion: string,
  ): Promise<GenerationSession> {
    const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;

    let session = await this.cacheManager.get<GenerationSession>(sessionKey);

    if (!session) {
      session = {
        userId,
        occasion: normalizedOccasion,
        previousOutfits: [],
        createdAt: new Date(),
      };
      await this.cacheManager.set(sessionKey, session, 3600000); // 1-hour TTL
    }

    return session;
  }

  private async _updateSession(
    userId: string,
    occasion: string,
    itemIds: string[],
  ): Promise<void> {
    const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;

    const session = await this.cacheManager.get<GenerationSession>(sessionKey);
    if (session) {
      session.previousOutfits.push({
        itemIds,
        generatedAt: new Date(),
      });
      await this.cacheManager.set(sessionKey, session, 3600000);
    }
  }

  async _deleteGenerationSession(
    userId: string,
    occasion: string,
  ): Promise<void> {
    const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;
    await this.cacheManager.del(sessionKey);
  }

  private async _fetchWardrobeItems(userId: string, excludeIds: string[]) {
    const items = await this.db.wardrobeItem.findMany({
      where: {
        userId,
        status: true,
        id: { notIn: excludeIds },
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
      },
    });

    // If > 100 items, apply season filtering (see research.md)
    // For now, return all items - can enhance later based on requirements
    return items;
  }

  private async _attemptGeneration(items: any[], occasion: string) {
    const prompt = generateQuickCombinationsPrompt(items, occasion);
    const schema = z.object({
      outfitRecommendation: z.array(z.string()),
      overallExplanation: z.string(),
    });

    try {
      return (await this.ai.agent(prompt, schema)) as z.infer<typeof schema>;
    } catch (error) {
      this.logger.warn(`Quick generation attempt 1 failed: ${error.message}`);

      // Single retry after 2-second delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        return (await this.ai.agent(prompt, schema)) as z.infer<typeof schema>;
      } catch (retryError) {
        this.logger.error(`Quick generation attempt 2 failed: ${retryError.message}`);
        throw new InternalServerErrorException({
          message: 'Failed to generate outfit. Please try again.',
          retryable: true,
          code: 'GENERATION_FAILED',
        });
      }
    }
  }

  private async _fetchOutfitDetails(itemIds: string[]) {
    const items = await this.db.wardrobeItem.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        images: {
          where: { status: true },
          select: { id: true },
        },
      },
    });

    // Generate image URLs for each item
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        const imageUrls = await Promise.all(
          item.images.map((image) =>
            this.multimediaService.getUrlImage(image.id),
          ),
        );

        return {
          id: item.id,
          name: item.name,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          images: item.images.map((image, index) => ({
            id: image.id,
            url: imageUrls[index],
          })),
        };
      }),
    );

    return itemsWithUrls;
  }
}
