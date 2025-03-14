import { google } from '@ai-sdk/google';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { generateObject, generateText } from 'ai';
import { Schema } from 'zod';

@Injectable()
export class AiService {
  constructor(private logger: Logger) {}
  textModelAI = google('gemini-2.0-flash-exp');

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
