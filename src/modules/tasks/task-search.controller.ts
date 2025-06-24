import { Controller, Get, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthDecorator } from 'src/common/decorators/jwt.auth.decorator';
import {
    ApiResponseBadRequestDecorator,
    ApiResponseForbiddenDecorator,
    ApiResponseInternalServerErrorDecorator,
    ApiResponseNotFoundDecorator,
    ApiResponseUnauthorizedDecorator,
} from 'src/common/decorators/swagger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('tasks/search')
export class TaskSearchController {
    constructor(private readonly tasksService: TasksService) { }

    @Get('column')
    @JwtAuthDecorator()
    @ApiOperation({ summary: 'Find tasks for Column ID and Task Title' })
    @ApiResponse({
        status: 200,
        description: 'Tasks were found for column ID and Task Title',
    })
    @ApiResponseBadRequestDecorator('Bad Request – Invalid task ID or missing param')
    @ApiResponseUnauthorizedDecorator()
    @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
    @ApiResponseNotFoundDecorator()
    @ApiResponseInternalServerErrorDecorator()
    async searchTasksInColumn(
        @Query('columnId') columnId: string,
        @Query('query') query: string,
        @Query('position') position: 'asc' | 'desc' = 'asc',
    ) {
        return this.tasksService.searchTasks(columnId, query, position);
    }

    @Get('board')
    @JwtAuthDecorator()
    async searchTasksInBoard(
        @Query('boardId') boardId: string,
        @Query('query') query: string,
        @Query('position') position: 'asc' | 'desc' = 'asc',
    ) {
        return this.tasksService.searchTasksInBoard(boardId, query, position);
    }
}
