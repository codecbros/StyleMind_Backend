import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Get,
  Param,
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
import { CombinationsService } from '../../services/combinations.service';
import {
  CreateCombinationDto,
  SaveCombinationDto,
} from '../../dtos/combinations.dto';
import { CurrentSession } from '@/modules/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import { GetPagination } from '@/shared/decorators/pagination.decorator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Controller('combinations')
@ApiTags('combinations')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.USER)
@ApiBearerAuth()
export class CombinationsController {
  constructor(private readonly combinationsService: CombinationsService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar combinaciones de prendas',
    description:
      'Genera combinaciones de prendas a partir de una lista de prendas base y categorías seleccionadas',
  })
  async generateCombinations(@Body() payload: CreateCombinationDto) {
    return this.combinationsService.generateCombinations(payload);
  }

  @Post('save')
  @ApiOperation({
    summary: 'Guardar combinación de prendas',
    description:
      'Guarda una combinación de prendas generada por el usuario en su armario',
  })
  async saveCombination(
    @Body() payload: SaveCombinationDto,
    @CurrentSession() user: InfoUserInterface,
  ) {
    return this.combinationsService.saveCombination(payload, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener combinaciones de prendas',
    description:
      'Obtiene las combinaciones de prendas generadas por el usuario en su armario',
  })
  @ApiQuery({ type: PaginationDto })
  async getCombinations(
    @CurrentSession() user: InfoUserInterface,
    @GetPagination() pagination: PaginationDto,
  ) {
    return this.combinationsService.getCombinations(user.id, pagination);
  }

  @Patch(':id/update-status')
  @ApiOperation({
    summary: 'Actualizar estado de combinación de prendas',
    description:
      'Actualiza el estado de una combinación de prendas generada por el usuario en su armario',
  })
  async updateCombinationStatus(@Param('id') id: string) {
    return this.combinationsService.updateStatusCombination(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener combinación de prendas por ID',
    description:
      'Obtiene una combinación de prendas generada por el usuario en su armario por su ID',
  })
  async getCombinationById(@Param('id') id: string) {
    return this.combinationsService.getCombinationById(id);
  }
}
