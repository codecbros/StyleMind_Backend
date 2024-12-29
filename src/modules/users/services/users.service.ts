import { environment } from '@/shared/constants/environment';
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
    });

    if (existUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    await this.db.user
      .create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashSync(data.password, 12),
          bodyDescription: data.body_description,
          profileDescription: data.profile_description,
          weight: data.weight,
          height: data.height,
          birthDate: data.birthDate,
          profilePicture: data.profileImageUrl,
        },
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
    return (
      await this.db.session
        .findFirstOrThrow({
          where: {
            id: sessionId,
          },
          select: {
            userId: true,
          },
        })
        .catch(() => {
          throw new NotFoundException('Usuario no encontrado');
        })
    ).userId;
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
      message: 'Usuario actualizado correctamente',
      data: null,
    };
  }
}
