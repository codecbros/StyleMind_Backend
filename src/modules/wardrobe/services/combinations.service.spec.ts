import { Test, TestingModule } from '@nestjs/testing';
import { CombinationsService } from './combinations.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { AiService } from '@/modules/ai/ai.service';
import { MultimediaService } from '@/modules/multimedia/services/multimedia.service';
import {
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateCombinationDto,
  SaveCombinationDto,
  AddItemsToCombinationDto,
} from '../dtos/combinations.dto';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

// Mock @toon-format/toon module
jest.mock('@toon-format/toon', () => ({
  encode: jest.fn((data) => JSON.stringify(data)),
}));

describe('CombinationsService', () => {
  let service: CombinationsService;
  let prismaService: PrismaService;
  let aiService: AiService;
  let multimediaService: MultimediaService;
  let logger: Logger;

  const mockPrismaService = {
    wardrobeItem: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    combination: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    combinationItem: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockAiService = {
    generateJSON: jest.fn(),
    agent: jest.fn(),
  };

  const mockMultimediaService = {
    getUrlImage: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombinationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: MultimediaService,
          useValue: mockMultimediaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CombinationsService>(CombinationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
    multimediaService = module.get<MultimediaService>(MultimediaService);
    logger = module.get<Logger>(Logger);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCombinations', () => {
    const userId = 'user-123';
    const createCombinationDto: CreateCombinationDto = {
      clothingItemsBase: ['item-1', 'item-2'],
      categories: ['cat-1', 'cat-2'],
      occasions: ['Casual', 'Work'],
      description: 'A casual outfit',
      take: 5,
      page: 1,
    };

    const mockBaseItems = [
      {
        id: 'item-1',
        name: 'Blue Shirt',
        description: 'A blue shirt',
        season: 'Summer',
        primaryColor: '#0000FF',
        secondaryColor: '#FFFFFF',
        style: 'Casual',
        material: 'Cotton',
        size: 'M',
        categories: [{ id: 'cat-1' }],
      },
    ];

    const mockCombinationItems = [
      {
        id: 'item-2',
        name: 'Black Pants',
        description: 'Black pants',
        season: 'All',
        primaryColor: '#000000',
        secondaryColor: null,
        style: 'Formal',
        material: 'Polyester',
        size: 'M',
        categories: [{ category: { id: 'cat-2' } }],
      },
    ];

    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Shirts',
      },
      {
        id: 'cat-2',
        name: 'Pants',
      },
    ];

    const mockAiResponse = {
      outfitRecommendation: [{ id: 'item-1' }, { id: 'item-2' }],
      overallExplanation: 'This is a great casual outfit',
    };

    it('should generate combinations successfully', async () => {
      // First call returns base items, second call returns combination items
      mockPrismaService.wardrobeItem.findMany
        .mockResolvedValueOnce(mockBaseItems)
        .mockResolvedValueOnce(mockCombinationItems);
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockAiService.agent.mockResolvedValue(mockAiResponse);
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        id: 'item-1',
        name: 'Blue Shirt',
        primaryColor: '#0000FF',
        secondaryColor: '#FFFFFF',
        images: [{ id: 'img-1' }],
      });
      mockMultimediaService.getUrlImage.mockResolvedValue(
        'http://example.com/image.jpg',
      );

      const result = await service.generateCombinations(createCombinationDto, userId);

      expect(result.message).toBe('Combinaciones generadas correctamente');
      expect(result.data.explanation).toBe('This is a great casual outfit');
      expect(result.data.items).toHaveLength(2);
      expect(mockAiService.agent).toHaveBeenCalled();
    });

    it('should handle AI service errors', async () => {
      mockPrismaService.wardrobeItem.findMany
        .mockResolvedValueOnce(mockBaseItems)
        .mockResolvedValueOnce(mockCombinationItems);
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockAiService.agent.mockRejectedValue(new Error('AI Error'));

      await expect(
        service.generateCombinations(createCombinationDto, userId),
      ).rejects.toThrow();
    });

    it('should throw InternalServerErrorException if wardrobe item not found during generation', async () => {
      mockPrismaService.wardrobeItem.findMany
        .mockResolvedValueOnce(mockBaseItems)
        .mockResolvedValueOnce(mockCombinationItems);
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockAiService.agent.mockResolvedValue(mockAiResponse);
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.generateCombinations(createCombinationDto, userId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should use default take value if not provided', async () => {
      const dtoWithoutTake = { ...createCombinationDto, take: undefined };
      mockPrismaService.wardrobeItem.findMany
        .mockResolvedValueOnce(mockBaseItems)
        .mockResolvedValueOnce(mockCombinationItems);
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockAiService.agent.mockResolvedValue({
        outfitRecommendation: [],
        overallExplanation: 'Test',
      });

      await service.generateCombinations(dtoWithoutTake, userId);

      expect(mockPrismaService.wardrobeItem.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveCombination', () => {
    const userId = 'user-123';
    const saveCombinationDto: SaveCombinationDto = {
      name: 'My Outfit',
      description: 'A casual outfit',
      occasions: ['Casual'],
      isAIGenerated: true,
      explanation: 'This is a great combination',
      combinationItems: [
        { wardrobeItemId: 'item-1' },
        { wardrobeItemId: 'item-2' },
      ],
    };

    it('should save combination successfully', async () => {
      mockPrismaService.combination.create.mockResolvedValue({ id: 'comb-1' });
      mockPrismaService.combinationItem.createMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.saveCombination(saveCombinationDto, userId);

      expect(result.message).toBe('Combinación guardada correctamente');
      expect(result.data.id).toBe('comb-1');
      expect(mockPrismaService.combination.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Outfit',
            userId,
          }),
        }),
      );
      expect(mockPrismaService.combinationItem.createMany).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.combination.create.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.saveCombination(saveCombinationDto, userId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getCombinations', () => {
    const userId = 'user-123';
    const pagination: PaginationDto = {
      page: 1,
      limit: 20,
      offset: 0,
      status: true,
      search: '',
    };

    it('should return combinations successfully', async () => {
      const mockCombinations = [
        {
          id: 'comb-1',
          description: 'Casual outfit',
          occasions: ['Casual'],
          isAIGenerated: true,
        },
      ];

      mockPrismaService.combination.findMany.mockResolvedValue(
        mockCombinations,
      );

      const result = await service.getCombinations(userId, pagination);

      expect(result.message).toBe('Combinaciones encontradas correctamente');
      expect(result.data).toEqual(mockCombinations);
    });

    it('should throw NotFoundException if no combinations found', async () => {
      mockPrismaService.combination.findMany.mockResolvedValue([]);

      await expect(service.getCombinations(userId, pagination)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getCombinations(userId, pagination)).rejects.toThrow(
        'No se encontraron combinaciones guardadas',
      );
    });

    it('should apply pagination parameters', async () => {
      mockPrismaService.combination.findMany.mockResolvedValue([
        { id: 'comb-1', description: '', occasions: [], isAIGenerated: false },
      ]);

      await service.getCombinations(userId, pagination);

      expect(mockPrismaService.combination.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('updateStatusCombination', () => {
    const combinationId = 'comb-1';

    it('should update combination status successfully', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combination.update.mockResolvedValue({});

      const result = await service.updateStatusCombination(combinationId);

      expect(result.message).toBe('Combinación actualizada correctamente');
      expect(mockPrismaService.combination.update).toHaveBeenCalledWith({
        where: { id: combinationId },
        data: { status: false },
      });
    });

    it('should throw NotFoundException if combination not found', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.updateStatusCombination(combinationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on update error', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combination.update.mockRejectedValue(
        new Error('Update error'),
      );

      await expect(
        service.updateStatusCombination(combinationId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getCombinationById', () => {
    const combinationId = 'comb-1';

    it('should return combination by id successfully', async () => {
      const mockCombination = {
        id: 'comb-1',
        name: 'My Outfit',
        description: 'Casual',
        occasions: ['Casual'],
        isAIGenerated: true,
        items: [
          {
            id: 'ci-1',
            wardrobeItem: {
              id: 'item-1',
              name: 'Blue Shirt',
              description: 'A shirt',
              season: 'Summer',
              primaryColor: '#0000FF',
              secondaryColor: null,
              style: 'Casual',
              material: 'Cotton',
              size: 'M',
              categories: [{ category: { id: 'cat-1', name: 'Shirts' } }],
            },
            aiDescription: 'Perfect shirt',
          },
        ],
      };

      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue(
        mockCombination,
      );

      const result = await service.getCombinationById(combinationId);

      expect(result.message).toBe('Combinación encontrada correctamente');
      expect(result.data).toEqual(mockCombination);
    });

    it('should throw NotFoundException if combination not found', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.getCombinationById(combinationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addItemsToCombination', () => {
    const addItemsDto: AddItemsToCombinationDto = {
      combinationId: 'comb-1',
      combinationItems: [
        { wardrobeItemId: 'item-1' },
        { wardrobeItemId: 'item-2' },
      ],
    };

    it('should add new items to combination successfully', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combinationItem.findFirst.mockResolvedValue(null);
      mockPrismaService.combinationItem.create.mockResolvedValue({});

      const result = await service.addItemsToCombination(addItemsDto);

      expect(result.message).toBe(
        'Prendas agregadas correctamente a la combinación',
      );
      expect(mockPrismaService.combinationItem.create).toHaveBeenCalledTimes(2);
    });

    it('should reactivate existing inactive items', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combinationItem.findFirst.mockResolvedValue({
        id: 'ci-1',
        status: false,
        wardrobeItem: { name: 'Blue Shirt' },
      });
      mockPrismaService.combinationItem.update.mockResolvedValue({});

      const result = await service.addItemsToCombination(addItemsDto);

      expect(result.message).toBe(
        'Prendas agregadas correctamente a la combinación',
      );
      expect(mockPrismaService.combinationItem.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if item is already active in combination', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combinationItem.findFirst.mockResolvedValue({
        id: 'ci-1',
        status: true,
        wardrobeItem: { name: 'Blue Shirt' },
      });

      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        "La prenda 'Blue Shirt' ya está en la combinación",
      );
    });

    it('should throw NotFoundException if combination not found', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if combination is inactive', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: false,
      });

      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        'No se puede agregar prendas a una combinación eliminada',
      );
    });

    it('should throw InternalServerErrorException on create error', async () => {
      mockPrismaService.combination.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.combinationItem.findFirst.mockResolvedValue(null);
      mockPrismaService.combinationItem.create.mockRejectedValue(
        new Error('Create error'),
      );

      await expect(service.addItemsToCombination(addItemsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateStatusItemFromCombination', () => {
    const combinationId = 'comb-1';
    const wardrobeItemId = 'item-1';

    it('should update item status in combination successfully', async () => {
      mockPrismaService.combinationItem.findFirstOrThrow.mockResolvedValue({
        status: true,
        combination: { status: true },
      });
      mockPrismaService.combinationItem.updateMany.mockResolvedValue({});

      const result = await service.updateStatusItemFromCombination(
        combinationId,
        wardrobeItemId,
      );

      expect(result.message).toBe(
        'Prenda eliminada correctamente de la combinación',
      );
      expect(mockPrismaService.combinationItem.updateMany).toHaveBeenCalledWith(
        {
          where: { wardrobeItemId, combinationId },
          data: { status: false },
        },
      );
    });

    it('should throw NotFoundException if item not found in combination', async () => {
      mockPrismaService.combinationItem.findFirstOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.updateStatusItemFromCombination(combinationId, wardrobeItemId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if combination is inactive', async () => {
      mockPrismaService.combinationItem.findFirstOrThrow.mockResolvedValue({
        status: true,
        combination: { status: false },
      });

      await expect(
        service.updateStatusItemFromCombination(combinationId, wardrobeItemId),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.updateStatusItemFromCombination(combinationId, wardrobeItemId),
      ).rejects.toThrow(
        'No se puede eliminar prendas de una combinación eliminada',
      );
    });

    it('should throw InternalServerErrorException on update error', async () => {
      mockPrismaService.combinationItem.findFirstOrThrow.mockResolvedValue({
        status: true,
        combination: { status: true },
      });
      mockPrismaService.combinationItem.updateMany.mockRejectedValue(
        new Error('Update error'),
      );

      await expect(
        service.updateStatusItemFromCombination(combinationId, wardrobeItemId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
