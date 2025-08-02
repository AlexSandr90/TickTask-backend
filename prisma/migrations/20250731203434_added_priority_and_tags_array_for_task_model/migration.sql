-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tags" TEXT[];
