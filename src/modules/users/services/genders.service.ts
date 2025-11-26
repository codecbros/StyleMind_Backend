import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class GendersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {}

  async findAll(): Promise<ResponseDataInterface<any>> {
    const genders = await this.db.gender.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return {
      data: genders,
      message: 'Géneros encontrados',
    };
  }

  async create(name: string): Promise<ResponseDataInterface<any>> {
    const existGender = await this.db.gender.findFirst({
      where: {
        name,
      },
    });

    if (existGender) {
      throw new BadRequestException('El género ya existe');
    }

    await this.db.gender
      .create({
        data: {
          name,
        },
      })
      .catch((err) => {
        this.logger.error(err.message);
        throw new BadRequestException('No se pudo crear el género');
      });

    return {
      message: 'Género creado',
    };
  }

  async getById(id: string): Promise<ResponseDataInterface<{ name: string }>> {
    const gender = await this.db.gender
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          name: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('El género no existe');
      });

    return {
      data: { name: gender.name },
      message: 'Género encontrado con éxito',
    };
  }
}
