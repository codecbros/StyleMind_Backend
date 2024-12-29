import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/users.dto';
import { BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
        body_description: 'Body description',
        profile_description: 'Profile description',
        weight: 70,
        height: 180,
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'http://example.com/profile.jpg',
      };

      const result = {
        message: 'Usuario creado correctamente',
        data: null,
      };

      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create(createUserDto)).toBe(result);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
        body_description: 'Body description',
        profile_description: 'Profile description',
        weight: 70,
        height: 180,
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'http://example.com/profile.jpg',
      };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new BadRequestException('El usuario ya existe'));

      await expect(controller.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if invalid data is provided', async () => {
      const createUserDto: CreateUserDto = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        password: 'weakpassword',
        body_description: 'Body description',
        profile_description: 'Profile description',
        weight: 70,
        height: 180,
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'http://example.com/profile.jpg',
      };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new BadRequestException('No se pudo crear el usuario'),
        );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
