import { z } from 'zod';
import { ProviderAIEnum } from '../../enums/provider.enum';

export const aiSchema = z.object({
  PROVIDER_AI: z.enum([
    ProviderAIEnum.GOOGLE,
    ProviderAIEnum.OLLAMA,
    ProviderAIEnum.OPENAI,
    ProviderAIEnum.LMSTUDIO,
  ]),
  TEXT_MODEL: z.string(),
  AI_URL: z.string().optional(),
});
