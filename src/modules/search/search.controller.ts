import { Post, Body, Request, Controller } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseSchema } from './dto/search-response.schema';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Universal search across user entities',
    description:
      'Search in boards, columns, tasks with optional filters for entity types and time period',
  })
  @ApiResponse(SearchResponseSchema)
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async search(@Body() searchQueryRto: SearchQueryDto, @Request() req: any) {
    const userId = req.user.id;
    return this.searchService.universalSearch(userId, searchQueryRto);
  }
}
