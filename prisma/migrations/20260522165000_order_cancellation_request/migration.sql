DO $$
BEGIN
  CREATE TYPE "CancellationStatus" AS ENUM ('none', 'requested', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "cancellationStatus" "CancellationStatus" NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancellationResolvedAt" TIMESTAMP(3);
