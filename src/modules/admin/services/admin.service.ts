import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import adminConfig from '../config/admin.config';
import { ConfigType } from '@nestjs/config';
import { PrismaService } from '@/shared/services/prisma.service';
import { SystemRole } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { GenderEnum } from '@/modules/users/enums/gender.enum';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @Inject(adminConfig.KEY)
    private environment: ConfigType<typeof adminConfig>,
    private db: PrismaService,
    private logger: Logger,
  ) {}

  async onModuleInit() {
    await this.createAdmin();
  }

  private async createAdmin() {
    const existAdmin = await this.db.user.findFirst({
      where: {
        systemRole: SystemRole.ADMIN,
      },
    });

    if (!existAdmin) {
      await this.db.user
        .create({
          data: {
            email: this.environment.ADMIN_EMAIL,
            password: hashSync(this.environment.ADMIN_PASSWORD, 12),
            systemRole: SystemRole.ADMIN,
            firstName: 'admin',
            lastName: 'admin',
            birthDate: new Date(),
            gender: {
              connect: {
                name: GenderEnum.MALE,
              },
            },
          },
        })
        .catch((err) => {
          this.logger.error(err.message, err.stack, AdminService.name);
        });
    }

    this.logger.log('Admin establecido con éxito', AdminService.name);
  }
}
