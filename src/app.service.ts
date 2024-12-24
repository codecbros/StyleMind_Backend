import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private logger: Logger) {}

  getHello(): string {
    this.logger.error('Hello World!', AppService.name);
    return 'Hello World!';
  }
}
