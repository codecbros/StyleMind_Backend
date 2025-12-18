import { Test, TestingModule } from '@nestjs/testing';
import { WardrobeService } from './wardrobe.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { MultimediaService } from '@/modules/multimedia/services/multimedia.service';
import {
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateClothesDto, UpdateClothesDto } from '../dtos/wardrobe.dtos';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

describe('WardrobeService', () => {
  let service: WardrobeService;
  let prismaService: PrismaService;
  let multimediaService: MultimediaService;
  let imageQueue: Queue;
  let logger: Logger;

  const mockPrismaService = {
    wardrobeItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    wardrobeCategory: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    image: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockMultimediaService = {
    getUrlImage: jest.fn(),
  };

  const mockImageQueue = {
    add: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WardrobeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MultimediaService,
          useValue: mockMultimediaService,
        },
        {
          provide: getQueueToken('images'),
          useValue: mockImageQueue,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<WardrobeService>(WardrobeService);
    prismaService = module.get<PrismaService>(PrismaService);
    multimediaService = module.get<MultimediaService>(MultimediaService);
    imageQueue = module.get<Queue>(getQueueToken('images'));
    logger = module.get<Logger>(Logger);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto: CreateClothesDto = {
      name: 'Test Shirt',
      description: 'A test shirt',
      season: 'Summer',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      style: 'Casual',
      material: 'Cotton',
      size: 'M',
      categoriesId: ['cat-1', 'cat-2'],
    };

    it('should create a wardrobe item successfully', async () => {
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.wardrobeItem.create.mockResolvedValue({ id: 'item-1' });
      mockPrismaService.wardrobeCategory.createMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.create(createDto, userId);

      expect(result).toEqual({
        message: 'Prenda agregada correctamente',
        data: { id: 'item-1' },
      });
      expect(mockPrismaService.wardrobeItem.create).toHaveBeenCalled();
      expect(mockPrismaService.wardrobeCategory.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if item already exists in category', async () => {
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        category: { name: 'Shirts' },
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, userId)).rejects.toThrow(
        'Ya existe la prenda en la categoría Shirts',
      );
    });

    it('should create item without categories if categoriesId is empty', async () => {
      const dtoWithoutCategories = { ...createDto, categoriesId: [] };
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.wardrobeItem.create.mockResolvedValue({ id: 'item-1' });

      const result = await service.create(dtoWithoutCategories, userId);

      expect(result).toEqual({
        message: 'Prenda agregada correctamente',
        data: { id: 'item-1' },
      });
      expect(mockPrismaService.wardrobeItem.create).toHaveBeenCalled();
      expect(
        mockPrismaService.wardrobeCategory.createMany,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on database error', async () => {
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.wardrobeItem.create.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getClothes', () => {
    const userId = 'user-123';
    const pagination: PaginationDto = {
      page: 1,
      limit: 20,
      offset: 0,
      status: true,
      search: '',
    };

    it('should return paginated wardrobe items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Test Shirt',
          season: 'Summer',
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
          style: 'Casual',
          size: 'M',
          images: [{ id: 'img-1' }],
          categories: [{ category: { id: 'cat-1', name: 'Shirts' } }],
        },
      ];

      mockPrismaService.wardrobeItem.findMany.mockResolvedValue(mockItems);
      mockPrismaService.wardrobeItem.count.mockResolvedValue(1);
      mockMultimediaService.getUrlImage.mockResolvedValue(
        'http://example.com/image.jpg',
      );

      const result = await service.getClothes(userId, pagination);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'item-1',
            name: 'Test Shirt',
          }),
        ]),
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
        nextPage: null,
      });
    });

    it('should filter by categoryId when provided', async () => {
      const categoryId = 'cat-1';
      mockPrismaService.wardrobeItem.findMany.mockResolvedValue([]);
      mockPrismaService.wardrobeItem.count.mockResolvedValue(0);

      await service.getClothes(userId, pagination, categoryId);

      expect(mockPrismaService.wardrobeItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: {
              some: {
                categoryId: 'cat-1',
              },
            },
          }),
        }),
      );
    });

    it('should handle search parameter', async () => {
      const paginationWithSearch = { ...pagination, search: 'shirt' };
      mockPrismaService.wardrobeItem.findMany.mockResolvedValue([]);
      mockPrismaService.wardrobeItem.count.mockResolvedValue(0);

      await service.getClothes(userId, paginationWithSearch);

      expect(mockPrismaService.wardrobeItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'shirt',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should calculate hasMore and nextPage correctly', async () => {
      mockPrismaService.wardrobeItem.findMany.mockResolvedValue([
        { id: 'item-1', images: [], categories: [] },
      ]);
      mockPrismaService.wardrobeItem.count.mockResolvedValue(50);

      const result = await service.getClothes(userId, pagination);

      expect(result.hasMore).toBe(true);
      expect(result.nextPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getClothesById', () => {
    const itemId = 'item-1';

    it('should return a wardrobe item by id', async () => {
      const mockItem = {
        name: 'Test Shirt',
        description: 'A test shirt',
        season: 'Summer',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        style: 'Casual',
        material: 'Cotton',
        size: 'M',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [{ category: { id: 'cat-1', name: 'Shirts' } }],
        images: [{ id: 'img-1' }],
        combinations: [{ id: 'comb-1' }],
      };

      mockPrismaService.wardrobeItem.findUniqueOrThrow
        .mockResolvedValueOnce({ status: true })
        .mockResolvedValueOnce(mockItem);
      mockMultimediaService.getUrlImage.mockResolvedValue(
        'http://example.com/image.jpg',
      );

      const result = await service.getClothesById(itemId);

      expect(result.message).toBe('Prenda encontrada');
      expect(result.data).toBeDefined();
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.getClothesById(itemId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if item is deactivated', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: false,
      });

      await expect(service.getClothesById(itemId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getClothesById(itemId)).rejects.toThrow(
        'La prenda se encuentra desactivada',
      );
    });
  });

  describe('update', () => {
    const itemId = 'item-1';
    const updateDto: UpdateClothesDto = {
      name: 'Updated Shirt',
      description: 'Updated description',
      season: 'Winter',
      primaryColor: '#0000FF',
      style: 'Formal',
      material: 'Wool',
      size: 'L',
    };

    it('should update a wardrobe item successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
        userId: 'user-123',
      });
      mockPrismaService.wardrobeCategory.findMany.mockResolvedValue([
        { category: { id: 'cat-1' } },
      ]);
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.wardrobeItem.update.mockResolvedValue({});

      const result = await service.update(updateDto, itemId);

      expect(result.message).toBe('Prenda actualizada con éxito');
      expect(mockPrismaService.wardrobeItem.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.update(updateDto, itemId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if item is deactivated', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: false,
        userId: 'user-123',
      });

      await expect(service.update(updateDto, itemId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify name uniqueness in categories when name is updated', async () => {
      const dtoWithNewName = { name: 'New Name' };
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
        userId: 'user-123',
      });
      mockPrismaService.wardrobeCategory.findMany.mockResolvedValue([
        { category: { id: 'cat-1' } },
      ]);
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        category: { name: 'Shirts' },
      });

      await expect(service.update(dtoWithNewName, itemId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    const itemId = 'item-1';

    it('should toggle item status successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeItem.update.mockResolvedValue({});

      const result = await service.updateStatus(itemId);

      expect(result.message).toBe('Estado de la prenda actualizada con éxito');
      expect(mockPrismaService.wardrobeItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { status: false },
      });
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.updateStatus(itemId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addCategory', () => {
    const itemId = 'item-1';
    const categoryId = 'cat-1';

    it('should add category to item successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.wardrobeCategory.create.mockResolvedValue({});

      const result = await service.addCategory(itemId, categoryId);

      expect(result.message).toBe('Prenda asociada a la categoría con éxito');
      expect(mockPrismaService.wardrobeCategory.create).toHaveBeenCalled();
    });

    it('should reactivate category if it exists but is inactive', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        status: false,
      });
      mockPrismaService.wardrobeCategory.findFirstOrThrow.mockResolvedValue({
        id: 'wc-1',
      });
      mockPrismaService.wardrobeCategory.update.mockResolvedValue({});

      const result = await service.addCategory(itemId, categoryId);

      expect(result.message).toBe('Categoría actualizada con éxito');
    });

    it('should throw BadRequestException if category is already active', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        status: true,
      });

      await expect(service.addCategory(itemId, categoryId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deactivateCategory', () => {
    const itemId = 'item-1';
    const categoryId = 'cat-1';

    it('should deactivate category successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirstOrThrow.mockResolvedValue({
        id: 'wc-1',
      });
      mockPrismaService.wardrobeCategory.update.mockResolvedValue({});

      const result = await service.deactivateCategory(itemId, categoryId);

      expect(result.message).toBe('Categoría actualizada con éxito');
    });

    it('should throw BadRequestException if category is already inactive', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.wardrobeCategory.findFirst.mockResolvedValue({
        status: false,
      });

      await expect(
        service.deactivateCategory(itemId, categoryId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadFiles', () => {
    const itemId = 'item-1';
    const mockFiles = [
      { filename: 'test1.jpg', buffer: Buffer.from('test1') },
      { filename: 'test2.jpg', buffer: Buffer.from('test2') },
    ] as Storage.MultipartFile[];

    it('should upload files successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        images: [],
      });
      mockImageQueue.add.mockResolvedValue({});

      const result = await service.uploadFiles(mockFiles, itemId);

      expect(result.message).toBe('Archivo subido');
      expect(mockImageQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if max images reached', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        images: [{}, {}, {}, {}],
      });

      await expect(service.uploadFiles(mockFiles, itemId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFiles(mockFiles, itemId)).rejects.toThrow(
        'Sólo es permitido tener 4 imágenes por prenda',
      );
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.uploadFiles(mockFiles, itemId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateImage', () => {
    const itemId = 'item-1';
    const imageId = 'img-1';

    it('should deactivate image successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.image.findFirst.mockResolvedValue({ status: true });
      mockPrismaService.image.update.mockResolvedValue({});

      const result = await service.deactivateImage(itemId, imageId);

      expect(result.message).toBe('Imagen desactivada con éxito');
      expect(mockPrismaService.image.update).toHaveBeenCalledWith({
        where: { id: imageId },
        data: { status: false },
      });
    });

    it('should throw NotFoundException if image does not exist', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.image.findFirst.mockResolvedValue(null);

      await expect(service.deactivateImage(itemId, imageId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if image is already inactive', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.image.findFirst.mockResolvedValue({ status: false });

      await expect(service.deactivateImage(itemId, imageId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activateImage', () => {
    const itemId = 'item-1';
    const imageId = 'img-1';

    it('should activate image successfully', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.image.findFirst.mockResolvedValue({ status: false });
      mockPrismaService.image.update.mockResolvedValue({});

      const result = await service.activateImage(itemId, imageId);

      expect(result.message).toBe('Imagen activada con éxito');
      expect(mockPrismaService.image.update).toHaveBeenCalledWith({
        where: { id: imageId },
        data: { status: true },
      });
    });

    it('should throw BadRequestException if image is already active', async () => {
      mockPrismaService.wardrobeItem.findUniqueOrThrow.mockResolvedValue({
        status: true,
      });
      mockPrismaService.image.findFirst.mockResolvedValue({ status: true });

      await expect(service.activateImage(itemId, imageId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
