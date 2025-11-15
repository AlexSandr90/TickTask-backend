-- CreateIndex
CREATE INDEX "Board_userId_idx" ON "public"."Board"("userId");

-- CreateIndex
CREATE INDEX "BoardInvitation_receiverId_idx" ON "public"."BoardInvitation"("receiverId");

-- CreateIndex
CREATE INDEX "BoardInvitation_senderId_idx" ON "public"."BoardInvitation"("senderId");

-- CreateIndex
CREATE INDEX "BoardMember_userId_idx" ON "public"."BoardMember"("userId");

-- CreateIndex
CREATE INDEX "Task_columnId_idx" ON "public"."Task"("columnId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "public"."Task"("userId");

-- CreateIndex
CREATE INDEX "Task_columnId_userId_idx" ON "public"."Task"("columnId", "userId");

-- CreateIndex
CREATE INDEX "Task_isCompleted_idx" ON "public"."Task"("isCompleted");
