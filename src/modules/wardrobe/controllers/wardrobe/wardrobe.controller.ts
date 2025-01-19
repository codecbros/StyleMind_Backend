import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WardrobeService } from '../../services/wardrobe.service';
import {
  CreateClothesDto,
  UpdateClothesDto,
  WardrobeCategoryDto,
} from '../../dtos/wardrobe.dtos';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { GetPagination } from '@/shared/decorators/pagination.decorator';

@Controller('wardrobe')
@ApiTags('wardrobe')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.USER)
@ApiBearerAuth()
export class WardrobeController {
  constructor(private service: WardrobeService) {}

  @Post('add-clothes')
  @ApiOperation({ summary: 'Añadir una prenda al armario' })
  async create(
    @Body() data: CreateClothesDto,
    @CurrentSession() { id }: InfoUserInterface,
  ) {
    return this.service.create(data, id);
  }

  @Get('my-wardrobe')
  @ApiOperation({ summary: 'Obtener las prendas de mi armario' })
  @ApiQuery({ type: PaginationDto })
  @ApiQuery({ name: 'categoryId', required: false })
  async getMyWardrobe(
    @CurrentSession() { id }: InfoUserInterface,
    @GetPagination() pagination: PaginationDto,
    @Query('categoryId') categoryId: string,
  ) {
    return this.service.getClothes(id, pagination, categoryId);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar una prenda al armario' })
  async updateItem(@Body() data: UpdateClothesDto, @Param('id') id: string) {
    return this.service.update(data, id);
  }

  @Patch('update-status/:id')
  @ApiOperation({
    summary: 'Actualizar el estado de una prenda al armario',
    description:
      'El estado de la prenda (desactivado o activado) puede influir al ser seleccionada para las combinaciones',
  })
  async updateStatus(@Param('id') id: string) {
    return this.service.updateStatus(id);
  }

  @Patch('deactivate-category/:itemId/:categoryId')
  @ApiOperation({
    summary: 'Desactivar una categoría de la prenda',
  })
  async deactivateCategory(@Param() data: WardrobeCategoryDto) {
    return this.service.deactivateCategory(data.itemId, data.categoryId);
  }

  @Patch('add-category/:itemId/:categoryId')
  @ApiOperation({
    summary: 'Activar o asociar una categoría de la prenda',
  })
  async addCategory(@Param() data: WardrobeCategoryDto) {
    return this.service.addCategory(data.itemId, data.categoryId);
  }

  @Get('item/:id')
  @ApiOperation({
    summary: 'Obtener más detalles de una prenda',
  })
  async getById(@Param('id') id: string) {
    return this.service.getClothesById(id);
  }
}
