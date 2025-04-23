import {
  Get,
  Put,
  Body,
  Post,
  Param,
  Delete,
  Controller,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import {
  ApiResponseNotFoundDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthDecorator } from '../../common/decorators/jwst.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get all boards' })
  @ApiResponse({ status: 200, description: 'The User get all boards' })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Boards not found')
  @ApiResponseInternalServerErrorDecorator()
  async getAllBoards(@CurrentUserDecorator() user) {
    return this.boardsService.getAllBoards(user.id);
  }

  @Get(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get board for User ID' })
  @ApiResponse({ status: 200, description: 'The User get Board for User ID' })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async getBoardById(@Param('id') id: string) {
    return this.boardsService.findBoardById(id);
  }

  @Post()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'User created board' })
  @ApiResponse({ status: 201, description: 'The User create new Board' })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async createBoard(@Body() body: CreateBoardDto) {
    return this.boardsService.createBoard(
      body.title,
      body.description,
      body.userId,
    );
  }

  @Put(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'User updated Board for User ID' })
  @ApiResponse({
    status: 200,
    description: 'The User update Board for User ID',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async updateBoard(@Param('id') id: string, @Body() body: UpdateBoardDto) {
    return this.boardsService.updateBoard(id, body.title, body.description);
  }

  @Delete(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'User deleted Board for User ID' })
  @ApiResponse({ status: 200, description: 'The User delete Board' })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Board not found')
  @ApiResponseInternalServerErrorDecorator()
  async deleteBoard(@Param('id') id: string) {
    return this.boardsService.deleteBoard(id);
  }
}
