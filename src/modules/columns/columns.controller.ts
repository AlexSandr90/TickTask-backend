import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ColumnsService } from './columns.service';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  async getAllColumns() {
    return this.columnsService.getAllColumns();
  }

  @Get(':id')
  async getColumnById(@Param('id') id: string) {
    return this.columnsService.findColumnById(id);
  }

  @Post()
  async createColumn(
    @Body() body: { title: string; order: number; boardId: string },
  ) {
    return this.columnsService.createColumn(
      body.title,
      body.order,
      body.boardId,
    );
  }

  @Put(':id')
  async updateColumn(
    @Param('id') id: string,
    @Body() body: { title?: string; order?: number },
  ) {
    return this.columnsService.updateColumn(id, body.title, body.order);
  }

  @Delete(':id')
  async deleteColumn(@Param('id') id: string) {
    return this.columnsService.deleteColumn(id);
  }
}
