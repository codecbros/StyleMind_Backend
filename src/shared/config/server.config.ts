import { registerAs } from '@nestjs/config';

export default registerAs('server', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  origin: process.env.CORS_ORIGIN || '*',
}));
