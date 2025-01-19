import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import adminConfig from '../config/admin.config';
import { ConfigType } from '@nestjs/config';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '@/shared/services/prisma.service';
import { hashSync } from 'bcrypt';
import { GenderEnum } from '@/modules/users/enums/gender.enum';

@Processor('admin_queue')
export class AdminConsumer {
  @Process('create')
  async process(): Promise<any> {
    this.createAdmin();
    this.logger.log('Admin establecido con éxito', AdminConsumer.name);
    return {};
  }

  constructor(
    @Inject(adminConfig.KEY)
    private environment: ConfigType<typeof adminConfig>,
    private db: PrismaService,
    private logger: Logger,
  ) {}

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
          this.logger.error(err.message, err.stack, AdminConsumer.name);
        });
    }
  }
}
