import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MultimediaService } from '../services/multimedia.service';

@Processor('images')
export class ImagesConsumer extends WorkerHost {
  constructor(private service: MultimediaService) {
    super();
  }
  async process(job: Job<{ filename: string; buffer: Buffer }>): Promise<any> {
    if (job.name == 'compress') {
      await this.service.updloadFile(
        Buffer.from(job.data.buffer),
        job.data.filename,
      );
    }
  }

  @OnWorkerEvent('completed')
  uploadedImage(job: Job<{ filename: string; buffer: Buffer }>) {
    console.log(`${job.data.filename} se subió con éxito`);
  }
}
