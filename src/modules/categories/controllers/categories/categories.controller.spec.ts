import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from '../../services/categories.service';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
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
            getPublicCategories: jest.fn(),
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
      const user = { id: 'user1' } as InfoUserInterface;
      const page = 1;
      const search = 'test';
      const result: ResponseDataInterface = {
        data: ['category1', 'category2'],
        message: 'Success',
      };

      jest.spyOn(service, 'getPublicCategories').mockResolvedValue(result);

      const response = await controller.getPublicCategories(user, page, search);

      expect(response).toEqual(result);
      expect(service.getPublicCategories).toHaveBeenCalledWith(
        user.id,
        search,
        page,
      );
    });

    it('should return public categories without search and page', async () => {
      const user = { id: 'user1' } as InfoUserInterface;
      const result: ResponseDataInterface = {
        data: ['category1', 'category2'],
        message: 'Success',
      };

      jest.spyOn(service, 'getPublicCategories').mockResolvedValue(result);

      const response = await controller.getPublicCategories(
        user,
        undefined,
        undefined,
      );

      expect(response).toEqual(result);
      expect(service.getPublicCategories).toHaveBeenCalledWith(
        user.id,
        undefined,
        undefined,
      );
    });

    it('should handle errors', async () => {
      const user = { id: 'user1' } as InfoUserInterface;
      const page = 1;
      const search = 'test';
      const error = new Error('An error occurred');

      jest.spyOn(service, 'getPublicCategories').mockRejectedValue(error);

      await expect(
        controller.getPublicCategories(user, page, search),
      ).rejects.toThrow(error);
    });

    describe('createCategory', () => {
      it('should create a category', async () => {
        const user = { id: 'user1' } as InfoUserInterface;
        const data = { name: 'New Category' } as CreateCategoryDto;
        const result: ResponseDataInterface = {
          data: { id: 'category1', name: 'New Category' },
          message: 'Category created',
        };

        jest.spyOn(service, 'createCategory').mockResolvedValue(result);

        const response = await controller.createCategory(user, data);

        expect(response).toEqual(result);
        expect(service.createCategory).toHaveBeenCalledWith(data, user.id);
      });

      it('should handle errors', async () => {
        const user = { id: 'user1' } as InfoUserInterface;
        const data = { name: 'New Category' } as CreateCategoryDto;
        const error = new Error('An error occurred');

        jest.spyOn(service, 'createCategory').mockRejectedValue(error);

        await expect(controller.createCategory(user, data)).rejects.toThrow(
          error,
        );
      });
    });
  });
});
