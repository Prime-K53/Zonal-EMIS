// filepath: src/utils/excel.utils.ts
import ExcelJS from 'exceljs';

/**
 * Configuration options for Excel generation
 */
export interface ExcelExportOptions {
  /** Custom sheet name (default: 'Sheet1') */
  sheetName?: string;
  /** Title to add at the top of the spreadsheet */
  title?: string;
  /** Apply auto-fit to columns based on content (default: true) */
  autoFitColumns?: boolean;
  /** Apply filter dropdown to header row (default: true) */
  applyFilter?: boolean;
  /** Freeze the top row (header) (default: true) */
  freezeTopRow?: boolean;
  /** Apply zebra striping to data rows (default: true) */
  zebraStriping?: boolean;
  /** Header row styling options */
  headerStyle?: {
    bold?: boolean;
    fontColor?: string;
    backgroundColor?: string;
  };
  /** Padding to add to column width (default: 2) */
  padding?: number;
  /** Minimum column width (default: 10) */
  minColumnWidth?: number;
}

/**
 * Default export configuration
 */
const DEFAULT_OPTIONS: ExcelExportOptions = {
  sheetName: 'Sheet1',
  autoFitColumns: true,
  applyFilter: true,
  freezeTopRow: true,
  zebraStriping: true,
  headerStyle: {
    bold: true,
    fontColor: 'FFFFFF',
    backgroundColor: '1F4E78',
  },
  padding: 2,
  minColumnWidth: 10,
};

/**
 * Detect if a value is a numeric ID
 */
function isNumericId(value: unknown): boolean {
  if (typeof value === 'number' && !isNaN(value)) return true;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return true;
  return false;
}

/**
 * Detect if a value is a date string (YYYY-MM-DD format)
 */
function isDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Auto-fit columns based on content using the ExcelJS approach
 * This matches the implementation you provided:
 * 
 * worksheet.columns.forEach(column => {
 *   let maxColumnLength = 0;
 *   column.eachCell({ includeEmpty: true }, cell => {
 *     const columnLength = cell.value ? cell.value.toString().length : 10;
 *     if (columnLength > maxColumnLength) {
 *       maxColumnLength = columnLength;
 *     }
 *   });
 *   column.width = maxColumnLength < 10 ? 10 : maxColumnLength + 2;
 * });
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, padding: number, minWidth: number): void {
  worksheet.columns.forEach((column) => {
    let maxColumnLength = 0;

    // Iterate through each cell in the column, including empty cells
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxColumnLength) {
        maxColumnLength = columnLength;
      }
    });

    // Set column width with minimum of 10 and adding padding of 2
    column.width = maxColumnLength < minWidth ? minWidth : maxColumnLength + padding;
  });
}

/**
 * Apply zebra striping (alternate row shading) to data rows
 * Even rows get a light grey fill (#F2F2F2)
 */
function applyZebraStriping(
  worksheet: ExcelJS.Worksheet,
  dataRowCount: number,
  startRow: number,
  endRow: number
): void {
  const zebraFillColor = 'F2F2F2';

  for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const isEvenRow = rowNum % 2 === 0;

    if (isEvenRow) {
      row.eachCell((cell) => {
        // Only apply to data cells (not header)
        if (rowNum > startRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: zebraFillColor },
          };
        }
      });
    }
  }
}

/**
 * Format header row with professional styling
 * Bold font, white text, dark blue background (#1F4E78)
 */
function styleHeaderRow(
  worksheet: ExcelJS.Worksheet,
  columnCount: number,
  rowNumber: number
): void {
  const headerFillColor = '1F4E78';

  for (let colNum = 1; colNum <= columnCount; colNum++) {
    const cell = worksheet.getCell(rowNumber, colNum);

    // Apply bold font
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }, // White text
    };

    // Apply dark blue background
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerFillColor },
    };

    // Apply alignment: vertical middle, horizontal left
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };
  }
}

/**
 * Apply alignment to all data cells
 * Vertical: middle, Horizontal: left
 */
function applyDataAlignment(worksheet: ExcelJS.Worksheet, dataRowCount: number, headerRow: number): void {
  for (let rowNum = headerRow + 1; rowNum <= headerRow + dataRowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    row.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };
  }
}

/**
 * Format dates as YYYY-MM-DD and ensure numeric IDs are numbers
 */
function formatDataTypes(
  worksheet: ExcelJS.Worksheet,
  data: Record<string, unknown>[],
  headerRow: number
): void {
  const headers = Object.keys(data[0] || {});

  data.forEach((row, rowIndex) => {
    const excelRow = rowIndex + headerRow + 1;

    headers.forEach((header, colIndex) => {
      const colNum = colIndex + 1;
      const cell = worksheet.getCell(excelRow, colNum);
      const value = row[header];

      // Format dates as YYYY-MM-DD
      if (isDateString(value)) {
        const dateValue = new Date(value as string);
        if (!isNaN(dateValue.getTime())) {
          cell.value = dateValue;
          cell.numFmt = 'yyyy-mm-dd'; // Format as YYYY-MM-DD
        }
      }
      // Ensure numeric IDs are stored as numbers
      else if (isNumericId(value) && typeof value === 'string') {
        cell.value = parseInt(value, 10);
      }
    });
  });
}

/**
 * Generate a standardized Excel file with professional styling
 *
 * @param data - Array of objects to export
 * @param fileName - Output file name (e.g., 'schools.xlsx')
 * @param options - Export configuration options
 * @returns Promise<void>
 *
 * Features:
 * - Auto-fit columns (width calculated from longest string + padding of 2)
 * - Filter & Sort (native Excel autoFilter on header row)
 * - Freeze top row (header stays visible while scrolling)
 * - Professional header styling (bold, white text, dark blue #1F4E78)
 * - Zebra striping (light grey #F2F2F2 for even rows)
 * - Middle/left alignment for all cells
 * - Numeric IDs as numbers, dates formatted as YYYY-MM-DD
 *
 * @example
 * const schools = [
 *   { id: 1, name: 'School A', enrollment: 500, established: '1990-01-15' },
 *   { id: 2, name: 'School B', enrollment: 750, established: '1985-06-20' },
 * ];
 * await generateStandardExcel(schools, 'schools.xlsx');
 */
export async function generateStandardExcel<T extends Record<string, unknown>>(
  data: T[],
  fileName: string,
  options: ExcelExportOptions = DEFAULT_OPTIONS
): Promise<void> {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(opts.sheetName);

  // Add title row if specified
  let headerRowNumber = 1;
  if (opts.title) {
    const titleRow = worksheet.addRow([opts.title]);
    titleRow.getCell(1).font = { bold: true, size: 14 };
    worksheet.mergeCells(1, 1, 1, Object.keys(data[0] || {}).length);
    headerRowNumber = 2;
  }

  // Add data with headers
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => row[header]);
    worksheet.addRow(values);
  });

  const dataRowCount = data.length;
  const totalRows = headerRowNumber + dataRowCount;
  const columnCount = headers.length;

  // Apply auto-fit columns using the ExcelJS approach
  if (opts.autoFitColumns) {
    autoFitColumns(worksheet, opts.padding || 2, opts.minColumnWidth || 10);
  }

  // Apply autoFilter to header row for Hover Menu (sorting/filtering)
  if (opts.applyFilter) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnCount },
    };
  }

  // Freeze top row (header stays visible while scrolling)
  if (opts.freezeTopRow) {
    worksheet.views.push({
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
    });
  }

  // Style header row with professional styling (bold, white text, dark blue background)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Apply zebra striping to data rows (skip title row if present)
  if (opts.zebraStriping) {
    applyZebraStriping(worksheet, dataRowCount, headerRowNumber, totalRows);
  }

  // Apply alignment to all cells
  applyDataAlignment(worksheet, dataRowCount, headerRowNumber);

  // Format data types (numeric IDs as numbers, dates as YYYY-MM-DD)
  formatDataTypes(worksheet, data, headerRowNumber);

  // Write to file
  await workbook.xlsx.writeFile(fileName);
}

/**
 * Generate Excel file and return as buffer
 * Useful for API responses or downloads
 */
export async function generateStandardExcelBuffer<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions = DEFAULT_OPTIONS
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(opts.sheetName);

  let headerRowNumber = 1;
  if (opts.title) {
    const titleRow = worksheet.addRow([opts.title]);
    titleRow.getCell(1).font = { bold: true, size: 14 };
    worksheet.mergeCells(1, 1, 1, Object.keys(data[0] || {}).length);
    headerRowNumber = 2;
  }

  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);

  data.forEach((row) => {
    const values = headers.map((header) => row[header]);
    worksheet.addRow(values);
  });

  const dataRowCount = data.length;
  const totalRows = headerRowNumber + dataRowCount;
  const columnCount = headers.length;

  if (opts.autoFitColumns) {
    autoFitColumns(worksheet, opts.padding || 2, opts.minColumnWidth || 10);
  }

  if (opts.applyFilter) {
    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: columnCount },
    };
  }

  if (opts.freezeTopRow) {
    worksheet.views.push({
      state: 'frozen',
      xSplit: 0,
      ySplit: headerRowNumber,
    });
  }

  styleHeaderRow(worksheet, columnCount, headerRowNumber);

  if (opts.zebraStriping) {
    applyZebraStriping(worksheet, dataRowCount, headerRowNumber, totalRows);
  }

  applyDataAlignment(worksheet, dataRowCount, headerRowNumber);
  formatDataTypes(worksheet, data, headerRowNumber);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}