import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';

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
            getMyProfile: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

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
        bodyDescription: 'Body description',
        profileDescription: 'Profile description',
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
        bodyDescription: 'Body description',
        profileDescription: 'Profile description',
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
        bodyDescription: 'Body description',
        profileDescription: 'Profile description',
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

  describe('myProfile', () => {
    it('should return user profile successfully', async () => {
      const session: InfoUserInterface = {
        id: '123',
        role: RoleEnum.USER,
      };
      const profile = {
        data: {
          id: '123',
          email: '',
        },
        message: 'Profile found',
      };

      jest.spyOn(service, 'getMyProfile').mockResolvedValue(profile);

      expect(await controller.myProfile(session)).toBe(profile);
    });

    it('should throw BadRequestException if profile retrieval fails', async () => {
      const session: InfoUserInterface = {
        id: '123',
        role: RoleEnum.USER,
      };

      jest
        .spyOn(service, 'getMyProfile')
        .mockRejectedValue(new BadRequestException('Profile not found'));

      await expect(controller.myProfile(session)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const session: InfoUserInterface = {
        id: '123',
        role: RoleEnum.USER,
      };
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        bodyDescription: 'Updated body description',
        profileDescription: 'Updated profile description',
        weight: 75,
        height: 180,
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'http://example.com/updated-profile.jpg',
      };

      const result = {
        message: 'Usuario actualizado correctamente',
        data: null,
      };

      jest.spyOn(service, 'update').mockResolvedValue(result);

      expect(await controller.update(session, updateUserDto)).toBe(result);
    });

    it('should throw BadRequestException if update fails', async () => {
      const session: InfoUserInterface = {
        id: '123',
        role: RoleEnum.USER,
      };
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        bodyDescription: 'Updated body description',
        profileDescription: 'Updated profile description',
        weight: 75,
        height: 180,
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'http://example.com/updated-profile.jpg',
      };

      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new BadRequestException('Update failed'));

      await expect(controller.update(session, updateUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update user status successfully', async () => {
      const userId = '123';
      const status = true;

      const result = {
        message: 'Estado de usuario actualizado correctamente',
        data: null,
      };

      jest.spyOn(service, 'updateStatus').mockResolvedValue(result);

      expect(await controller.updateStatus(userId, status)).toBe(result);
    });

    it('should throw BadRequestException if status update fails', async () => {
      const userId = '123';
      const status = true;

      jest
        .spyOn(service, 'updateStatus')
        .mockRejectedValue(new BadRequestException('Status update failed'));

      await expect(controller.updateStatus(userId, status)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
