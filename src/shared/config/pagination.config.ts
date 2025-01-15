import { registerAs } from '@nestjs/config';

export default registerAs('pagination', () => ({
  page: parseInt(process.env.PAGINATION_PAGE_VALUE),
  limit: parseInt(process.env.PAGINATION_LIMIT_VALUE),
}));
