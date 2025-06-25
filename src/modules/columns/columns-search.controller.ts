import { Controller, Get, Query } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { JwtAuthDecorator } from 'src/common/decorators/jwt.auth.decorator';
import {
    ApiResponseBadRequestDecorator,
    ApiResponseForbiddenDecorator,
    ApiResponseInternalServerErrorDecorator,
    ApiResponseNotFoundDecorator,
    ApiResponseUnauthorizedDecorator,
} from 'src/common/decorators/swagger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('columns/search')
export class ColumnsSearchController {
    constructor(private readonly columnsService: ColumnsService) { }

    @Get('board')
    @JwtAuthDecorator()
    @ApiOperation({ summary: 'Find columns for Board ID and Column Title' })
    @ApiResponse({
        status: 200,
        description: 'Column were found for Board ID and Column Title',
    })
    @ApiResponseBadRequestDecorator('Bad Request – Invalid task ID or missing param')
    @ApiResponseUnauthorizedDecorator()
    @ApiResponseForbiddenDecorator('Forbidden – User has no access to this column')
    @ApiResponseNotFoundDecorator()
    @ApiResponseInternalServerErrorDecorator()
    async searchColumnsInBoard(
        @Query('boardId') boardId: string,
        @Query('query') query: string,
        @Query('position') position: 'asc' | 'desc' = 'asc',
    ) {
        return this.columnsService.searchColumnsInBoard(boardId, query, position);
    }

    @Get('user')
    @JwtAuthDecorator()
    @ApiOperation({ summary: 'Find columns for Column Title' })
    @ApiResponse({
        status: 200,
        description: 'Column were found Column Title',
    })
    @ApiResponseBadRequestDecorator('Bad Request – Invalid task ID or missing param')
    @ApiResponseUnauthorizedDecorator()
    @ApiResponseForbiddenDecorator('Forbidden – User has no access to this column')
    @ApiResponseNotFoundDecorator()
    @ApiResponseInternalServerErrorDecorator()
    async searchColumnsInUser(
        @Query('query') query: string,
        @Query('position') position: 'asc' | 'desc' = 'asc',
    ) {
        return this.columnsService.searchColumnsInUser(query, position);
    }
}
