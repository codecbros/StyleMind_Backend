import { google } from '@ai-sdk/google';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { generateObject, generateText, LanguageModelV1 } from 'ai';
import { Schema } from 'zod';
import aiConfig from './config/ai.config';
import { ConfigType } from '@nestjs/config';
import { ProviderAIEnum } from './enums/provider.enum';
import { createOllama } from 'ollama-ai-provider';

@Injectable()
export class AiService implements OnModuleInit {
  constructor(
    private logger: Logger,
    @Inject(aiConfig.KEY)
    private envAI: ConfigType<typeof aiConfig>,
  ) {}
  textModelAI: LanguageModelV1;

  async onModuleInit() {
    switch (this.envAI.provider) {
      case ProviderAIEnum.GOOGLE:
        this.logger.log('Usando Google Gemini', AiService.name);
        this.textModelAI = google(this.envAI.textModel);
        break;
      case ProviderAIEnum.OLLAMA:
        this.logger.log('Usando Ollama', AiService.name);
        this.textModelAI = createOllama({
          baseURL: this.envAI.url,
        }).languageModel(this.envAI.textModel);
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
