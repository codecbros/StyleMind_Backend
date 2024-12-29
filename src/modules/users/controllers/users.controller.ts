import { JwtAuthGuard } from '@modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@modules/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/users.dto';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';

@Controller('users')
@ApiTags('users')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Registro de usuario' })
  async create(@Body() data: CreateUserDto) {
    return await this.service.create(data);
  }

  @Get('getById/:id')
  @ApiOperation({
    summary: 'Obtener usuario por id',
    description: 'Solo para administradores',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async findById(@Param('id') id: string) {
    return await this.service.getById(id);
  }

  @Get('myProfile')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Obtener mi perfil' })
  async myProfile(@CurrentSession() session: InfoUserInterface) {
    return await this.service.getMyProfile(session.id);
  }
}
