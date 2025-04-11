import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getAllTasks() {
    return this.tasksService.getAllTasks();
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string) {
    return this.tasksService.findTaskById(id);
  }

  @Post()
  async createTask(
    @Body() body: { title: string; description: string; columnId: string },
  ) {
    return this.tasksService.createTask(
      body.title,
      body.description,
      body.columnId,
    );
  }

  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.tasksService.updateTask(id, body.title, body.description);
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}
