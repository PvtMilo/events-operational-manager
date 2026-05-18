-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SCHEDULE_MAKER', 'HEAD_OPERATIONAL');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('PIC', 'SENIOR_CREW', 'JUNIOR_CREW', 'INHOUSE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFTED', 'SCHEDULED', 'READY', 'ONGOING', 'PENDING_EVALUATION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoleInEvent" AS ENUM ('PIC', 'CREW');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'CONFIRMED', 'REPLACED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SCHEDULE_MAKER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "defaultRole" "StaffRole" NOT NULL,
    "canBeAssignedToEvent" BOOLEAN NOT NULL DEFAULT true,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "serviceTypeId" TEXT NOT NULL,
    "salesId" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "loadingDate" TIMESTAMP(3),
    "loadingTime" TEXT,
    "location" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFTED',
    "vehicleName" TEXT,
    "driverName" TEXT,
    "ribbonStart" INTEGER,
    "ribbonEnd" INTEGER,
    "ribbonUsed" INTEGER,
    "vendorSewa" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_assignments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "roleInEvent" "RoleInEvent" NOT NULL,
    "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_evaluations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "evaluatorUserId" TEXT NOT NULL,
    "clientSatisfactionOk" BOOLEAN NOT NULL DEFAULT false,
    "clientFeedback" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_event_evaluations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "evaluatorUserId" TEXT NOT NULL,
    "sopOk" BOOLEAN NOT NULL DEFAULT false,
    "warehouseOk" BOOLEAN NOT NULL DEFAULT false,
    "groomingOk" BOOLEAN NOT NULL DEFAULT false,
    "dataCollectionOk" BOOLEAN NOT NULL DEFAULT false,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_event_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_assignments_eventId_staffId_key" ON "event_assignments"("eventId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "event_evaluations_eventId_key" ON "event_evaluations"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_event_evaluations_eventId_staffId_key" ON "staff_event_evaluations"("eventId", "staffId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_evaluations" ADD CONSTRAINT "event_evaluations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_evaluations" ADD CONSTRAINT "event_evaluations_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_event_evaluations" ADD CONSTRAINT "staff_event_evaluations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_event_evaluations" ADD CONSTRAINT "staff_event_evaluations_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_event_evaluations" ADD CONSTRAINT "staff_event_evaluations_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
