// Create PinoLoggerService class

import { LoggerService } from '@nestjs/common';
import path from 'path';
import pino from 'pino';
import fs from 'fs';

export class PinoLoggerService implements LoggerService {
  private readonly loggers: Record<string, pino.Logger>;

  constructor() {
    // verificar si la carpeta logs existe

    const logsDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    this.loggers = {
      info: pino({
        level: 'info',
        transport: {
          target: 'pino/file',
          options: { destination: path.join(logsDir, 'info.log') },
        },
      }),
      error: pino({
        level: 'error',
        transport: {
          target: 'pino/file',
          options: { destination: path.join(logsDir, 'error.log') },
        },
      }),
      warn: pino({
        level: 'warn',
        transport: {
          target: 'pino/file',
          options: { destination: path.join(logsDir, 'warn.log') },
        },
      }),
      debug: pino({
        level: 'debug',
        transport: {
          target: 'pino/file',
          options: { destination: path.join(logsDir, 'debug.log') },
        },
      }),
      verbose: pino({
        level: 'trace',
        transport: {
          target: 'pino/file',
          options: { destination: path.join(logsDir, 'verbose.log') },
        },
      }),
    };
  }

  log(message: any, context?: string) {
    this.loggers.info.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.loggers.error.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.loggers.warn.warn({ context }, message);
  }

  debug?(message: any, context?: string) {
    this.loggers.debug.debug({ context }, message);
  }

  verbose?(message: any, context?: string) {
    this.loggers.trace.trace({ context }, message);
  }
}
