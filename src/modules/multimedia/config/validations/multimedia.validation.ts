import { z } from 'zod';
import { ObjectStorageEnum } from '../../enums/object-storage.enum';

export const multimediaSchema = z.object({
  OBJECT_STORAGE: z.enum([ObjectStorageEnum.FIREBASE, ObjectStorageEnum.MINIO]),
});
