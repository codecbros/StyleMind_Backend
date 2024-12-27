import { Logger, Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from '@/shared/services/prisma.service';

@Module({
  providers: [UsersService, PrismaService, Logger],
  controllers: [UsersController],
})
export class UsersModule {}
