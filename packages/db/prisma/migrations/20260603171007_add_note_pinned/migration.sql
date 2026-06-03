-- AlterTable
ALTER TABLE "LibraryNote" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "LibraryNote_userId_pinned_idx" ON "LibraryNote"("userId", "pinned");
