-- AlterTable
ALTER TABLE "users" ADD COLUMN     "skin_color" TEXT;

-- AlterTable
ALTER TABLE "wardrobe_items" ALTER COLUMN "season" DROP NOT NULL,
ALTER COLUMN "material" DROP NOT NULL;
