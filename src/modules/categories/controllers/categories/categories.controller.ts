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
import { CategoriesService } from '../../services/categories.service';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../dtos/categories.dto';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Controller('categories')
@ApiTags('categories')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('all')
  @ApiOperation({
    summary: 'Obtener todas las categorías para el admin',
    description:
      'Obtiene todas las categorías sólo para el admin. Se obtienen 10 por página',
  })
  @Role(RoleEnum.ADMIN)
  async getCategories(@Query() { search, page }: PaginationDto) {
    return await this.categoriesService.getCategories(search, page);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Obtener todas las categorías de un usuario',
  })
  @Role(RoleEnum.USER)
  async getMyCategories(
    @CurrentSession() user: InfoUserInterface,
    @Query() { search }: PaginationDto,
  ) {
    return await this.categoriesService.getMyCategories(user.id, search);
  }

  @Get('my/:id')
  @ApiOperation({
    summary: 'Obtener una categoría por id',
  })
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async getCategoryById(@Param('id') id: string) {
    return await this.categoriesService.getCategoryById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una categoría',
  })
  @Role(RoleEnum.ADMIN)
  async createCategory(@Body() data: CreateCategoryDto) {
    return await this.categoriesService.createCategory(data);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar una categoría',
  })
  @Role(RoleEnum.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(data, id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar el estado de una categoría',
  })
  @Role(RoleEnum.ADMIN)
  async updateCategoryStatus(@Param('id') id: string) {
    return await this.categoriesService.updateStatus(id);
  }
}
