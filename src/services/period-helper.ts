export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TERMLY' | 'YEARLY';

export type ModuleType = 'attendance' | 'enrollment' | 'activities' | 'assessments' | 'teachers' | 'resources';

export interface PeriodInfo {
  type: PeriodType;
  value: string;
  startDate: Date;
  endDate: Date;
}

export interface DataChangedEvent {
  schoolId: string;
  zone: string;
  module: ModuleType;
  date: Date;
  action: 'create' | 'update' | 'delete';
}

export const PERIOD_EVENT = 'data.changed';

export function getDateFromString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export class PeriodHelper {
  static getDailyPeriod(date: Date): PeriodInfo {
    const d = new Date(date);
    return {
      type: 'DAILY',
      value: d.toISOString().split('T')[0],
      startDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      endDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    };
  }

  static getWeeklyPeriod(date: Date): PeriodInfo {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    const weekNum = this.getWeekNumber(d);
    
    return {
      type: 'WEEKLY',
      value: `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`,
      startDate: monday,
      endDate: sunday,
    };
  }

  static getMonthlyPeriod(date: Date): PeriodInfo {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    return {
      type: 'MONTHLY',
      value: `${year}-${(month + 1).toString().padStart(2, '0')}`,
      startDate,
      endDate,
    };
  }

  static getTermlyPeriod(date: Date): PeriodInfo {
    const d = new Date(date);
    const month = d.getMonth();
    let termNum: number;
    
    if (month >= 0 && month <= 4) termNum = 1;
    else if (month >= 5 && month <= 8) termNum = 2;
    else termNum = 3;
    
    return {
      type: 'TERMLY',
      value: `${d.getFullYear()}-T${termNum}`,
      startDate: new Date(d.getFullYear(), termNum === 1 ? 0 : termNum === 2 ? 5 : 9, 1),
      endDate: new Date(d.getFullYear(), termNum === 1 ? 4 : termNum === 2 ? 8 : 11, 31),
    };
  }

  static getYearlyPeriod(date: Date): PeriodInfo {
    const d = new Date(date);
    const year = d.getFullYear();
    
    return {
      type: 'YEARLY',
      value: `${year}`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }

  static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  static getAllPeriods(date: Date): PeriodInfo[] {
    return [
      this.getDailyPeriod(date),
      this.getWeeklyPeriod(date),
      this.getMonthlyPeriod(date),
      this.getTermlyPeriod(date),
      this.getYearlyPeriod(date),
    ];
  }

  static getPeriodValue(type: PeriodType, date: Date): string {
    switch (type) {
      case 'DAILY': return this.getDailyPeriod(date).value;
      case 'WEEKLY': return this.getWeeklyPeriod(date).value;
      case 'MONTHLY': return this.getMonthlyPeriod(date).value;
      case 'TERMLY': return this.getTermlyPeriod(date).value;
      case 'YEARLY': return this.getYearlyPeriod(date).value;
    }
  }
}