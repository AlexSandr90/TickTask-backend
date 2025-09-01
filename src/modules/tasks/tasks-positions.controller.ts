import { Body, Controller, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthDecorator } from 'src/common/decorators/jwt.auth.decorator';

import { UpdateTaskPositionsDto } from './dto/update-task-positions.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiResponseBadRequestDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseInternalServerErrorDecorator,
  ApiResponseNotFoundDecorator,
  ApiResponseUnauthorizedDecorator,
} from 'src/common/decorators/swagger';

@Controller('tasks/positions')
export class TasksPositionsController {
  constructor(private readonly tasksService: TasksService) {}

  @Put()
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Update positions of multiple tasks' })
  @ApiResponse({ status: 200, description: 'Tasks positions updated' })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async updateManyPositions(
    @Body() updateTaskPositionsDto: UpdateTaskPositionsDto,
  ) {
    return this.tasksService.updateTaskPositions(updateTaskPositionsDto.tasks);
  }
}
