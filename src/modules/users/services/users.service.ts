import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { SystemRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { GendersService } from './genders.service';

@Injectable()
export class UsersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    private genderService: GendersService,
  ) {}

  async create(data: CreateUserDto): Promise<ResponseDataInterface<any>> {
    await this.genderService.getById(data.genderId);

    const existUser = await this.db.user.findFirst({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existUser) {
      if (existUser.status) {
        throw new BadRequestException('El usuario ya existe');
      } else {
        await this.updateStatus(existUser.id, true);

        return {
          message:
            'Ya tienes un usuario, se ha reactivado. Si no recuerdas la contraseña, puedes recuperarla',
          data: null,
        };
      }
    }

    data.password = hashSync(data.password, 12);

    await this.db.user
      .create({
        data,
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo crear el usuario');
      });

    return {
      message: 'Usuario creado correctamente',
      data: null,
    };
  }

  async update(
    userId: string,
    data: UpdateUserDto,
  ): Promise<ResponseDataInterface<any>> {
    if (data.genderId) await this.genderService.getById(data.genderId);

    await this.db.user
      .update({
        where: {
          id: userId,
        },
        data,
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo actualizar el usuario');
      });

    return {
      message: 'Usuario actualizado correctamente',
      data: null,
    };
  }

  async getById(id: string): Promise<ResponseDataInterface<any>> {
    const user = await this.db.user
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          profilePicture: true,
          bodyDescription: true,
          profileDescription: true,
          weight: true,
          height: true,
          gender: {
            select: {
              id: true,
              name: true,
            },
          },
          skinColor: true,
          hairColor: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Usuario no encontrado');
      });

    return {
      message: 'Usuario encontrado',
      data: user,
    };
  }

  async getMyProfile(userId: string): Promise<ResponseDataInterface<any>> {
    const user = await this.getById(userId);

    return user;
  }

  async updateStatus(
    id: string,
    status: boolean,
  ): Promise<ResponseDataInterface<any>> {
    await this.db.user
      .update({
        where: {
          id,
        },
        data: {
          status,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo actualizar el usuario');
      });

    return {
      message: 'El usuario ha sido actualizado',
      data: null,
    };
  }

  async desactivateMyUser(userId: string): Promise<ResponseDataInterface<any>> {
    return await this.updateStatus(userId, false);
  }

  async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<ResponseDataInterface<any>> {
    await this.db.user
      .update({
        where: {
          id: userId,
        },
        data: {
          password: hashSync(newPassword, 12),
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo cambiar la contraseña');
      });

    return {
      message: 'Contraseña cambiada correctamente',
      data: null,
    };
  }

  async getAll(pagination: PaginationDto): Promise<ResponseDataInterface<any>> {
    const users = await this.db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
      skip: pagination.page,
      take: pagination.limit,
      where: {
        OR: [
          { firstName: { contains: pagination.search, mode: 'insensitive' } },
          { lastName: { contains: pagination.search, mode: 'insensitive' } },
        ],
        status: pagination.status,
        systemRole: {
          not: SystemRole.ADMIN,
        },
      },
    });

    return {
      message: 'Usuarios encontrados',
      data: users,
    };
  }
}
