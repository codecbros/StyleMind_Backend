import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { environment } from './shared/constants/environment';
import helmet from '@fastify/helmet';
import { PinoLoggerService } from './shared/services/pino-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: 'error',
      },
    }),
    {
      bufferLogs: true,
    },
  );

  const config = new DocumentBuilder()
    .setTitle('StyleMind API')
    .setDescription('Documentación de la API de StyleMind')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  app.enableCors({
    origin: environment.CORS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.register(helmet);

  app.useLogger(new PinoLoggerService());

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
