import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Get('firebase/url/:itemId')
  @ApiOperation({ summary: 'Obtener url de imagen subida a firebase' })
  async getUrl(@Param('itemId') id: string) {
    return this.service.getUrlImageFromFirebase(id);
  }

  @Get('minio/file/:itemId')
  @ApiOperation({ summary: 'Obtener url de imagen subida a minio' })
  async getFile(@Param('itemId') id: string, @Res() reply) {
    const file: Buffer = await this.service.getImageFromMinio(id);

    reply.headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${id}.webp`,
      'x-processed-filename': `${id}.webp`,
    });
    reply.send(file);
  }
}
