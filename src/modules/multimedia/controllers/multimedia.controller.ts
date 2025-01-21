import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MultimediaService } from '../services/multimedia.service';
import { MultipartInterceptor } from '../interceptors/multipart.interceptor';
import { Files } from '../decorator/file.decorator';
import { UploadFilesDto } from '../dto/upload-files.dto';
import { isArray } from 'class-validator';

@Controller('multimedia')
@ApiTags('Multimedia')
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Post('files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(MultipartInterceptor())
  @ApiBody({
    required: true,
    type: UploadFilesDto,
  })
  async multipleFiles(@Files() files: Record<string, Storage.MultipartFile[]>) {
    if (!isArray(files)) throw new BadRequestException('Debe ser un array');
    return this.service.uploadFiles(files);
  }
}
