import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';
import { MultipartInterceptor } from '../interceptors/multipart.interceptor';
import { Files } from '../decorator/file.decorator';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Post('files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(MultipartInterceptor())
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async multipleFiles(@Files() files: Record<string, Storage.MultipartFile[]>) {
    return this.service.uploadFiles(files);
  }
}
