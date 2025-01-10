import { Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from '@modules/security/auth/services/auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dtos/LoginDto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Headers() { email, password }: LoginDto) {
    const token = await this.authService.login({ email, password });
    return { data: token, message: 'Bienvenido' };
  }
}
