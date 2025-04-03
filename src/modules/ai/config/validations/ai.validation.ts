import { z } from 'zod';
import { ProviderAIEnum } from '../../enums/object-storage.enum';

export const aiSchema = z.object({
  PROVIDER_AI: z.enum([ProviderAIEnum.GOOGLE, ProviderAIEnum.OLLAMA]),
});
