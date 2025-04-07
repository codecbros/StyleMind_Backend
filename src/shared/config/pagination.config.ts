import { registerAs } from '@nestjs/config';
import { PaginationSchema } from './validations/pagination.validator';

const env = PaginationSchema.parse(process.env);

export default registerAs('pagination', () => ({
  page: env.PAGE,
  limit: env.LIMIT,
}));
