import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Controller,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import {
  ApiResponseNotFoundDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';
import { ColumnDto } from './dto/column.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { JwtAuthDecorator } from '../../common/decorators/jwst.auth.decorator';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all columns' })
  @ApiResponse({
    status: 200,
    description: 'The user received all columns for the current board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Columns not found')
  @ApiResponseInternalServerErrorDecorator()
  async getAllColumns(@Query('boardId') boardId: string) {
    if (!boardId) {
      throw new BadRequestException('Missing boardId');
    }

    return this.columnsService.getAllColumns(boardId);
  }

  @Get(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get column by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user received 1 column by ID for the current board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Column not found')
  @ApiResponseInternalServerErrorDecorator()
  async getColumnById(@Param('id') id: string) {
    return this.columnsService.findColumnById(id);
  }

  @Post()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Create column' })
  @ApiResponse({
    status: 201,
    description: 'The user created column',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Column not found')
  @ApiResponseInternalServerErrorDecorator()
  async createColumn(@Body() body: CreateColumnDto) {
    return this.columnsService.createColumn(body.title, body.boardId);
  }

  @Put(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Change column by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user changed 1 column by ID for the current board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Column not found')
  @ApiResponseInternalServerErrorDecorator()
  async updateColumn(@Param('id') id: string, @Body() body: ColumnDto) {
    return this.columnsService.updateColumn(id, body.title);
  }

  @Delete(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Delete column by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user delete 1 column by ID for the current board',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid board ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this board')
  @ApiResponseNotFoundDecorator('Column not found')
  @ApiResponseInternalServerErrorDecorator()
  async deleteColumn(@Param('id') id: string) {
    return this.columnsService.deleteColumn(id);
  }
}
