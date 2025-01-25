import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Get('url/:itemId')
  @ApiOperation({ summary: 'Obtener url de imagen' })
  async getUrl(@Param('itemId') id: string) {
    return this.service.getUrlImage(id);
  }
}
