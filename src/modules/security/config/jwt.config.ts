import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET_KEY || 'secret',
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '1d',
    },
  }),
);
