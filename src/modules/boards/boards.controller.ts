// import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
// import { BoardsService } from './boards.service';
//
// @Controller('boards')
// export class BoardsController {
//   constructor(private readonly boardsService: BoardsService) {}
//
//   @Get()
//   async getAllBoards() {
//     return this.boardsService.getAllBoards();
//   }
//
//   @Get(':id')
//   async getBoardById(@Param('id') id: string) {
//     return this.boardsService.findBoardById(id);
//   }
//
//   @Post()
//   async createBoard(@Body() body: { title: string; description: string }) {
//     return this.boardsService.createBoard(body.title, body.description);
//   }
//
//   @Put(':id')
//   async updateBoard(
//     @Param('id') id: string,
//     @Body() body: { title?: string; description?: string },
//   ) {
//     return this.boardsService.updateBoard(id, body.title, body.description);
//   }
// }
