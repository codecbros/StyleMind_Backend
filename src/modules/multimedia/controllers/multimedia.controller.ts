import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';
import { MultipartInterceptor } from '../interceptors/multipart.interceptor';
import { Files } from '../decorator/file.decorator';
import { UploadFilesDto } from '../dto/upload-files.dto';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Post('clothes-images/:itemId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(MultipartInterceptor())
  @ApiBody({
    required: true,
    type: UploadFilesDto,
  })
  async multipleFiles(
    @Files() files: Storage.MultipartFile[],
    @Param('itemId') id: string,
  ) {
    return this.service.uploadFiles(files, id);
  }

  @Get('url/:itemId')
  async getUrl(@Param('itemId') id: string) {
    return this.service.getUrlImage(id);
  }
}
