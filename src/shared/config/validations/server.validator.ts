import { z } from 'zod';

export const ServerSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string(),
});
