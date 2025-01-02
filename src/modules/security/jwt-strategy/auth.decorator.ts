import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InfoUserInterface } from '@modules/security/jwt-strategy/info-user.interface';
import { PrismaService } from '@/shared/services/prisma.service';
import { RoleEnum } from './role.enum';

export const CurrentSession = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext,
  ): Promise<Partial<InfoUserInterface>> => {
    try {
      const request = ctx.switchToHttp().getRequest();

      const db = new PrismaService();

      const currentUser = await db.session
        .findFirstOrThrow({
          where: {
            id: request.user.id,
          },
          select: {
            user: {
              select: {
                id: true,
                status: true,
                systemRole: true,
              },
            },
          },
        })
        .catch(() => {
          throw new NotFoundException('Usuario no encontrado');
        });

      if (!currentUser.user.status) {
        throw new UnauthorizedException('Usuario desactivado');
      }

      return {
        id: currentUser.user.id,
        role: currentUser.user.systemRole as RoleEnum,
      };
    } catch {
      throw new ForbiddenException();
    }
  },
);
