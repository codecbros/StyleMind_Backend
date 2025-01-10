/*
  Warnings:

  - You are about to drop the column `created_by_id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by_admin` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `is_public` on the `categories` table. All the data in the column will be lost.
  - Added the required column `genderId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_created_by_id_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "created_by_id",
DROP COLUMN "deleted_by_admin",
DROP COLUMN "is_default",
DROP COLUMN "is_public";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "genderId" TEXT NOT NULL,
ADD COLUMN     "show_all_categories" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "genders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_genders" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "genderId" TEXT NOT NULL,

    CONSTRAINT "category_genders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genders_name_key" ON "genders"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_genders" ADD CONSTRAINT "category_genders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_genders" ADD CONSTRAINT "category_genders_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
