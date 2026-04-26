// src/modules/schools/dto/create-school.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  emisCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ownership: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  yearEstablished?: number;

  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  tdc: string;

  @ApiProperty()
  @IsString()
  traditionalAuthority: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasElectricity?: boolean;
}
