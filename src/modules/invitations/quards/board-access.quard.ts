import { BoardRole } from '@prisma/client';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../prisma/prisma.service';

export const RequireBoardRoles = (...roles: BoardRole[]) =>
  SetMetadata('boardRoles', roles);

export const RequreBoardAccess = () => SetMetadata('requireBoardAccess', true);

@Injectable()
export class BoardAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const boardId = request.params?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!boardId) {
      throw new ForbiddenException('Board ID not provided');
    }

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    let userRole: BoardRole | null = null;

    if (board.userId === userId) {
      userRole = BoardRole.OWNER;
    } else if (board.members.length > 0) {
      userRole = board.members[0].role;
    }

    if (!userRole) {
      throw new ForbiddenException('User does not have access to this board');
    }

    request.userBoardRole = userRole;
    request.board = board;

    const requiredRoles = this.reflector.get<BoardRole[]>(
      'boardRoles',
      context.getHandler(),
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(userRole);

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          'User does not have the required role to access this board',
        );
      }
    }

    return true;
  }
}

@Injectable()
export class BoardPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async canUserPerformAction(
    boardId: string,
    userId: string,
    requiredRoles: BoardRole[],
  ): Promise<{ allowed: boolean; userRole: BoardRole | null }> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!board) {
      return { allowed: false, userRole: null };
    }

    let userRole: BoardRole | null = null;

    if (board.userId === userId) {
      userRole = BoardRole.OWNER;
    } else if (board.members.length > 0) {
      userRole = board.members[0].role;
    }

    const allowed = userRole && requiredRoles.includes(userRole);

    return { allowed: !!allowed, userRole };
  }

  async getUserRoleOnBoard(
    boardId: string,
    userId: string,
  ): Promise<BoardRole | null> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!board) return null;

    if (board.userId === userId) return BoardRole.OWNER;

    if (board.members.length > 0) return board.members[0].role;

    return null;
  }

  async hasAccessToBoard(boardId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleOnBoard(boardId, userId);
    return role !== null;
  }

  async getUserBoards(userId: string) {
    const ownedBoards = await this.prisma.board.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            members: true,
            columns: true,
          },
        },
      },
    });

    const memberBoards = await this.prisma.board.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          where: { userId },
        },
        _count: {
          select: {
            members: true,
            columns: true,
          },
        },
      },
    });

    return {
      owned: ownedBoards.map((board) => ({
        ...board,
        role: BoardRole.OWNER,
      })),
      member: memberBoards.map((board) => ({
        ...board,
        role: board.members[0]?.role,
      })),
    };
  }
}
