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
  async getAllColumns() {
    return this.tasksService.getAllColumns();
  }

  @Get(':id')
  async getColumnById(@Param('id') id: string) {
    return this.tasksService.findColumnById(id);
  }

  @Post()
  async createColumn(
    @Body() body: { title: string; description: string; columnId: string },
  ) {
    return this.tasksService.createColumn(
      body.title,
      body.description,
      body.columnId,
    );
  }

  @Put(':id')
  async updateColumn(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.tasksService.updateColumn(id, body.title, body.description);
  }

  @Delete(':id')
  async deleteColumn(@Param('id') id: string) {
    return this.tasksService.deleteColumn(id);
  }
}
