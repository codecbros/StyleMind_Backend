import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@modules/security/auth/services/auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dtos/LoginDto';
import { isEmail, isString } from 'class-validator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
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
