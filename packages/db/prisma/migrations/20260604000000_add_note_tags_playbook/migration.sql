-- AlterTable
ALTER TABLE "LibraryNote" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LibraryNote" ADD COLUMN "playbookId" TEXT;

-- AddForeignKey
ALTER TABLE "LibraryNote" ADD CONSTRAINT "LibraryNote_playbookId_fkey"
  FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "LibraryNote_playbookId_idx" ON "LibraryNote"("playbookId");
