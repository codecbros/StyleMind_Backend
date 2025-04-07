import { registerAs } from '@nestjs/config';
import { RedisSchema } from './validations/redis.validator';

const env = RedisSchema.parse(process.env);

export default registerAs('redis', () => ({
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  ssl: env.REDIS_SSL,
}));
