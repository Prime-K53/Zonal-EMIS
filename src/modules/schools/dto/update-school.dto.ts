// src/modules/schools/dto/update-school.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateSchoolDto } from './create-school.dto';

export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {}
