-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailChangeToken" TEXT,
ADD COLUMN     "pendingEmail" TEXT;
