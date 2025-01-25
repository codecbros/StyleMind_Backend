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
@Injectable()
export class MultimediaService {
  private firebase: FirebaseApp;
  private storage: FirebaseStorage;
  constructor(
    @Inject(firebaseConfig.KEY)
    private envFirebase: ConfigType<typeof firebaseConfig>,

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

      const uploaded = await this.uploadImageToFirebase(
        compressedBuffer,
        customName,
      );

      await this.prisma.image
        .create({
          data: {
            url: uploaded.metadata.fullPath,
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
}
