import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@admin.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
}));
