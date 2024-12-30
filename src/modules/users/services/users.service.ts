import { environment } from '@/shared/constants/environment';
import { PrismaService } from '@/shared/services/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { SystemRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { ResponseDataInterface } from '@/shared/interfaces/response-data.interface';

@Injectable()
export class UsersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {
    this.createAdmin();
  }

  async createAdmin() {
    const existAdmin = await this.db.user.findFirst({
      where: {
        systemRole: SystemRole.ADMIN,
      },
    });

    if (!existAdmin) {
      await this.db.user
        .create({
          data: {
            email: environment.ADMIN_EMAIL,
            password: hashSync(environment.ADMIN_PASSWORD, 12),
            systemRole: SystemRole.ADMIN,
            firstName: 'admin',
            lastName: 'admin',
            birthDate: new Date(),
          },
        })
        .catch((err) => {
          this.logger.error(err.message, err.stack, UsersService.name);
          throw new BadRequestException(
            'No se pudo crear el usuario administrador',
          );
        });
    }
  }

  async create(data: CreateUserDto): Promise<ResponseDataInterface> {
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

  private async getUserBySessionId(sessionId: string) {
    const user = await this.db.session
      .findFirstOrThrow({
        where: {
          id: sessionId,
        },
        select: {
          user: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Usuario no encontrado');
      });

    if (!user.user.status) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    return user.user.id;
  }

  async update(
    sessionId: string,
    data: UpdateUserDto,
  ): Promise<ResponseDataInterface> {
    const userId = await this.getUserBySessionId(sessionId);

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

  async getById(id: string): Promise<ResponseDataInterface> {
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

  async getMyProfile(sessionId: string): Promise<ResponseDataInterface> {
    const userId = await this.getUserBySessionId(sessionId);

    const user = await this.getById(userId);

    return user;
  }

  async updateStatus(
    id: string,
    status: boolean,
  ): Promise<ResponseDataInterface> {
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

  async desactivateMyUser(sessionId: string): Promise<ResponseDataInterface> {
    const userId = await this.getUserBySessionId(sessionId);

    return await this.updateStatus(userId, false);
  }

  async changePassword(
    sessionId: string,
    newPassword: string,
  ): Promise<ResponseDataInterface> {
    const userId = await this.getUserBySessionId(sessionId);

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

  async getAll(
    search: string = '',
    status?: boolean,
    page?: number,
    limit?: number,
  ): Promise<ResponseDataInterface> {
    console.log(page, limit);
    const users = await this.db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
      skip: page ? (page - 1) * limit : 0,
      take: limit ?? 10,
      where: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
        status,
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
