import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { JwtAuthDecorator } from '../../common/decorators/jwst.auth.decorator';

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
  async createTask(@Body() body: CreateTaskDto) {
    return this.tasksService.createTask(
      body.title,
      body.description,
      body.columnId,
    );
  }

  @Put(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Update task for Column ID' })
  @ApiResponse({
    status: 200,
    description: 'The user updated task for column iD',
  })
  @ApiResponseBadRequestDecorator('Bad Request – Invalid task ID or missing param')
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async updateTask(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.tasksService.updateTask(id, body.title, body.description, body.position);
  }

  @Delete(':id')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Delete task for Column ID' })
  @ApiResponse({
    status: 200,
    description: 'The user deleted task for column iD',
  })
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator('Forbidden – User has no access to this task')
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}
