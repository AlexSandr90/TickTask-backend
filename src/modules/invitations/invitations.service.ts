import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import {
  InviteUserToBoardDto,
  RespondToInvitationDto,
} from './dto/invitations-user-to-board.dto';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { BoardRole, InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class BoardInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async inviteUserToBoard(
    boardId: string,
    senderId: string,
    inviteDto: InviteUserToBoardDto,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        user: true,
        members: {
          where: { userId: senderId },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isOwner = board.userId === senderId;
    const memberRole = board.members[0]?.role;
    const canInvite = isOwner || memberRole === BoardRole.ADMIN;

    if (!canInvite) {
      throw new ForbiddenException(
        'You do not have permission to invite users',
      );
    }

    const receiver = await this.prisma.user.findUnique({
      where: { email: inviteDto.email },
    });

    if (receiver) {
      const existingMember = await this.prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId,
            userId: receiver.id,
          },
        },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of this board');
      }
    }

    const existingInvitation = await this.prisma.boardInvitation.findFirst({
      where: {
        boardId,
        email: inviteDto.email,
      },
    });

    if (
      existingInvitation &&
      existingInvitation.status === InvitationStatus.PENDING
    ) {
      throw new BadRequestException('Invitation already exists');
    }

    if (existingInvitation) {
      await this.prisma.boardInvitation.delete({
        where: { id: existingInvitation.id },
      });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.boardInvitation.create({
      data: {
        boardId,
        senderId,
        receiverId: receiver?.id ?? null,
        email: inviteDto.email,
        status: InvitationStatus.PENDING,
        role: inviteDto.role,
        token,
        expiresAt,
      },
      include: {
        board: true,
        sender: true,
        receiver: true,
      },
    });

    await this.emailService.sendBoardInvitation({
      to: inviteDto.email,
      receiverName: receiver?.username || inviteDto.email,
      senderName: invitation.sender.username,
      boardTitle: board.title,
      invitationToken: token,
      expiresAt,
    });

    return {
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        receiverEmail: inviteDto.email,
        role: invitation.role,
        status: invitation.role,
      },
    };
  }

  async getReceivedInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.boardInvitation.findMany({
      where: {
        OR: [
          // Запрошення для зареєстрованих користувачів
          {
            receiverId: userId,
          },
          // Запрошення по email для незареєстрованих (або тих що зареєструвались пізніше)
          {
            email: user.email,
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

    return result;
  }

  async getSentInvitation(userId: string) {
    const result = await this.prisma.boardInvitation.findMany({
      where: {
        senderId: userId,
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

    const formattedResult = result.map((invitation) => ({
      id: invitation.id,
      boardId: invitation.boardId,
      board: invitation.board,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      receiverEmail: invitation.receiver?.email || invitation.email,
      receiverName: invitation.receiver?.username || invitation.email,
      isRegisteredUser: !!invitation.receiver,
    }));

    return formattedResult;
  }

  async respondToInvitation(
    invitationId: string,
    userId: string,
    responseDto: RespondToInvitationDto,
  ) {
    const invitation = await this.prisma.boardInvitation.findUnique({
      where: { id: invitationId },
      include: { board: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.receiverId && invitation.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to respond to this invitation',
      );
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation has already been responded to');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await this.prisma.boardInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (responseDto.accept) {
      await this.prisma.$transaction(async (tx) => {
        await tx.boardMember.create({
          data: {
            boardId: invitation.boardId,
            userId,
            role: invitation.role,
            addedBy: invitation.senderId,
          },
        });

        await tx.boardInvitation.update({
          where: { id: invitationId },
          data: { status: InvitationStatus.ACCEPTED, receiverId: userId },
        });
      });

      return {
        message: 'Invitation accepted',
        board: {
          id: invitation.board.id,
          title: invitation.board.title,
        },
      };
    } else {
      await this.prisma.boardInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.DECLINED },
      });

      return { message: 'Invitation declined' };
    }
  }

  async respondToInvitationByToken(
    token: string,
    userId: string,
    responseDto: RespondToInvitationDto,
  ) {
    const invitation = await this.prisma.boardInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.respondToInvitation(invitation.id, userId, responseDto);
  }

  async getBoardMembers(boardId: string, requestId: string) {
    const hasAccess = await this.checkBoardAccess(boardId, requestId);

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this board',
      );
    }

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

  async removeMemberFromBoard(
    boardId: string,
    memberUserId: string,
    requesterId: string,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: {
            userId: { in: [requesterId, memberUserId] },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const requesterMember = board.members.find((m) => m.userId === requesterId);
    const targetMember = board.members.find((m) => m.userId === memberUserId);

    const isOwner = board.userId === requesterId;

    const canRemove =
      isOwner ||
      (requesterMember?.role === BoardRole.ADMIN &&
        targetMember?.role === BoardRole.USER);

    if (!canRemove) {
      throw new ForbiddenException(
        'You do not have permission to remove this member',
      );
    }

    if (!targetMember) {
      throw new NotFoundException('The user is not a member of this board');
    }

    await this.prisma.boardMember.delete({
      where: { id: targetMember.id },
    });

    return { message: 'Member removed successfully' };
  }

  // ==================== PRIVATE METHODS ====================
  private async checkBoardAccess(
    boardId: string,
    userId: string,
  ): Promise<boolean> {
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
