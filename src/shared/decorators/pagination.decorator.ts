import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PaginationDto } from '../dtos/pagination.dto';
import { isBooleanString, isNumberString } from 'class-validator';

export const GetPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const logger = new Logger();
    try {
      const request = ctx.switchToHttp().getRequest<Request>();
      const queries = request.query;

      // Valores predeterminados
      const defaultValues = {
        page: 1,
        limit: 10,
        search: '',
      };

      if (queries.page && !isNumberString(queries.page))
        throw new BadRequestException('La página debe ser número');

      if (queries.limit && !isNumberString(queries.limit))
        throw new BadRequestException('El límite debe ser número');

      if (queries.status && !isBooleanString(queries.status))
        throw new BadRequestException('El status debe ser booleano');

      // Transformar y asignar valores predeterminados
      const page = parseInt(queries.page as string) || defaultValues.page;
      const paginationParams: PaginationDto = {
        page: (page - 1) * 10,
        limit: parseInt(queries.limit as string) || defaultValues.limit,
        search: (queries.search as string) || defaultValues.search,
        status: queries.status !== undefined ? queries.status == 'true' : true,
      };

      return paginationParams;
    } catch (error) {
      logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  },
);
