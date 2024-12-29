import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/LoginDto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should return a token on successful login', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password',
    };
    const token = null;
    jest.spyOn(authService, 'login').mockResolvedValue(token);

    const result = await controller.login(loginDto);

    expect(result).toEqual({ data: token, message: 'Bienvenido' });
    expect(authService.login).toHaveBeenCalledWith(loginDto);
  });

  it('should throw an error on failed login', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'wrongPassword',
    };
    jest
      .spyOn(authService, 'login')
      .mockRejectedValue(
        new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
      );

    try {
      await controller.login(loginDto);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.message).toBe('Unauthorized');
      expect(e.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });
});
