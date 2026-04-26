import { BadRequestException } from '@nestjs/common';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class ValidationException extends BadRequestException {
  constructor(errors: ValidationError[], entity?: string) {
    super({
      message: 'Validation failed',
      entity,
      errors,
    });
  }
}

export function createValidationError(
  field: string,
  message: string,
  code: string,
  value?: any,
): ValidationError {
  return { field, message, code, value };
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isTodayOrPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

export function isPositiveInt(value: any): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isValidGender(gender: string): boolean {
  return ['Male', 'Female', 'M', 'F'].includes(gender);
}

export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}