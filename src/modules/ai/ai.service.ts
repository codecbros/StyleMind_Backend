import { google } from '@ai-sdk/google';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { generateObject, generateText } from 'ai';
import { Schema } from 'zod';
import aiConfig from './config/ai.config';
import { ConfigType } from '@nestjs/config';
import { ProviderAIEnum } from './enums/object-storage.enum';
import { createOllama } from 'ollama-ai-provider';

@Injectable()
export class AiService {
  constructor(
    private logger: Logger,
    @Inject(aiConfig.KEY)
    private envAI: ConfigType<typeof aiConfig>,
  ) {}
  textModelAI;

  async onModuleInit() {
    switch (this.envAI.provider) {
      case ProviderAIEnum.GOOGLE:
        this.textModelAI = google('gemini-2.0-flash-exp');
        break;
      case ProviderAIEnum.OLLAMA:
        this.textModelAI = createOllama();
        break;
      default:
        throw new InternalServerErrorException(
          `El proveedor ${this.envAI.provider} no es soportado`,
        );
    }
  }

  async generateJSON(prompt: string, schema: Schema, temperature: number = 0) {
    const contents = (
      await generateObject({
        model: this.textModelAI,
        prompt,
        schema,
        maxRetries: 3,
        temperature,
      })
    ).object;

    return contents;
  }

  async generateText(prompt: string) {
    const textGenerated = (
      await generateText({
        model: this.textModelAI,
        prompt,
        maxRetries: 3,
      }).catch((error) => {
        this.logger.error(error.message, error.stack, AiService.name);
        throw new InternalServerErrorException('No se pudo generar el texto');
      })
    ).text;

    return textGenerated;
  }
}
