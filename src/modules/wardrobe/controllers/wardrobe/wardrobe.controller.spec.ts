import { Test, TestingModule } from '@nestjs/testing';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from '../../services/wardrobe.service';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';

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
    it('should return my wardrobe', async () => {
      const result: ResponseDataInterface<any> = {
        data: ['category1', 'category2'],
        message: 'Success',
      };
      const paginator = {
        search: null,
        page: null,
        limit: null,
        status: null,
      };

      jest.spyOn(service, 'getClothes').mockResolvedValue(result);

      const response = await controller.getMyWardrobe(
        { id: 'asnkjndksaj', role: RoleEnum.USER },
        paginator,
        'kajsndask',
      );

      expect(response).toEqual(result);
    });

    it('should return wardrobe items with secondaryColor, style, and size fields', async () => {
      const result: ResponseDataInterface<any> = {
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
        message: 'Armario obtenido',
      };
      const paginator = {
        search: null,
        page: null,
        limit: null,
        status: null,
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
  });
});
