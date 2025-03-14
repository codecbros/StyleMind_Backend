import { JwtAuthGuard } from '@modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@modules/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '../dtos/users.dto';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { GetPagination } from '@/shared/decorators/pagination.decorator';

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
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener mi perfil' })
  async myProfile(@CurrentSession() session: InfoUserInterface) {
    return await this.service.getMyProfile(session.id);
  }

  @Patch('update')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.USER)
  async update(
    @CurrentSession() session: InfoUserInterface,
    @Body() data: UpdateUserDto,
  ) {
    return await this.service.update(session.id, data);
  }

  @Patch('updateStatus/:id/:status')
  @ApiOperation({
    summary: 'Actualizar estado de usuario',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN, RoleEnum.USER)
  async updateStatus(
    @Param('id') id: string,
    @Param('status', ParseBoolPipe) status: boolean,
  ) {
    return await this.service.updateStatus(id, status);
  }

  @Patch('desactivateMyUser')
  @ApiOperation({ summary: 'Desactivar mi usuario' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.USER)
  async desactivateMyUser(@CurrentSession() session: InfoUserInterface) {
    return await this.service.desactivateMyUser(session.id);
  }

  @Patch('changePassword')
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async changePassword(
    @CurrentSession() session: InfoUserInterface,
    @Body() data: UpdateUserPasswordDto,
  ) {
    return await this.service.changePassword(session.id, data.password);
  }

  @Get('getAll')
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description: 'Solo para administradores',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  @ApiQuery({ type: PaginationDto })
  async getAll(@GetPagination() pagination: PaginationDto) {
    return await this.service.getAll(pagination);
  }
}
