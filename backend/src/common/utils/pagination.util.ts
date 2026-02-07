import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationDto, PaginatedResponse } from '../dto/pagination.dto';

export async function paginate<T>(
  repository: Repository<T>,
  paginationDto: PaginationDto,
  options?: {
    relations?: string[];
    where?: any;
    order?: any;
  },
): Promise<PaginatedResponse<T>> {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, total] = await repository.findAndCount({
    ...options,
    skip,
    take: limit,
  });

  return new PaginatedResponse(data, total, page, limit);
}

export async function paginateQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  paginationDto: PaginationDto,
): Promise<PaginatedResponse<T>> {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  queryBuilder.skip(skip).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  return new PaginatedResponse(data, total, page, limit);
}
