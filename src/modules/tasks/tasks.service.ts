import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async getAllTasks(columnId: string, position: 'asc' | 'desc' = 'asc') {
    return this.tasksRepository.findAll(columnId, position);
  }

  async findTaskById(id: string) {
    return this.tasksRepository.findOne(id);
  }

  async createTask(title: string, description: string, columnId: string) {
    return this.tasksRepository.create({ title, description, columnId });
  }

  async updateTask(
    id: string,
    title?: string,
    description?: string,
    position?: number,
    columnId?: string,
  ) {
    const task = await this.tasksRepository.findOne(id);
    if (!task) throw new Error('Task not found');

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const oldColumnId = task.columnId;
    const newColumnId = columnId ?? oldColumnId;

    // Обновляем позицию и колонку, если колонка изменилась
    if (columnId && columnId !== oldColumnId) {
      // Пересчитываем позиции в старой колонке
      const oldTasks = await this.tasksRepository.findAll(oldColumnId, 'asc');
      const updatedOld = oldTasks
        .filter((t) => t.id !== id)
        .map((t, i) => ({ id: t.id, position: i, columnId: oldColumnId }));

      // Получаем новые задачи новой колонки
      const newTasks = await this.tasksRepository.findAll(newColumnId, 'asc');
      const newPosition = position ?? newTasks.length;

      // Обновляем позицию и колонку задачи
      updates.position = newPosition;
      updates.columnId = columnId;

      await this.tasksRepository.updateManyPositions(updatedOld);

      // Обновляем позиции в новой колонке, включая перемещённую задачу
      const updatedNew = [
        ...newTasks.slice(0, newPosition),
        { id, position: newPosition, columnId: newColumnId },
        ...newTasks.slice(newPosition),
      ].map((t, i) => ({ id: t.id, position: i, columnId: t.columnId }));

      await this.tasksRepository.updateManyPositions(updatedNew);
    } else if (position !== undefined) {
      // Если колонка та же, просто обновляем позиции внутри неё
      const tasks = await this.tasksRepository.findAll(oldColumnId, 'asc');
      const reordered = tasks
        .filter((t) => t.id !== id)
        .map((t) => ({ id: t.id, position: 0, columnId: oldColumnId }));


      reordered.splice(position, 0, { id, position, columnId: oldColumnId });

      const final = reordered.map((t, i) => ({ id: t.id, position: i, columnId: oldColumnId }));
      await this.tasksRepository.updateManyPositions(final);
    }

    return this.tasksRepository.update(id, updates);
  }
  async updateTaskPositions(
    tasks: { id: string; columnId: string; position: number }[],
  ) {
    // Группируем задачи по колонкам
    const groupedByColumn: Record<string, { id: string; position: number; columnId: string }[]> = {};

    for (const task of tasks) {
      if (!groupedByColumn[task.columnId]) {
        groupedByColumn[task.columnId] = [];
      }
      // Передаем columnId, чтобы обновить его вместе с позицией
      groupedByColumn[task.columnId].push({ id: task.id, position: task.position, columnId: task.columnId });
    }

    // Пересортируем задачи внутри каждой колонки по позиции
    for (const columnId in groupedByColumn) {
      const tasksInColumn = groupedByColumn[columnId]
        .sort((a, b) => a.position - b.position)
        .map((t, i) => ({ id: t.id, position: i, columnId: t.columnId }));

      // Обновляем задачи, передавая и позицию, и колонку
      await this.tasksRepository.updateManyPositions(tasksInColumn);
    }

    return { success: true };
  }


  async deleteTask(id: string) {
    return this.tasksRepository.delete(id);
  }
}
