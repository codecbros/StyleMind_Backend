import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { CreateCategoryDto } from '../../dtos/categories.dto';

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
    description: 'Obtiene todas las categorías públicas',
  })
  @Role(RoleEnum.USER, RoleEnum.ADMIN)
  async getPublicCategories(@CurrentSession() user: InfoUserInterface) {
    return await this.categoriesService.getPublicCategories(user.id);
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
}
