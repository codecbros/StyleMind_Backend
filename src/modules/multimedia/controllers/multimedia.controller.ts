import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Get('firebase/url/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la imagen',
  })
  @ApiOperation({
    summary: 'Obtener url de imagen subida a firebase',
    deprecated: true,
  })
  async getUrl(@Param('id') id: string) {
    return this.service.getUrlImageFromFirebase(id);
  }

  @Get('minio/file/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la imagen',
  })
  @ApiOperation({
    summary: 'Obtener la imagen subida a minio',
    deprecated: true,
  })
  async getFile(@Param('id') id: string, @Res() reply: any) {
    const file: Buffer = await this.service.getImageFromMinio(id);

    reply.headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${id}.webp`,
      'x-processed-filename': `${id}.webp`,
    });
    reply.send(file);
  }

  @Get('minio/url/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la imagen',
  })
  @ApiOperation({
    summary: 'Obtener url de imagen subida a minio',
    deprecated: true,
  })
  async getUrlMinio(@Param('id') id: string) {
    return this.service.getUrlImageFromMinio(id);
  }
}
