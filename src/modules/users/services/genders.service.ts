import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
import { GenderEnum } from '../enums/gender.enum';
import { CategoriesService } from '@/modules/categories/services/categories.service';

@Injectable()
export class GendersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    // @InjectQueue('categories_queue') private categoriesQueue: Queue,
    private categoriesService: CategoriesService,
  ) {
    this.createDefaultGenders();
  }

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

  private async createDefaultGenders() {
    const genders = [GenderEnum.MALE, GenderEnum.FEMALE, 'Prefiero no decirlo'];

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
    await this.categoriesService.createDefaultCategories();
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
