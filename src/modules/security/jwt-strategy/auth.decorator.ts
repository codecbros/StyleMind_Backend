import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InfoUserInterface } from '@modules/security/jwt-strategy/info-user.interface';

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Partial<InfoUserInterface> => {
    try {
      const request = ctx.switchToHttp().getRequest();
      return request.session;
    } catch (error) {
      throw new ForbiddenException();
    }
  },
);
