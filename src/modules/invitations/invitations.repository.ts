import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { BoardInvitation, BoardRole, InvitationStatus } from '@prisma/client';

interface CreateInvitationDto {
  boardId: string;
  senderId: string;
  receiverId: string | null;
  email: string;
  status: InvitationStatus;
  role: BoardRole;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class InvitationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findUniqueBoardById(boardId: string, senderId: string) {
    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        user: true,
        members: {
          where: { userId: senderId },
        },
      },
    });
  }

  async findUniqueMember(boardId: string, userId: string) {
    return this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: { boardId, userId },
      },
    });
  }

  async findUniqueInvitation(boardId: string, email: string) {
    return this.prisma.boardInvitation.findFirst({
      where: {
        boardId,
        email,
      },
    });
  }

  async createInvitation(data: CreateInvitationDto) {
    return this.prisma.boardInvitation.create({
      data: {
        boardId: data.boardId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        email: data.email,
        status: data.status,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: {
        board: true,
        sender: true,
        receiver: true,
      },
    });
  }

  async findUniqueUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
  }

  async getReceivedInvitationsResult(receiverId: string, email: string) {
    return this.prisma.boardInvitation.findMany({
      where: {
        OR: [
          // Запрошення для зареєстрованих користувачів
          { receiverId },
          // Запрошення по email для незареєстрованих (або тих що зареєструвались пізніше)
          {
            email,
            receiverId: null, // тільки ті що ще не прив'язані до користувача
          },
        ],
        status: InvitationStatus.PENDING,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getSentInvitationsResult(senderId: string) {
    return this.prisma.boardInvitation.findMany({
      where: {
        senderId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getInvitation(invitationId: string) {
    return this.prisma.boardInvitation.findUnique({
      where: { id: invitationId },
      include: { board: true },
    });
  }

  async getInvitationByToken(token: string) {
    return this.prisma.boardInvitation.findUnique({
      where: { token },
    });
  }

  async updateInvitation(invitationId: string, status: InvitationStatus) {
    return this.prisma.boardInvitation.update({
      where: { id: invitationId },
      data: { status },
    });
  }

  async setAcceptTransaction(
    invitation: BoardInvitation,
    userId: string,
    status: InvitationStatus = InvitationStatus.ACCEPTED,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.boardMember.create({
        data: {
          boardId: invitation.boardId,
          userId,
          role: invitation.role,
          addedBy: invitation.senderId,
        },
      });

      await tx.boardInvitation.update({
        where: { id: invitation.id },
        data: { status, receiverId: userId },
      });
    });
  }

  async getBoardMembers(boardId: string) {
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarPath: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { addedAt: 'asc' }],
    });
  }

  async findBoardForMemberRemoval(
    boardId: string,
    requesterId: string,
    memberUserId: string,
  ) {
    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: {
            userId: { in: [requesterId, memberUserId] },
          },
        },
      },
    });
  }

  async removeMember(memberId: string) {
    return this.prisma.boardMember.delete({
      where: { id: memberId },
    });
  }

  async checkBoardAccess(boardId: string, userId: string): Promise<boolean> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!board) {
      return false;
    }

    return board.userId === userId || board.members.length > 0;
  }
}
