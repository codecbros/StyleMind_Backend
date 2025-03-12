import { PrismaService } from '@/shared/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateCombinationDto } from '../dtos/combinations.dto';
import { ClothingItem } from '../interfaces/combinations.interface';
import { generateCombinationsPrompt } from '../prompts/combinations.prompts';
import { AiService } from '@/modules/ai/ai.service';
import { z } from 'zod';

@Injectable()
export class CombinationsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
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
          categoryId: z.string(),
          explanation: z.string(),
        }),
      ),
    });

    return {
      data: await this.ai.generateJSON(prompt, schema, 0),
      message: 'Prompt generated successfully',
    };
  }
}
