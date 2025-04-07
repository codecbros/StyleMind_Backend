import { registerAs } from '@nestjs/config';
import { multimediaSchema } from './validations/multimedia.validation';

const env = multimediaSchema.parse(process.env);

export default registerAs('multimedia', () => ({
  storage: env.STORAGE_PROVIDER,
}));
