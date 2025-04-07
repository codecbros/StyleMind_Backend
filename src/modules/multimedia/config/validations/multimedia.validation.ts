import { z } from 'zod';
import { StorageProviderEnum } from '../../enums/storage-provider.enum';

export const multimediaSchema = z.object({
  STORAGE_PROVIDER: z.enum([
    StorageProviderEnum.FIREBASE,
    StorageProviderEnum.MINIO,
  ]),
});
