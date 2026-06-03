-- CreateTable
CREATE TABLE "LibraryNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconId" TEXT NOT NULL DEFAULT 'file',
    "bodyMd" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LibraryNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryNote_userId_idx" ON "LibraryNote"("userId");

-- CreateIndex
CREATE INDEX "LibraryNote_userId_folderId_idx" ON "LibraryNote"("userId", "folderId");

-- AddForeignKey
ALTER TABLE "LibraryNote" ADD CONSTRAINT "LibraryNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
