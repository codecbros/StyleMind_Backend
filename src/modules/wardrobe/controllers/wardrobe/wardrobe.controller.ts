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
  WardrobeImageDto,
} from '../../dtos/wardrobe.dtos';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
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
import { MultipartInterceptor } from '@/modules/multimedia/interceptors/multipart.interceptor';
import { UploadFilesDto } from '@/modules/multimedia/dto/upload-files.dto';
import { Files } from '@/modules/multimedia/decorator/file.decorator';

@Controller('wardrobe')
@ApiTags('wardrobe')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.USER)
@ApiBearerAuth()
export class WardrobeController {
  constructor(private service: WardrobeService) {}

  @Post('add-clothes')
  @ApiOperation({
    summary: 'Añadir una prenda al armario',
    operationId: 'addClothes',
  })
  async create(
    @Body() data: CreateClothesDto,
    @CurrentSession() { id }: InfoUserInterface,
  ) {
    return this.service.create(data, id);
  }

  @Get('my-wardrobe')
  @ApiOperation({
    summary: 'Obtener las prendas de mi armario',
    operationId: 'getMyWardrobe',
  })
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
  @ApiOperation({
    summary: 'Actualizar una prenda al armario',
    operationId: 'updateClothes',
  })
  async updateItem(@Body() data: UpdateClothesDto, @Param('id') id: string) {
    return this.service.update(data, id);
  }

  @Patch('update-status/:id')
  @ApiOperation({
    summary: 'Actualizar el estado de una prenda al armario',
    description:
      'El estado de la prenda (desactivado o activado) puede influir al ser seleccionada para las combinaciones',
    operationId: 'updateClothesStatus',
  })
  async updateStatus(@Param('id') id: string) {
    return this.service.updateStatus(id);
  }

  @Patch('deactivate-category/:itemId/:categoryId')
  @ApiOperation({
    summary: 'Desactivar una categoría de la prenda',
    operationId: 'deactivateCategory',
  })
  async deactivateCategory(@Param() data: WardrobeCategoryDto) {
    return this.service.deactivateCategory(data.itemId, data.categoryId);
  }

  @Patch('add-category/:itemId/:categoryId')
  @ApiOperation({
    summary: 'Activar o asociar una categoría de la prenda',
    operationId: 'addCategory',
  })
  async addCategory(@Param() data: WardrobeCategoryDto) {
    return this.service.addCategory(data.itemId, data.categoryId);
  }

  @Patch('deactivate-image/:itemId/:imageId')
  @ApiOperation({
    summary: 'Desactivar una imagen de la prenda',
    operationId: 'deactivateImage',
  })
  async deactivateImage(@Param() data: WardrobeImageDto) {
    return this.service.deactivateImage(data.itemId, data.imageId);
  }

  @Patch('activate-image/:itemId/:imageId')
  @ApiOperation({
    summary: 'Activar una imagen de la prenda',
    operationId: 'activateImage',
  })
  async activateImage(@Param() data: WardrobeImageDto) {
    return this.service.activateImage(data.itemId, data.imageId);
  }

  @Get('item/:id')
  @ApiOperation({
    summary: 'Obtener más detalles de una prenda',
    operationId: 'getClothesById',
  })
  async getById(@Param('id') id: string) {
    return this.service.getClothesById(id);
  }

  @Post('item-images/:itemId')
  @ApiOperation({
    summary: 'Subir imagenes de la prenda',
    operationId: 'uploadClothesImages',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    MultipartInterceptor({
      fileType: new RegExp('^[^\s]+\.(jpg|jpeg|png|bmp)$'),
    }),
  )
  @ApiBody({
    required: true,
    type: UploadFilesDto,
  })
  @ApiParam({ name: 'itemId', description: 'Id de la prenda' })
  async multipleFiles(
    @Files() files: Storage.MultipartFile[],
    @Param('itemId') id: string,
  ) {
    return this.service.uploadFiles(files, id);
  }
}
