import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  ApiResponseBadRequestDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseInternalServerErrorDecorator,
  ApiResponseNotFoundDecorator,
  ApiResponseUnauthorizedDecorator,
} from '../../common/decorators/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { TaskForCalendarDto } from './dto/calendar-task.dto';
import { ToggleCompleteDto } from './dto/toggle-complete.dto';
import { Task } from '@prisma/client';
import { AssignTaskDto } from './dto/assign-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({
    status: 200,
    description: 'The user received all tasks for the current column',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator('Tasks not found')
  @ApiResponseInternalServerErrorDecorator()
  async getAllTasks(
    @Query('columnId') columnId: string,
    @Query('position') position?: 'asc' | 'desc',
  ) {
    if (!columnId) {
      throw new BadRequestException('Missing columnId');
    }

    return this.tasksService.getAllTasks(columnId, position ?? 'asc');
  }

  // ВАЖНО: calendar должен быть ПЕРЕД :id
  @Get('calendar')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get all tasks for calendar view' })
  @ApiResponse({
    status: 200,
    description: 'The user received all tasks for calendar',
  })
  async getTasksForCalendar(
    @CurrentUserDecorator() user: { id: string },
  ): Promise<TaskForCalendarDto[]> {
    return await this.tasksService.getAllTasksForCalendar(user.id);
  }

  @Patch(':id/assign')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Assigned task for task id' })
  @ApiResponse({
    status: 200,
    description: 'The user received task for column iD',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator('Task not found')
  @ApiResponseInternalServerErrorDecorator()
  async assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @Req() req,
  ) {
    return this.tasksService.assignTask(id, assignTaskDto, req.user.id);
  }

  @Get(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get task for Column ID' })
  @ApiResponse({
    status: 200,
    description: 'The user received task for column iD',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator('Task not found')
  @ApiResponseInternalServerErrorDecorator()
  async getTaskById(@Param('id') id: string) {
    return this.tasksService.findTaskById(id);
  }

  @Post()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Create task for Column ID' })
  @ApiResponse({
    status: 201,
    description: 'The user created task for column iD',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async createTask(
    @Body() body: CreateTaskDto,
    @CurrentUserDecorator() user: { id: string },
  ) {
    return this.tasksService.createTask(
      body.title,
      body.description,
      body.columnId,
      user.id, // userId передаем вторым
      body.priority, // priority
      body.tags, // tags
    );
  }

  @Put(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Update task for Column ID' })
  @ApiResponse({
    status: 200,
    description: 'The user updated task for column iD',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async updateTask(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @CurrentUserDecorator() user: { id: string },
  ) {
    return this.tasksService.updateTask(
      id,
      body.title,
      body.description,
      body.position,
      body.columnId,
      user.id,
      body.priority,
      body.tags,
      body?.deadline,
    );
  }

  @Delete(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Delete task for Column ID' })
  @ApiResponse({
    status: 200,
    description: 'The user deleted task for column ID',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator('Task not found')
  @ApiResponseInternalServerErrorDecorator()
  async deleteTask(
    @Param('id') id: string,
    @CurrentUserDecorator() user: { id: string },
  ) {
    return this.tasksService.deleteTaskUnified(id, user.id);
  }

  @Patch('toggle-complete')
  @ApiOperation({ summary: 'Toggle task completion status' })
  @JwtAuthDecorator()
  async toggleComplete(
    @Body() dto: ToggleCompleteDto,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<Task> {
    return this.tasksService.toggleComplete(
      dto.taskId,
      dto.isCompleted,
      user.id,
    );
  }
}
