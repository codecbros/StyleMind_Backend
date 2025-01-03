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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../dtos/categories.dto';
import { OptionalNumberPipe } from '@/shared/pipes/optional-number.pipe';

@Controller('categories')
@ApiTags('categories')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('my')
  @ApiOperation({
    summary: 'Obtener todas mis categorías',
    description: 'Obtiene todas las categorías del usuario autenticado',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
    description:
      'Indica si se desea obtener las categorías activas o inactivas',
  })
  @Role(RoleEnum.USER)
  async getCategories(
    @CurrentSession() user: InfoUserInterface,
    @Query('status', OptionalBooleanPipe) status: boolean,
  ) {
    return await this.categoriesService.getMyCategories(user.id, status);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Obtener todas las categorías públicas',
    description:
      'Obtiene todas las categorías públicas. Se obtienen 10 por página',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Texto de búsqueda',
  })
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async getPublicCategories(
    @CurrentSession() user: InfoUserInterface,
    @Query('page', OptionalNumberPipe) page: number,
    @Query('search') search: string,
  ) {
    return await this.categoriesService.getPublicCategories(
      user.id,
      search,
      page,
    );
  }

  @Get('my/:id')
  @ApiOperation({
    summary: 'Obtener una categoría por id',
  })
  @Role(RoleEnum.USER)
  async getCategoryById(
    @CurrentSession() user: InfoUserInterface,
    @Param('id') id: string,
  ) {
    return await this.categoriesService.getCategoryById(user.id, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una categoría',
  })
  @Role(RoleEnum.USER)
  async createCategory(
    @CurrentSession() user: InfoUserInterface,
    @Body() data: CreateCategoryDto,
  ) {
    return await this.categoriesService.createCategory(data, user.id);
  }

  @Get('public/:userId')
  @ApiOperation({
    summary: 'Obtener todas las categorías públicas de un usuario',
  })
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async getPublicCategoriesByUserId(@Param('userId') userId: string) {
    return await this.categoriesService.getPublicCategories(userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar una categoría',
  })
  @Role(RoleEnum.USER)
  async updateCategory(
    @CurrentSession() user: InfoUserInterface,
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(data, id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar el estado de una categoría',
  })
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async updateCategoryStatus(
    @CurrentSession() user: InfoUserInterface,
    @Param('id') id: string,
  ) {
    return await this.categoriesService.updateStatus(id, user.role);
  }
}
