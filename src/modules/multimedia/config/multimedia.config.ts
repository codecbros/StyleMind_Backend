import { registerAs } from '@nestjs/config';
import path from 'path';

export default registerAs('multimedia', () => ({
  path:
    process.env.MULTIMEDIA_PATH ||
    path.join(__dirname, '..', '..', '..', '..', '.temp'),
}));
