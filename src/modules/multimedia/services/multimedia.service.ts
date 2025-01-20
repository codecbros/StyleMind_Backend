/* eslint-disable security/detect-non-literal-fs-filename */
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import fs from 'fs';
import multimediaConfig from '../config/multimedia.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class MultimediaService {
  constructor(
    @Inject(multimediaConfig.KEY)
    private environment: ConfigType<typeof multimediaConfig>,
  ) {}
  async updloadFile(
    file: Storage.MultipartFile,
  ): Promise<ResponseDataInterface<any>> {
    const imagePath = `${this.environment.path}/${file.filename}`;
    // fs.writeFileSync(imagePath, file.buffer);
    const compressedBuffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(imagePath, compressedBuffer);

    return {
      data: null,
      message: 'Archivo cargado correctamente',
    };
  }

  async uploadFiles(files: Record<string, Storage.MultipartFile[]>) {
    await this.updloadFile(files[Object.keys(files)[0]][0]);
  }
}
