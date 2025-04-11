/*
  Warnings:

  - You are about to drop the column `workDeskId` on the `Column` table. All the data in the column will be lost.
  - You are about to drop the `WorkDesk` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `boardId` to the `Column` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Column" DROP CONSTRAINT "Column_workDeskId_fkey";

-- DropForeignKey
ALTER TABLE "WorkDesk" DROP CONSTRAINT "WorkDesk_userId_fkey";

-- AlterTable
ALTER TABLE "Column" DROP COLUMN "workDeskId",
ADD COLUMN     "boardId" TEXT NOT NULL;

-- DropTable
DROP TABLE "WorkDesk";

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_id_key" ON "Board"("id");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
