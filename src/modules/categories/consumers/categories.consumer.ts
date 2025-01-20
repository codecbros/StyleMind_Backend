import { Processor } from '@nestjs/bull';

@Processor('categories_queue')
export class CategoriesConsumer {
  // constructor(private service: CategoriesService) {}

  // @Process()
  async create() {
    // await this.service.createDefaultCategories();
  }
}
