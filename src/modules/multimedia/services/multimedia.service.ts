import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { ConfigType } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseApp, initializeApp } from 'firebase/app';
import firebaseConfig from '../config/firebase.config';
import {
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { PrismaService } from '@/shared/services/prisma.service';
import * as Minio from 'minio';
import minioConfig from '../config/minio.config';

@Injectable()
export class MultimediaService {
  private firebase: FirebaseApp;
  private storage: FirebaseStorage;
  private minioClient: Minio.Client;

  constructor(
    @Inject(firebaseConfig.KEY)
    private envFirebase: ConfigType<typeof firebaseConfig>,
    @Inject(minioConfig.KEY)
    private envMinio: ConfigType<typeof minioConfig>,
    private logger: Logger,
    private prisma: PrismaService,
  ) {
    this.firebase = initializeApp(
      {
        apiKey: envFirebase.apiKey,
        authDomain: envFirebase.authDomain,
        projectId: envFirebase.projectId,
        storageBucket: envFirebase.storageBucket,
        messagingSenderId: envFirebase.messaginSenderId,
        appId: envFirebase.appId,
      },
      'stylemind',
    );

    this.storage = getStorage(this.firebase);

    this.minioClient = new Minio.Client({
      endPoint: envMinio.endPoint,
      port: envMinio.port,
      useSSL: envMinio.useSSL,
      accessKey: envMinio.accessKey,
      secretKey: envMinio.secretKey,
    });
  }
  async updloadFile(
    buffer: Buffer,
    filename: string,
    itemId: string,
  ): Promise<ResponseDataInterface<any>> {
    try {
      const uuid = uuidv4();
      const customName = `${uuid}_${filename.slice(0, filename.lastIndexOf('.'))}.webp`;

      const compressedBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();

      // const uploaded = await this.uploadImageToFirebase(
      //   compressedBuffer,
      //   customName,
      // );

      const uploaded = await this.uploadImageToMinio(
        compressedBuffer,
        customName,
      );

      await this.prisma.image
        .create({
          data: {
            url: uploaded.etag,
            wardrobeItemId: itemId,
            description: filename,
          },
        })
        .catch((e) => {
          this.logger.error(e.message, e.stack, MultimediaService.name);
        });

      return {
        data: null,
        message: 'Archivo cargado correctamente',
      };
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  private async uploadImageToFirebase(buffer: Buffer, filename: string) {
    const storageRef = ref(this.storage, filename);

    return await uploadBytes(storageRef, buffer);
  }

  private async uploadImageToMinio(buffer: Buffer, filename: string) {
    try {
      await this.verifyBucket();

      const uploaded = await this.minioClient.putObject(
        this.envMinio.bucket,
        filename,
        buffer,
      );

      return uploaded;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Error al cargar el archivo');
    }
  }

  async getImageFromMinio(
    filename: string,
  ): Promise<ResponseDataInterface<any>> {
    try {
      const stream = this.minioClient.getObject(this.envMinio.bucket, filename);

      return {
        data: stream,
        message: 'Archivo obtenido correctamente',
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Error al obtener el archivo');
    }
  }

  async getUrlImage(id: string) {
    const clothes = await this.prisma.image
      .findUnique({
        where: {
          id,
        },
        select: {
          url: true,
        },
      })
      .catch((e) => {
        this.logger.error(e.message, MultimediaService.name);
        throw new NotFoundException('Imagen no encontrada');
      });

    const url = await getDownloadURL(ref(this.storage, clothes.url)).catch(
      (e) => {
        this.logger.error(e.message, MultimediaService.name);
        throw new InternalServerErrorException('No se pudo obtener la imagen');
      },
    );

    return {
      data: {
        url,
      },
      messsage: 'Url de la imagen obtenida',
    };
  }

  private async verifyBucket() {
    const exist = await this.minioClient.bucketExists(this.envMinio.bucket);
    if (!exist) {
      await this.createBucket();
    }

    return exist;
  }

  private async createBucket() {
    this.logger.log(
      `Creando bucket ${this.envMinio.bucket} en Minio`,
      MultimediaService.name,
    );
    return await this.minioClient.makeBucket(this.envMinio.bucket);
  }
}
