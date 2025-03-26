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
import multimediaConfig from '../config/multimedia.config';
import { ObjectStorageEnum } from '../enums/object-storage.enum';

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
    @Inject(multimediaConfig.KEY)
    private envMultimedia: ConfigType<typeof multimediaConfig>,
    private logger: Logger,
    private prisma: PrismaService,
  ) {
    this.onModuleInit();
  }

  async onModuleInit() {
    switch (this.envMultimedia.storage) {
      case ObjectStorageEnum.FIREBASE:
        this.logger.log('Usando Firebase Storage', MultimediaService.name);
        this.firebase = initializeApp(
          {
            apiKey: this.envFirebase.apiKey,
            authDomain: this.envFirebase.authDomain,
            projectId: this.envFirebase.projectId,
            storageBucket: this.envFirebase.storageBucket,
            messagingSenderId: this.envFirebase.messaginSenderId,
            appId: this.envFirebase.appId,
          },
          'stylemind',
        );

        this.storage = getStorage(this.firebase);
        break;
      case ObjectStorageEnum.MINIO:
        this.logger.log('Usando Minio Storage', MultimediaService.name);
        this.minioClient = new Minio.Client({
          endPoint: this.envMinio.endPoint,
          port: this.envMinio.port,
          useSSL: this.envMinio.useSSL,
          accessKey: this.envMinio.accessKey,
          secretKey: this.envMinio.secretKey,
        });
        break;
      default:
        throw new InternalServerErrorException(
          'No se ha definido el almacenamiento de archivos',
        );
    }
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

      let url = customName;
      switch (this.envMultimedia.storage) {
        case ObjectStorageEnum.FIREBASE:
          url = (await this.uploadImageToFirebase(compressedBuffer, customName))
            .metadata.fullPath;
          break;
        case ObjectStorageEnum.MINIO:
          await this.uploadImageToMinio(compressedBuffer, customName);
          break;
        default:
          throw new InternalServerErrorException(
            'No se ha definido el almacenamiento de archivos',
          );
      }

      await this.prisma.image
        .create({
          data: {
            url,
            wardrobeItemId: itemId,
            description: filename,
            storage: this.envMultimedia.storage,
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

  async getImageFromMinio(id: string): Promise<Buffer> {
    try {
      const clothes = await this.prisma.image
        .findUniqueOrThrow({
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

      const stream = await this.minioClient.getObject(
        this.envMinio.bucket,
        clothes.url,
      );

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
      });
      return buffer;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Error al obtener el archivo');
    }
  }

  async getUrlImageFromFirebase(id: string) {
    const clothes = await this.prisma.image
      .findUniqueOrThrow({
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
