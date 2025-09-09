/*
  Warnings:

  - A unique constraint covering the columns `[boardId,email]` on the table `BoardInvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `BoardInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."BoardInvitation_boardId_receiverId_key";

-- AlterTable
ALTER TABLE "public"."BoardInvitation" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BoardInvitation_boardId_email_key" ON "public"."BoardInvitation"("boardId", "email");
