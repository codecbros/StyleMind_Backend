import { PrismaService } from '@/shared/services/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CombinationsService {
  constructor(private db: PrismaService) {}
}
