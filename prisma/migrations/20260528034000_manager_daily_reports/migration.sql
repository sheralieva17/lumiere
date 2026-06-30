-- CreateTable
CREATE TABLE "ManagerDailyReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "deliveredOrdersCount" INTEGER NOT NULL,
    "deliveredRevenue" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "managerId" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerDailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagerDailyReport_reportDate_key" ON "ManagerDailyReport"("reportDate");

-- AddForeignKey
ALTER TABLE "ManagerDailyReport" ADD CONSTRAINT "ManagerDailyReport_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
