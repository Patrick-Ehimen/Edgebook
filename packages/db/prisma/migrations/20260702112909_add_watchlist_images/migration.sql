-- AlterTable
ALTER TABLE "WatchlistItem" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
