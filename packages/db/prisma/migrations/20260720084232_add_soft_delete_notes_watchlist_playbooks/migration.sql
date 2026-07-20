-- AlterTable
ALTER TABLE "LibraryNote" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Playbook" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "WatchlistItem" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "LibraryNote_userId_deletedAt_idx" ON "LibraryNote"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Playbook_userId_deletedAt_idx" ON "Playbook"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_deletedAt_idx" ON "WatchlistItem"("userId", "deletedAt");
