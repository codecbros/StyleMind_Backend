import { JwtAuthGuard } from '@/modules/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/modules/security/jwt-strategy/role.enum';
import { Role } from '@/modules/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/modules/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CombinationsService } from '../../services/combinations.service';
import { CreateCombinationDto } from '../../dtos/combinations.dto';

@Controller('combinations')
@ApiTags('combinations')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.USER)
@ApiBearerAuth()
export class CombinationsController {
  constructor(private readonly combinationsService: CombinationsService) {}

  @Post('generate')
  async generateCombinations(@Body() payload: CreateCombinationDto) {
    return this.combinationsService.generateCombinations(payload);
  }
}
