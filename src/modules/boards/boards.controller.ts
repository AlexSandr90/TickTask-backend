import { Get, Put, Body, Post, Param, Delete, Controller, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import {
  ApiResponseNotFoundDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';
import {
  ApiCreateBoardResponses,
  ApiUpdateBoardResponses,
  ApiDeleteBoardResponses,
  ApiGetBoardByIdResponses,
  ApiGetAllBoardsResponses,
} from '../../common/decorators/boards-api-responses.decorator';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) { }

  @Get()
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Get all boards',
    description: 'Retrieve all boards belonging to the authenticated user',
  })
  @ApiGetAllBoardsResponses()
  @ApiResponse({ status: 200, description: 'The User get all boards' })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async getAllBoards(@CurrentUserDecorator() user) {
    return this.boardsService.getAllBoards(user.id);
  }

  @Get('search')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Search boards for Board title',
    description: 'Retrieve all boards for Board title',
  })
  @ApiGetAllBoardsResponses()
  @ApiResponse({ status: 200, description: 'The User get all boards' })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board title or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async searchBoards(
    @Query('query') query: string,
    @Query('position') position: 'asc' | 'desc' = 'asc',
  ) {
    return this.boardsService.searchBoards(query, position);
  }

  @Get(':id')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Get board for User ID',
    description: 'Retrieve a specific board by ID for the authenticated user',
  })
  @ApiGetBoardByIdResponses()
  @ApiResponse({ status: 200, description: 'The User get Board for User ID' })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async getBoardById(@Param('id') id: string, @CurrentUserDecorator() user) {
    return this.boardsService.findBoardById(id, user.id);
  }

  @Post()
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'User created board',
    description: 'Create a new board for the authenticated user',
  })
  @ApiCreateBoardResponses()
  @ApiResponse({ status: 201, description: 'The User create new Board' })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async createBoard(@Body() body: CreateBoardDto, @CurrentUserDecorator() user) {
    return this.boardsService.createBoard(body, user.id);
  }

  @Put(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'User updated Board for User ID' })
  @ApiResponse({
    status: 200,
    description: 'The User update Board for User ID',
  })
  @ApiUpdateBoardResponses()
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async updateBoard(
    @Param('id') id: string,
    @Body() body: UpdateBoardDto,
    @CurrentUserDecorator() user,
  ) {
    return this.boardsService.updateBoard(id, user.id, body.title, body.description);
  }

  @Delete(':id')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'User deleted Board for User ID',
    description: 'Delete a specific board for the authenticated user',
  })
  @ApiDeleteBoardResponses()
  @ApiResponse({ status: 200, description: 'The User delete Board' })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid board ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async deleteBoard(@Param('id') id: string, @CurrentUserDecorator() user) {
    return this.boardsService.deleteBoard(id, user.id);
  }
}
