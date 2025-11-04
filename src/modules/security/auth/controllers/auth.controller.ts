import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@modules/security/auth/services/auth.service';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import { LoginDto } from '../dtos/LoginDto';
import { isEmail, isString } from 'class-validator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login', operationId: 'login' })
  @ApiHeader({
    name: 'email',
    description: 'Email del usuario',
    required: true,
    example: 'user@example.com',
  })
  @ApiHeader({
    name: 'password',
    description: 'Contraseña del usuario',
    required: true,
    example: 'password123',
  })
  async login(@Headers() { email, password }: LoginDto) {
    if (!isEmail(email) || !isString(password)) {
      throw new UnauthorizedException(
        'Debe ingresar un correo y una contraseña',
      );
    }

    const token = await this.authService.login({ email, password });
    return { data: token, message: 'Bienvenido' };
  }
}
