import { Process, Processor } from '@nestjs/bull';
import { CategoriesService } from '../services/categories.service';

@Processor('categories_queue')
export class CategoriesConsumer {
  constructor(private service: CategoriesService) {}

  @Process('create')
  async create() {
    await this.service.createDefaultCategories();
  }
}
