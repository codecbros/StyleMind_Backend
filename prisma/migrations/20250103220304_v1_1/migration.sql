-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
