import { z } from 'zod';

export const RedisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default(false),
  REDIS_USERNAME: z.string().optional(),
});
