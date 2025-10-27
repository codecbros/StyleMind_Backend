import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GendersService } from '../services/genders.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGenreDto } from '../dtos/genre.dto';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';

@Controller('genders')
@ApiTags('Genders')
export class GendersController {
  constructor(private service: GendersService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los géneros',
    operationId: 'getAllGenders',
  })
  async findAll() {
    return await this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Agregar un género', operationId: 'createGender' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  @ApiBearerAuth()
  async create(@Body() { name }: CreateGenreDto) {
    return await this.service.create(name);
  }
}
