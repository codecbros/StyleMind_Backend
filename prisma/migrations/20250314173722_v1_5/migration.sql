/*
  Warnings:

  - You are about to drop the column `position` on the `combination_items` table. All the data in the column will be lost.
  - You are about to drop the column `ai_description` on the `combinations` table. All the data in the column will be lost.
  - You are about to drop the column `likes_count` on the `combinations` table. All the data in the column will be lost.
  - You are about to drop the column `feature_id` on the `usage_tracking` table. All the data in the column will be lost.
  - You are about to drop the column `plan_id` on the `usage_tracking` table. All the data in the column will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `followers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plan_features` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plan_limits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_combination_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "followers" DROP CONSTRAINT "followers_follower_id_fkey";

-- DropForeignKey
ALTER TABLE "followers" DROP CONSTRAINT "followers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "likes" DROP CONSTRAINT "likes_combination_id_fkey";

-- DropForeignKey
ALTER TABLE "likes" DROP CONSTRAINT "likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "plan_features" DROP CONSTRAINT "plan_features_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "plan_limits" DROP CONSTRAINT "plan_limits_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "suscriptions" DROP CONSTRAINT "suscriptions_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "suscriptions" DROP CONSTRAINT "suscriptions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "usage_tracking" DROP CONSTRAINT "usage_tracking_feature_id_fkey";

-- DropForeignKey
ALTER TABLE "usage_tracking" DROP CONSTRAINT "usage_tracking_plan_id_fkey";

-- AlterTable
ALTER TABLE "combination_items" DROP COLUMN "position",
ADD COLUMN     "ai_description" TEXT;

-- AlterTable
ALTER TABLE "combinations" DROP COLUMN "ai_description",
DROP COLUMN "likes_count";

-- AlterTable
ALTER TABLE "usage_tracking" DROP COLUMN "feature_id",
DROP COLUMN "plan_id";

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "followers";

-- DropTable
DROP TABLE "likes";

-- DropTable
DROP TABLE "plan_features";

-- DropTable
DROP TABLE "plan_limits";

-- DropTable
DROP TABLE "plans";

-- DropTable
DROP TABLE "suscriptions";
