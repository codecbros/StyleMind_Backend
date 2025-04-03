import { registerAs } from '@nestjs/config';
import { aiSchema } from './validations/ai.validation';

const env = aiSchema.parse(process.env);

export default registerAs('ai', () => ({
  provider: env.PROVIDER_AI,
}));
