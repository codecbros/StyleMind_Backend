import { z } from 'zod';

export const PaginationSchema = z.object({
  PAGE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(1),
  LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(10),
});
