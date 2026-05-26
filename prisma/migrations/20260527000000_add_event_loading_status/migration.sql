-- CreateEnum
CREATE TYPE "EventLoadingStatus" AS ENUM ('NOT_PREPARED', 'PREPARING', 'LOADING', 'LOADED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "loadingStatus" "EventLoadingStatus" NOT NULL DEFAULT 'NOT_PREPARED';
