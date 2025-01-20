import { Processor } from '@nestjs/bull';
@Processor('admin_queue')
export class AdminConsumer {
  // @Process()
  async process(): Promise<any> {
    return {};
  }
}
