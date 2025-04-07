import { registerAs } from '@nestjs/config';
import { ServerSchema } from './validations/server.validator';

const env = ServerSchema.parse(process.env);

export default registerAs('server', () => ({
  port: env.PORT,
  origin: env.CORS_ORIGIN,
}));
