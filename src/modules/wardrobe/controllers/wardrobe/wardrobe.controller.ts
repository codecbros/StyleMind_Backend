import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WardrobeService } from '../../services/wardrobe.service';
import { CreateClothesDto } from '../../dtos/wardrobe.dtos';
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
@ApiBearerAuth()
export class WardrobeController {
  constructor(private service: WardrobeService) {}

  @Post('add-clothes')
  @Role(RoleEnum.USER)
  @ApiOperation({ summary: 'Añadir una prenda al armario' })
  async create(
    @Body() data: CreateClothesDto,
    @CurrentSession() { id }: InfoUserInterface,
  ) {
    return this.service.create(data, id);
  }

  @Get('my-wardrobe')
  @Role(RoleEnum.USER)
  @ApiQuery({ type: PaginationDto })
  async getMyWardrobe(
    @CurrentSession() { id }: InfoUserInterface,
    @GetPagination() pagination: PaginationDto,
  ) {
    return this.service.getClothes(id, pagination);
  }
}
