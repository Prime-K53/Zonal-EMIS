// src/modules/learners/dto/create-learner.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLearnerDto {
  @ApiProperty({ description: 'ID of the school' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '2010-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ example: 'Standard 4' })
  @IsString()
  @IsNotEmpty()
  standard: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isSNE?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guardianPhone?: string;
}
