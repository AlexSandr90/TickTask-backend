import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  BoardDeleteResponseDto,
  BoardResponseDTO,
} from '../../modules/boards/dto/board.responses';
import { CreateBoardDto } from '../../modules/boards/dto/create-board.dto';
import { UpdateBoardDto } from '../../modules/boards/dto/update-board.dto';

export const ApiGetAllBoardsResponses = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved all boards',
      type: [BoardResponseDTO],
    }),
  );

export const ApiGetBoardByIdResponses = () =>
  applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Board ID',
      type: 'string',
      example: 'uuid-board-id',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved the board',
      type: BoardResponseDTO,
    }),
  );

export const ApiCreateBoardResponses = () =>
  applyDecorators(
    ApiBody({
      type: CreateBoardDto,
      description: 'Board creation data',
      examples: {
        example1: {
          summary: 'Basic board creation',
          value: {
            title: 'My New Board',
            description: 'This is a board for managing tasks',
          },
        },
      },
    }),

    ApiResponse({
      status: 200,
      description: 'Successfully created board',
      type: BoardResponseDTO,
    }),
  );

export const ApiUpdateBoardResponses = () =>
  applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Board ID to update',
      type: 'string',
      example: 'uuid-board-id',
    }),

    ApiBody({
      type: UpdateBoardDto,
      description: 'Board update data',
      examples: {
        example1: {
          summary: 'Update board title and description',
          value: {
            title: 'Updated Board Title',
            description: 'Updated description',
          },
        },
        example2: {
          summary: 'Update only title',
          value: {
            title: 'New Title Only',
          },
        },
      },
    }),

    ApiResponse({
      status: 200,
      description: 'Successfully updated board',
      type: BoardResponseDTO,
    }),
  );

export const ApiDeleteBoardResponses = () =>
  applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Board ID to delete',
      type: 'string',
      example: 'uuid-board-id',
    }),

    ApiResponse({
      status: 200,
      description: 'Successfully deleted board',
      type: BoardDeleteResponseDto,
    }),
  );
