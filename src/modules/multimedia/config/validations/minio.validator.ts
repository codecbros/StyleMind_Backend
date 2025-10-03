import { z } from 'zod';

export const MinioSchema = z.object({
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(9000),
  MINIO_USE_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default(false),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string().default('stylemind-images'),
});
