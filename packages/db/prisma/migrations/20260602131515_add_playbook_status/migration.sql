-- CreateEnum
CREATE TYPE "PlaybookStatus" AS ENUM ('experimental', 'active', 'paused');

-- AlterTable
ALTER TABLE "Fill" ALTER COLUMN "moods" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Playbook" ADD COLUMN     "status" "PlaybookStatus" NOT NULL DEFAULT 'experimental';
