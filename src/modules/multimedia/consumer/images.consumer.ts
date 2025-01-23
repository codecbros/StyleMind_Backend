import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MultimediaService } from '../services/multimedia.service';

@Processor('images')
export class ImagesConsumer extends WorkerHost {
  constructor(private service: MultimediaService) {
    super();
  }
  async process(
    job: Job<{ filename: string; buffer: Buffer; itemId: string }>,
  ): Promise<any> {
    if (job.name == 'compress') {
      await this.service.updloadFile(
        Buffer.from(job.data.buffer),
        job.data.filename,
        job.data.itemId,
      );
    }
  }
}
