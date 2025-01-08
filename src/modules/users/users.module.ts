import { Logger, Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from '@/shared/services/prisma.service';
import { GendersController } from './controllers/genders.controller';
import { GendersService } from './services/genders.service';

@Module({
  providers: [UsersService, PrismaService, Logger, GendersService],
  controllers: [UsersController, GendersController],
})
export class UsersModule {}
