import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Query,
  Delete,
  Request,
  Controller,
} from '@nestjs/common';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { BoardInvitationsService } from './invitations.service';
import {
  InviteUserToBoardDto,
  RespondToInvitationDto,
} from './dto/invitations-user-to-board.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiResponseBadRequestDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseInternalServerErrorDecorator,
  ApiResponseNotFoundDecorator,
  ApiResponseUnauthorizedDecorator,
} from '../../common/decorators/swagger';

@Controller('boards-invitations')
export class BoardInvitationsController {
  constructor(
    private readonly boardInvitationsService: BoardInvitationsService,
  ) {}

  @Post(':boardId/invite')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Send an invitation to a user to join a board',
    description: 'Send an invitation to a user to join a board',
  })
  @ApiResponse({
    status: 200,
    description: 'The user was invited to the board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async inviteUser(
    @Param('boardId') boardId: string,
    @Body() inviteDto: InviteUserToBoardDto,
    @Request() req: any,
  ) {
    console.log('boardId controller: ', boardId);
    console.log('inviteDto controller: ', inviteDto);
    console.log('req.user controller: ', req.user);
    return this.boardInvitationsService.inviteUserToBoard(
      boardId,
      req.user.id,
      inviteDto,
    );
  }

  @Get('all-received-invitations')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Send an invitation to a user to join a board',
    description: 'Send an invitation to a user to join a board',
  })
  @ApiResponse({
    status: 200,
    description: 'The user was invited to the board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async getUserInvitations(@Request() req: any) {
    console.log('request: ', req.user);
    return this.boardInvitationsService.getReceivedInvitations(req.user.id);
  }

  @Get('all-sent-invitations')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Get sent invitations',
    description: 'Get all pending board invitations sent by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sent invitations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          boardId: { type: 'string' },
          board: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
            },
          },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          receiverEmail: { type: 'string' },
          receiverName: { type: 'string' },
          isRegisteredUser: { type: 'boolean' },
          createdAt: { type: 'string' },
          expiresAt: { type: 'string' },
        },
      },
    },
  })
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async getSentInvitations(@Request() req: any) {
    return this.boardInvitationsService.getSentInvitation(req.user.id);
  }

  @Get('accept/:token')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Send an invitation to a user to join a board',
    description: 'Send an invitation to a user to join a board',
  })
  @ApiResponse({
    status: 200,
    description: 'The user was invited to the board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async respondToInvitationByToken(
    @Param('token') token: string,
    @Request() req: any,
  ) {
    return this.boardInvitationsService.respondToInvitationByToken(
      token,
      req.user.id,
      true,
    );
  }

  @Get('decline/:token')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Send an invitation to a user to join a board',
    description: 'Send an invitation to a user to join a board',
  })
  @ApiResponse({
    status: 200,
    description: 'The user was invited to the board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async declineInvitationByToken(
    @Param('token') token: string,
    @Request() req: any,
  ) {
    return this.boardInvitationsService.respondToInvitationByToken(
      token,
      req.user.id,
      false, // decline
    );
  }

  @Get(':boardId/members')
  @JwtAuthDecorator()
  async getBoardMembers(
    @Param('boardId') boardId: string,
    @Request() req: any,
  ) {
    return this.boardInvitationsService.getBoardMembers(boardId, req.user.id);
  }

  @Delete(':boardId/members/:userId')
  @JwtAuthDecorator()
  async removeUser(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.boardInvitationsService.removeMemberFromBoard(
      boardId,
      userId,
      req.user.id,
    );
  }
}
