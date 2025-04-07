import { z } from 'zod';
import { AIProviderEnum } from '../../enums/provider.enum';

export const aiSchema = z.object({
  AI_PROVIDER: z.enum([
    AIProviderEnum.GOOGLE,
    AIProviderEnum.OLLAMA,
    AIProviderEnum.OPENAI,
    AIProviderEnum.LMSTUDIO,
  ]),
  TEXT_MODEL: z.string(),
  AI_URL: z.string().optional(),
});
