import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { isArray } from 'class-validator';
import * as fastify from 'fastify';

export const Files = createParamDecorator(
  async (
    _data: unknown,
    ctx: ExecutionContext,
  ): Promise<null | Storage.MultipartFile[]> => {
    const req = ctx.switchToHttp().getRequest() as fastify.FastifyRequest;
    const files = req.storedFiles;
    if (!isArray(files) || files.length <= 0)
      throw new BadRequestException('Debe ser un array');
    return files;
  },
);
