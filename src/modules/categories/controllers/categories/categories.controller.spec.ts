import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from '../../services/categories.service';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { CreateCategoryDto } from '../../dtos/categories.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            getMyCategories: jest.fn(),
            getCategories: jest.fn(),
            createCategory: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getPublicCategories', () => {
    it('should return public categories', async () => {
      const result: ResponseDataInterface<any> = {
        data: ['category1', 'category2'],
        message: 'Success',
      };

      jest.spyOn(service, 'getCategories').mockResolvedValue(result);

      const response = await controller.getCategories({
        search: null,
        page: null,
        limit: null,
        status: null,
        offset: null,
      });

      expect(response).toEqual(result);
      // expect(service.getCategories).toHaveBeenCalledWith(result);
    });

    it('should return public categories without search and page', async () => {
      const result: ResponseDataInterface<any> = {
        data: ['category1', 'category2'],
        message: 'Success',
      };

      jest.spyOn(service, 'getCategories').mockResolvedValue(result);

      const response = await controller.getCategories({
        search: null,
        page: null,
        limit: null,
        status: null,
        offset: null,
      });

      expect(response).toEqual(result);
      // expect(service.getCategories).toHaveBeenCalledWith();
    });

    it('should handle errors', async () => {
      const search = 'test';
      const error = new Error('An error occurred');

      jest.spyOn(service, 'getCategories').mockRejectedValue(error);

      await expect(
        controller.getCategories({
          search,
          page: 1,
          limit: 10,
          status: undefined,
          offset: 0,
        }),
      ).rejects.toThrow(error);
    });

    describe('createCategory', () => {
      it('should create a category', async () => {
        const data = {
          name: 'New Category',
          gendersIds: ['asdmaskldkjs'],
        } as CreateCategoryDto;
        const result: ResponseDataInterface<any> = {
          data: { id: 'category1', name: 'New Category' },
          message: 'Category created',
        };

        jest.spyOn(service, 'createCategory').mockResolvedValue(result);

        const response = await controller.createCategory(data);

        expect(response).toEqual(result);
        expect(service.createCategory).toHaveBeenCalledWith(data);
      });

      it('should handle errors', async () => {
        const data = {
          name: 'New Category',
          gendersIds: ['asdmaskldkjs'],
        } as CreateCategoryDto;
        const error = new Error('An error occurred');

        jest.spyOn(service, 'createCategory').mockRejectedValue(error);

        await expect(controller.createCategory(data)).rejects.toThrow(error);
      });
    });
  });
});
