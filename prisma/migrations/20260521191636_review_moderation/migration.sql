-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('pending', 'approved', 'rejected', 'escalated');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "escalatedToAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerReply" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "managerUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'pending';
