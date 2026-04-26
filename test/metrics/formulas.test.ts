import {
  calculateAttendanceRate,
  calculateGenderRatio,
  calculateGrowthRate,
  calculateStudentTeacherRatio,
  calculateQualifiedRate,
  calculateInfrastructureScore,
  formatPercentage,
  formatRatio,
} from '../../src/services/metrics/formulas';

describe('Metrics Formulas', () => {
  describe('calculateAttendanceRate', () => {
    it('should calculate attendance rate correctly', () => {
      const rate = calculateAttendanceRate(85, 15);
      expect(rate).toBe(85);
    });

    it('should handle zero total attendance', () => {
      const rate = calculateAttendanceRate(0, 0);
      expect(rate).toBe(0);
    });

    it('should handle partial attendance', () => {
      const rate = calculateAttendanceRate(50, 50);
      expect(rate).toBe(50);
    });
  });

  describe('calculateGenderRatio', () => {
    it('should calculate gender ratio correctly', () => {
      const ratio = calculateGenderRatio(100, 80);
      expect(ratio).toBe(1.25);
    });

    it('should handle zero female students', () => {
      const ratio = calculateGenderRatio(50, 0);
      expect(ratio).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero male students', () => {
      const ratio = calculateGenderRatio(0, 50);
      expect(ratio).toBe(0);
    });

    it('should handle zero students', () => {
      const ratio = calculateGenderRatio(0, 0);
      expect(ratio).toBe(0);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate growth rate correctly', () => {
      const rate = calculateGrowthRate(120, 100);
      expect(rate).toBe(20);
    });

    it('should handle zero previous value', () => {
      const rate = calculateGrowthRate(100, 0);
      expect(rate).toBe(100);
    });

    it('should handle no growth', () => {
      const rate = calculateGrowthRate(100, 100);
      expect(rate).toBe(0);
    });

    it('should handle negative growth', () => {
      const rate = calculateGrowthRate(80, 100);
      expect(rate).toBe(-20);
    });
  });

  describe('calculateStudentTeacherRatio', () => {
    it('should calculate student-teacher ratio correctly', () => {
      const ratio = calculateStudentTeacherRatio(200, 10);
      expect(ratio).toBe(20);
    });

    it('should handle zero teachers', () => {
      const ratio = calculateStudentTeacherRatio(100, 0);
      expect(ratio).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero students', () => {
      const ratio = calculateStudentTeacherRatio(0, 10);
      expect(ratio).toBe(0);
    });
  });

  describe('calculateQualifiedRate', () => {
    it('should calculate qualified teacher rate correctly', () => {
      const rate = calculateQualifiedRate(8, 10);
      expect(rate).toBe(80);
    });

    it('should handle zero total teachers', () => {
      const rate = calculateQualifiedRate(0, 0);
      expect(rate).toBe(0);
    });

    it('should handle all qualified teachers', () => {
      const rate = calculateQualifiedRate(10, 10);
      expect(rate).toBe(100);
    });

    it('should handle no qualified teachers', () => {
      const rate = calculateQualifiedRate(0, 10);
      expect(rate).toBe(0);
    });
  });

  describe('calculateInfrastructureScore', () => {
    it('should calculate infrastructure score correctly', () => {
      const score = calculateInfrastructureScore(true, true, 4, 3, 100);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle missing electricity', () => {
      const score = calculateInfrastructureScore(false, true, 4, 3, 100);
      expect(score).toBeLessThan(100);
    });

    it('should handle missing water', () => {
      const score = calculateInfrastructureScore(true, false, 4, 3, 100);
      expect(score).toBeLessThan(100);
    });

    it('should handle zero classrooms', () => {
      const score = calculateInfrastructureScore(true, true, 0, 3, 100);
      expect(score).toBeLessThan(100);
    });

    it('should handle zero toilets', () => {
      const score = calculateInfrastructureScore(true, true, 4, 0, 100);
      expect(score).toBeLessThan(100);
    });

    it('should handle zero students', () => {
      const score = calculateInfrastructureScore(true, true, 4, 3, 0);
      expect(score).toBeGreaterThan(0);
    });

    it('should handle perfect infrastructure', () => {
      const score = calculateInfrastructureScore(true, true, 5, 4, 100);
      expect(score).toBe(100);
    });

    it('should handle poor infrastructure', () => {
      const score = calculateInfrastructureScore(false, false, 1, 1, 100);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(85.5)).toBe('85.5%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('should handle infinite values', () => {
      expect(formatPercentage(Infinity)).toBe('N/A');
      expect(formatPercentage(-Infinity)).toBe('N/A');
    });
  });

  describe('formatRatio', () => {
    it('should format ratio correctly', () => {
      expect(formatRatio(1.25)).toBe('1.25');
      expect(formatRatio(0)).toBe('0.00');
      expect(formatRatio(100)).toBe('100.00');
    });

    it('should handle infinite values', () => {
      expect(formatRatio(Infinity)).toBe('N/A');
      expect(formatRatio(-Infinity)).toBe('N/A');
    });

    it('should handle MAX_SAFE_INTEGER', () => {
      expect(formatRatio(Number.MAX_SAFE_INTEGER)).toBe('N/A (no denominator)');
    });
  });
});