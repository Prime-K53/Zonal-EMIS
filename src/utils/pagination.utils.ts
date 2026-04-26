import { IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationOptions {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({
    description: 'Sort field',
    example: 'name',
    required: false,
  })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    required: false,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}

export class PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

export class PaginatedResponse<T> {
  success: boolean;
  data: PaginatedResult<T>;
  timestamp: string;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.success = true;
    this.data = new PaginatedResult(data, total, page, limit);
    this.timestamp = new Date().toISOString();
  }
}

export function applyPagination<T>(
  data: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return new PaginatedResult(paginatedData, data.length, page, limit);
}

export function applySorting<T>(
  data: T[],
  sortBy: string,
  sortOrder: SortOrder,
): T[] {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortBy as keyof T];
    const bValue = b[sortBy as keyof T];

    if (aValue === undefined || bValue === undefined) {
      return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === SortOrder.ASC 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === SortOrder.ASC 
        ? aValue - bValue
        : bValue - aValue;
    }

    return 0;
  });
}

export function applyFilter<T>(
  data: T[],
  filters: Record<string, any>,
): T[] {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }

      const itemValue = item[key as keyof T];
      
      if (typeof value === 'string') {
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }

      return itemValue === value;
    });
  });
}

export function applySearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: string[],
): T[] {
  if (!searchTerm) return data;

  const term = searchTerm.toLowerCase();
  
  return data.filter(item => {
    return searchFields.some(field => {
      const value = item[field as keyof T];
      return value && String(value).toLowerCase().includes(term);
    });
  });
}