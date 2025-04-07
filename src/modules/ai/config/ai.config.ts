import { registerAs } from '@nestjs/config';
import { aiSchema } from './validations/ai.validation';

const env = aiSchema.parse(process.env);

export default registerAs('ai', () => ({
  provider: env.AI_PROVIDER,
  textModel: env.TEXT_MODEL,
  url: env.AI_URL,
}));
