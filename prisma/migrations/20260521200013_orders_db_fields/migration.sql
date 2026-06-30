/*
  Warnings:

  - Added the required column `shipping` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderManagerStatus" AS ENUM ('pending_review', 'confirmed', 'needs_clarification', 'sent_to_fulfillment');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "managerNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "managerStatus" "OrderManagerStatus" NOT NULL DEFAULT 'pending_review',
ADD COLUMN     "managerUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "shipping" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "shippingAddress" TEXT NOT NULL,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL;
