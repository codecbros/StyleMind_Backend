/* eslint-disable security/detect-non-literal-fs-filename */
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import fs from 'fs';
import multimediaConfig from '../config/multimedia.config';
import { ConfigType } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MultimediaService {
  constructor(
    @Inject(multimediaConfig.KEY)
    private environment: ConfigType<typeof multimediaConfig>,
    @InjectQueue('images')
    private imageQueue: Queue,
    private logger: Logger,
  ) {}
  async updloadFile(
    buffer: Buffer,
    filename: string,
  ): Promise<ResponseDataInterface<any>> {
    try {
      const uuid = uuidv4();
      const imagePath = `${this.environment.path}/${uuid}_${filename.slice(0, filename.lastIndexOf('.'))}.webp`;

      const compressedBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();

      fs.writeFileSync(imagePath, compressedBuffer);

      return {
        data: null,
        message: 'Archivo cargado correctamente',
      };
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async uploadFiles(files: Record<string, Storage.MultipartFile[]>) {
    for (const file of files[Object.keys(files)[0]]) {
      await this.imageQueue.add('compress', {
        filename: file.filename,
        buffer: file.buffer,
      });
    }

    return { message: 'Archivo subido' };
  }
}
