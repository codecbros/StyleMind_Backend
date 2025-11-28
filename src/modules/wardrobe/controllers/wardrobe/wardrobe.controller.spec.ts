import { Test, TestingModule } from '@nestjs/testing';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from '../../services/wardrobe.service';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { PaginatedResponseDto } from '@/shared/dtos/paginated-response.dto';

describe('WardrobeController', () => {
  let controller: WardrobeController;
  let service: WardrobeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WardrobeController],
      providers: [
        {
          provide: WardrobeService,
          useValue: {
            getClothes: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WardrobeController>(WardrobeController);
    service = module.get<WardrobeService>(WardrobeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyWardrobe', () => {
    it('should return my wardrobe with pagination metadata', async () => {
      const result: PaginatedResponseDto<any> = {
        data: ['category1', 'category2'],
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
        nextPage: null,
      };
      const paginator = {
        search: '',
        page: 1,
        limit: 20,
        status: true,
        offset: 0,
      };

      jest.spyOn(service, 'getClothes').mockResolvedValue(result);

      const response = await controller.getMyWardrobe(
        { id: 'asnkjndksaj', role: RoleEnum.USER },
        paginator,
        'kajsndask',
      );

      expect(response).toEqual(result);
      expect(response).toHaveProperty('page');
      expect(response).toHaveProperty('limit');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('totalPages');
      expect(response).toHaveProperty('hasMore');
      expect(response).toHaveProperty('nextPage');
    });

    it('should return wardrobe items with secondaryColor, style, and size fields', async () => {
      const result: PaginatedResponseDto<any> = {
        data: [
          {
            id: 'item1',
            name: 'Test Item',
            season: 'Summer',
            primaryColor: '#FF0000',
            secondaryColor: '#00FF00',
            style: 'Casual',
            size: 'M',
            images: [],
            categories: [],
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
        nextPage: null,
      };
      const paginator = {
        search: '',
        page: 1,
        limit: 20,
        status: true,
        offset: 0,
      };

      jest.spyOn(service, 'getClothes').mockResolvedValue(result);

      const response = await controller.getMyWardrobe(
        { id: 'userId123', role: RoleEnum.USER },
        paginator,
        undefined,
      );

      expect(response).toEqual(result);
      expect(response.data[0]).toHaveProperty('secondaryColor');
      expect(response.data[0]).toHaveProperty('style');
      expect(response.data[0]).toHaveProperty('size');
    });

    it('should have hasMore true and nextPage when there are more pages', async () => {
      const result: PaginatedResponseDto<any> = {
        data: [{ id: 'item1' }],
        page: 1,
        limit: 20,
        total: 120,
        totalPages: 6,
        hasMore: true,
        nextPage: 2,
      };
      const paginator = {
        search: '',
        page: 1,
        limit: 20,
        status: true,
        offset: 0,
      };

      jest.spyOn(service, 'getClothes').mockResolvedValue(result);

      const response = await controller.getMyWardrobe(
        { id: 'userId123', role: RoleEnum.USER },
        paginator,
        undefined,
      );

      expect(response.hasMore).toBe(true);
      expect(response.nextPage).toBe(2);
      expect(response.totalPages).toBe(6);
      expect(response.total).toBe(120);
    });

    it('should have hasMore false on the last page', async () => {
      const result: PaginatedResponseDto<any> = {
        data: [{ id: 'item120' }],
        page: 6,
        limit: 20,
        total: 120,
        totalPages: 6,
        hasMore: false,
        nextPage: null,
      };
      const paginator = {
        search: '',
        page: 6,
        limit: 20,
        status: true,
        offset: 100,
      };

      jest.spyOn(service, 'getClothes').mockResolvedValue(result);

      const response = await controller.getMyWardrobe(
        { id: 'userId123', role: RoleEnum.USER },
        paginator,
        undefined,
      );

      expect(response.hasMore).toBe(false);
      expect(response.nextPage).toBeNull();
    });
  });
});
