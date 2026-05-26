-- CreateEnum
CREATE TYPE "StaffAvailabilityType" AS ENUM ('LIBUR', 'IZIN', 'SAKIT', 'CUTI', 'BLOCKED');

-- CreateEnum
CREATE TYPE "StaffAvailabilityStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "StaffAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "StaffAvailabilityType" NOT NULL,
    "status" "StaffAvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isFullDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAvailabilityBlock_staffId_idx" ON "StaffAvailabilityBlock"("staffId");

-- CreateIndex
CREATE INDEX "StaffAvailabilityBlock_type_idx" ON "StaffAvailabilityBlock"("type");

-- CreateIndex
CREATE INDEX "StaffAvailabilityBlock_status_idx" ON "StaffAvailabilityBlock"("status");

-- CreateIndex
CREATE INDEX "StaffAvailabilityBlock_startDate_idx" ON "StaffAvailabilityBlock"("startDate");

-- CreateIndex
CREATE INDEX "StaffAvailabilityBlock_endDate_idx" ON "StaffAvailabilityBlock"("endDate");

-- AddForeignKey
ALTER TABLE "StaffAvailabilityBlock" ADD CONSTRAINT "StaffAvailabilityBlock_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
