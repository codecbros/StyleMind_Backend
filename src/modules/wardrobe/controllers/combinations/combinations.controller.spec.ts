import { Test, TestingModule } from '@nestjs/testing';
import { CombinationsController } from './combinations.controller';
import { CombinationsService } from '../../services/combinations.service';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import {
  CreateCombinationDto,
  SaveCombinationDto,
  AddItemsToCombinationDto,
} from '../../dtos/combinations.dto';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

// Mock @toon-format/toon module
jest.mock('@toon-format/toon', () => ({
  encode: jest.fn((data) => JSON.stringify(data)),
}));

describe('CombinationsController', () => {
  let controller: CombinationsController;
  let service: CombinationsService;

  const mockCombinationsService = {
    generateCombinations: jest.fn(),
    saveCombination: jest.fn(),
    getCombinations: jest.fn(),
    updateStatusCombination: jest.fn(),
    getCombinationById: jest.fn(),
    addItemsToCombination: jest.fn(),
    updateStatusItemFromCombination: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CombinationsController],
      providers: [
        {
          provide: CombinationsService,
          useValue: mockCombinationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CombinationsController>(CombinationsController);
    service = module.get<CombinationsService>(CombinationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateCombinations', () => {
    const createDto: CreateCombinationDto = {
      clothingItemsBase: ['item-1', 'item-2'],
      categories: ['cat-1', 'cat-2'],
      occasions: ['Casual', 'Work'],
      description: 'A casual outfit',
      take: 5,
      page: 1,
    };

    it('should generate combinations successfully', async () => {
      const expectedResult = {
        message: 'Combinaciones generadas correctamente',
        data: {
          explanation: 'This is a great outfit',
          items: [
            {
              id: 'item-1',
              name: 'Blue Shirt',
              primaryColor: '#0000FF',
              secondaryColor: '#FFFFFF',
              images: ['http://example.com/image.jpg'],
            },
          ],
        },
      };

      mockCombinationsService.generateCombinations.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.generateCombinations(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.generateCombinations).toHaveBeenCalledWith(createDto);
      expect(service.generateCombinations).toHaveBeenCalledTimes(1);
    });

    it('should pass all parameters to service', async () => {
      mockCombinationsService.generateCombinations.mockResolvedValue({
        message: 'Success',
        data: {},
      });

      await controller.generateCombinations(createDto);

      expect(service.generateCombinations).toHaveBeenCalledWith(
        expect.objectContaining({
          clothingItemsBase: createDto.clothingItemsBase,
          categories: createDto.categories,
          occasions: createDto.occasions,
          description: createDto.description,
        }),
      );
    });
  });

  describe('saveCombination', () => {
    const saveDto: SaveCombinationDto = {
      name: 'My Outfit',
      description: 'A casual outfit',
      occasions: ['Casual'],
      isAIGenerated: true,
      combinationItems: [
        { wardrobeItemId: 'item-1', explanation: 'Perfect shirt' },
        { wardrobeItemId: 'item-2', explanation: 'Nice pants' },
      ],
    };

    const mockUser = {
      id: 'user-123',
      role: RoleEnum.USER,
    };

    it('should save combination successfully', async () => {
      const expectedResult = {
        message: 'Combinación guardada correctamente',
        data: { id: 'comb-1' },
      };

      mockCombinationsService.saveCombination.mockResolvedValue(expectedResult);

      const result = await controller.saveCombination(saveDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(service.saveCombination).toHaveBeenCalledWith(saveDto, 'user-123');
    });

    it('should pass user id to service', async () => {
      mockCombinationsService.saveCombination.mockResolvedValue({
        message: 'Success',
        data: {},
      });

      await controller.saveCombination(saveDto, mockUser);

      expect(service.saveCombination).toHaveBeenCalledWith(
        saveDto,
        mockUser.id,
      );
    });
  });

  describe('getCombinations', () => {
    const mockUser = {
      id: 'user-123',
      role: RoleEnum.USER,
    };

    const pagination: PaginationDto = {
      page: 1,
      limit: 20,
      offset: 0,
      status: true,
      search: '',
    };

    it('should get combinations successfully', async () => {
      const expectedResult = {
        message: 'Combinaciones encontradas correctamente',
        data: [
          {
            id: 'comb-1',
            description: 'Casual outfit',
            occasions: ['Casual'],
            isAIGenerated: true,
          },
        ],
      };

      mockCombinationsService.getCombinations.mockResolvedValue(expectedResult);

      const result = await controller.getCombinations(mockUser, pagination);

      expect(result).toEqual(expectedResult);
      expect(service.getCombinations).toHaveBeenCalledWith(
        'user-123',
        pagination,
      );
    });

    it('should pass pagination parameters to service', async () => {
      mockCombinationsService.getCombinations.mockResolvedValue({
        message: 'Success',
        data: [],
      });

      await controller.getCombinations(mockUser, pagination);

      expect(service.getCombinations).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          page: 1,
          limit: 20,
          offset: 0,
          status: true,
        }),
      );
    });

    it('should return empty array when no combinations found', async () => {
      mockCombinationsService.getCombinations.mockResolvedValue({
        message: 'No combinations found',
        data: [],
      });

      const result = await controller.getCombinations(mockUser, pagination);

      expect(result.data).toEqual([]);
    });
  });

  describe('updateCombinationStatus', () => {
    const combinationId = 'comb-1';

    it('should update combination status successfully', async () => {
      const expectedResult = {
        message: 'Combinación actualizada correctamente',
      };

      mockCombinationsService.updateStatusCombination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateCombinationStatus(combinationId);

      expect(result).toEqual(expectedResult);
      expect(service.updateStatusCombination).toHaveBeenCalledWith(
        combinationId,
      );
    });

    it('should pass combination id to service', async () => {
      mockCombinationsService.updateStatusCombination.mockResolvedValue({
        message: 'Success',
      });

      await controller.updateCombinationStatus(combinationId);

      expect(service.updateStatusCombination).toHaveBeenCalledWith(
        combinationId,
      );
      expect(service.updateStatusCombination).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCombinationById', () => {
    const combinationId = 'comb-1';

    it('should get combination by id successfully', async () => {
      const expectedResult = {
        message: 'Combinación encontrada correctamente',
        data: {
          id: 'comb-1',
          name: 'My Outfit',
          description: 'Casual',
          occasions: ['Casual'],
          isAIGenerated: true,
          items: [],
        },
      };

      mockCombinationsService.getCombinationById.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getCombinationById(combinationId);

      expect(result).toEqual(expectedResult);
      expect(service.getCombinationById).toHaveBeenCalledWith(combinationId);
    });

    it('should return combination with items', async () => {
      const expectedResult = {
        message: 'Combinación encontrada correctamente',
        data: {
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
              },
              aiDescription: 'Perfect shirt',
            },
          ],
        },
      };

      mockCombinationsService.getCombinationById.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getCombinationById(combinationId);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].wardrobeItem.name).toBe('Blue Shirt');
    });
  });

  describe('addItemsToCombination', () => {
    const addItemsDto: AddItemsToCombinationDto = {
      combinationId: 'comb-1',
      combinationItems: [
        { wardrobeItemId: 'item-1', explanation: 'Nice shirt' },
        { wardrobeItemId: 'item-2', explanation: 'Good pants' },
      ],
    };

    it('should add items to combination successfully', async () => {
      const expectedResult = {
        message: 'Prendas agregadas correctamente a la combinación',
      };

      mockCombinationsService.addItemsToCombination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.addItemsToCombination(addItemsDto);

      expect(result).toEqual(expectedResult);
      expect(service.addItemsToCombination).toHaveBeenCalledWith(addItemsDto);
    });

    it('should pass all items to service', async () => {
      mockCombinationsService.addItemsToCombination.mockResolvedValue({
        message: 'Success',
      });

      await controller.addItemsToCombination(addItemsDto);

      expect(service.addItemsToCombination).toHaveBeenCalledWith(
        expect.objectContaining({
          combinationId: 'comb-1',
          combinationItems: expect.arrayContaining([
            expect.objectContaining({ wardrobeItemId: 'item-1' }),
            expect.objectContaining({ wardrobeItemId: 'item-2' }),
          ]),
        }),
      );
    });

    it('should handle single item addition', async () => {
      const singleItemDto = {
        combinationId: 'comb-1',
        combinationItems: [
          { wardrobeItemId: 'item-1', explanation: 'Nice shirt' },
        ],
      };

      mockCombinationsService.addItemsToCombination.mockResolvedValue({
        message: 'Prendas agregadas correctamente a la combinación',
      });

      await controller.addItemsToCombination(singleItemDto);

      expect(service.addItemsToCombination).toHaveBeenCalledWith(singleItemDto);
    });
  });

  describe('deleteItemFromCombination', () => {
    const combinationId = 'comb-1';
    const wardrobeItemId = 'item-1';

    it('should update item status in combination successfully', async () => {
      const expectedResult = {
        message: 'Prenda eliminada correctamente de la combinación',
      };

      mockCombinationsService.updateStatusItemFromCombination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deleteItemFromCombination(
        combinationId,
        wardrobeItemId,
      );

      expect(result).toEqual(expectedResult);
      expect(service.updateStatusItemFromCombination).toHaveBeenCalledWith(
        combinationId,
        wardrobeItemId,
      );
    });

    it('should pass both ids to service', async () => {
      mockCombinationsService.updateStatusItemFromCombination.mockResolvedValue(
        { message: 'Success' },
      );

      await controller.deleteItemFromCombination(combinationId, wardrobeItemId);

      expect(service.updateStatusItemFromCombination).toHaveBeenCalledWith(
        combinationId,
        wardrobeItemId,
      );
      expect(service.updateStatusItemFromCombination).toHaveBeenCalledTimes(1);
    });
  });
});
