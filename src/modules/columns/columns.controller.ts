import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
  Controller,
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
  async getAllColumns() {
    return this.columnsService.getAllColumns();
  }

  @Get(':id')
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
  @ApiOperation({ summary: 'Create column' })
  @ApiResponse({
    status: 200,
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
