import { IsEnum, IsString, IsOptional, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  TERMLY = 'TERMLY',
  YEARLY = 'YEARLY',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetSchoolMetricsDto {
  @ApiProperty({
    description: 'School ID',
    example: 'school-123',
  })
  @IsString()
  schoolId: string;

  @ApiProperty({
    description: 'Period type',
    enum: PeriodType,
    default: PeriodType.DAILY,
    required: false,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.DAILY;

  @ApiProperty({
    description: 'Period value (date string)',
    example: '2026-04-26',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  periodValue?: string;
}

export class GetZoneMetricsDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'North Zone',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    description: 'Period type',
    enum: PeriodType,
    default: PeriodType.MONTHLY,
    required: false,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.MONTHLY;

  @ApiProperty({
    description: 'Period value (date string)',
    example: '2026-04',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  periodValue?: string;
}

export class GetZoneRankingDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'North Zone',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    description: 'Period type',
    enum: PeriodType,
    default: PeriodType.MONTHLY,
    required: false,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.MONTHLY;

  @ApiProperty({
    description: 'Period value (date string)',
    example: '2026-04',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  periodValue?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

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
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort field',
    enum: ['score', 'attendanceRate', 'infrastructureScore'],
    example: 'score',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'score';

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    required: false,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}