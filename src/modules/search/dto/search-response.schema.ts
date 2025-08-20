import { ApiResponseOptions } from '@nestjs/swagger';

export const SearchResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Search results',
  schema: {
    type: 'object',
    properties: {
      boards: {
        type: 'array',
        items: { type: 'object' },
      },
      columns: {
        type: 'array',
        items: { type: 'object' },
      },
      tasks: {
        type: 'array',
        items: { type: 'object' },
      },
      totalCount: { type: 'number' },
    },
  },
};
