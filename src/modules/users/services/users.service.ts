import { environment } from '@/shared/constants/environment';
import { PrismaService } from '@/shared/services/prisma.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { SystemRole } from '@prisma/client';

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
}
