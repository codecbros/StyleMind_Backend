import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class GendersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    @InjectQueue('categories_queue') private categoriesQueue: Queue,
  ) {
    this.createDefaultGenders();
  }

  async findAll(): Promise<ResponseDataInterface> {
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

  async create(name: string): Promise<ResponseDataInterface> {
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

  private async createDefaultGenders() {
    const genders = ['Hombre', 'Mujer', 'Otro'];

    for (const gender of genders) {
      const existGender = await this.db.gender.findFirst({
        where: {
          name: gender,
        },
      });

      if (existGender) {
        continue;
      }

      await this.create(gender);
    }

    this.logger.log('Géneros generados con éxito', GendersService.name);
    await this.categoriesQueue.add('create', {
      message: 'Géneros generados con éxito',
    });
  }
}
