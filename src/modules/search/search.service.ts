import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResult {
  boards: any[];
  columns: any[];
  tasks: any[];
  totalCount: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  private getDateFromPeriod(period: number): Date {
    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setDate(now.getDate() - period);
    return dateFrom;
  }

  async universalSearch(
    userId: string,
    searchQuery: SearchQueryDto,
  ): Promise<SearchResult> {
    const { query, searchIn, period, searchInFields } = searchQuery;

    const dateFrom = period ? this.getDateFromPeriod(period) : null;

    const searchInEntities =
      searchIn && searchIn.length > 0
        ? searchIn
        : ['boards', 'columns', 'tasks'];

    const results: SearchResult = {
      boards: [],
      columns: [],
      tasks: [],
      totalCount: 0,
    };

    const searchPromises: Promise<any>[] = [];

    if (searchInEntities.includes('boards')) {
      searchPromises.push(
        this.searchRepository.searchBoards(userId, query, dateFrom),
      );
    }

    if (searchInEntities.includes('columns')) {
      searchPromises.push(
        this.searchRepository.searchColumns(userId, query, dateFrom),
      );
    }

    if (searchInEntities.includes('tasks')) {
      searchPromises.push(
        this.searchRepository.searchTasks(userId, query, searchInFields || ['tasks'], dateFrom),
      );
    }

    const searchResults = await Promise.all(searchPromises);

    // Присвоюємо результати відповідно до порядку виконання
    let resultIndex = 0;
    if (searchInEntities.includes('boards')) {
      results.boards = searchResults[resultIndex++];
    }
    if (searchInEntities.includes('columns')) {
      results.columns = searchResults[resultIndex++];
    }
    if (searchInEntities.includes('tasks')) {
      results.tasks = searchResults[resultIndex++];
    }

    results.totalCount =
      results.boards.length + results.columns.length + results.tasks.length;

    return results;
  }
}
