export const environment = {
  CORS: process.env.CORS_ORIGIN || '*',
  JWT_SECRET_KEY: process.env.JWT_SECRET || 'secret',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@admin.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
};
