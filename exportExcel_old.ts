import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Format sß╗æ tiß╗ün VN─É
export const formatVnd = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Format phß║ºn tr─âm
export const formatPct = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

// C├íc tß╗½ kh├│a x├íc ─æß╗ïnh cß╗Öt tiß╗ün
const MONEY_KEYWORDS = [
  'tiß╗ün', 'Tiß╗ün', 'doanh thu', 'Doanh thu', 'chi ph├¡', 'Chi ph├¡',
  'lß╗úi nhuß║¡n', 'Lß╗úi nhuß║¡n', 'gi├í', 'Gi├í', 'Gi├í trß╗ï', 'Sß╗æ tiß╗ün',
  'revenue', 'expense', 'profit', 'cash', 'cost', 'total', 'amount', 'price', 'value',
  'Sß╗æ l╞░ß╗úng', 'quantity', 'SL b├ín', 'Gi├í vß╗æn', '─É╞ín gi├í', 'Thß╗▒c thu', 'Ghi nhß║¡n'
];

// C├íc tß╗½ kh├│a x├íc ─æß╗ïnh cß╗Öt %
const PERCENT_KEYWORDS = ['%', 'tß╗╖ trß╗ìng', 'Tß╗╖ trß╗ìng', 'thay ─æß╗òi', 'Thay ─æß╗òi', 'Bi├¬n'];

// Kiß╗âm tra header c├│ phß║úi cß╗Öt tiß╗ün kh├┤ng
const isMoneyColumn = (header: string): boolean => {
  return MONEY_KEYWORDS.some(kw => header.toLowerCase().includes(kw.toLowerCase()));
};

// Kiß╗âm tra header c├│ phß║úi cß╗Öt % kh├┤ng
const isPercentColumn = (header: string): boolean => {
  return PERCENT_KEYWORDS.some(kw => header.includes(kw));
};

// Format worksheet
const formatWorksheet = (ws: XLSX.WorkSheet, data: any[], headers: string[]) => {
  // Format tß╗½ng cell
  data.forEach((row, rowIdx) => {
    headers.forEach((header, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      const cell = ws[cellRef];
      if (!cell) return;

      // Format cß╗Öt tiß╗ün
      if (isMoneyColumn(header) && typeof cell.v === 'number') {
        cell.z = '#,##0'; // Format: 1,000,000
      }

      // Format cß╗Öt % - giß╗» nguy├¬n text
      if (isPercentColumn(header) && typeof cell.v === 'string') {
        // Kh├┤ng cß║ºn format g├¼ th├¬m v├¼ ─æ├ú l├á string
      }
    });
  });

  // Set column widths
  const colWidths = headers.map((header) => {
    const maxContentWidth = data.reduce((max, row) => {
      const val = String(row[header] || '');
      return Math.max(max, val.length);
    }, header.length);
    return { wch: Math.min(maxContentWidth + 4, 40) };
  });
  ws['!cols'] = colWidths;

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
};

export const exportToExcel = (
  sheets: { name: string; data: any[]; headers?: string[] }[],
  fileName: string
) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data, headers }) => {
    if (data.length === 0) return;
    
    const actualHeaders = headers || Object.keys(data[0]);
    const ws = XLSX.utils.json_to_sheet(data, { header: actualHeaders });
    formatWorksheet(ws, data, actualHeaders);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};

// Helper: Tß║ío row tß╗òng cß╗Öng
export const createTotalRow = (label: string, data: any[], fields: string[]) => {
  const total: any = { [Object.keys(data[0])[0]]: label };
  fields.forEach(field => {
    total[field] = data.reduce((sum, row) => sum + (row[field] || 0), 0);
  });
  return total;
};

// Helper: Format data vß╗¢i % thay ─æß╗òi so vß╗¢i kß╗│ tr╞░ß╗¢c
export const formatWithChange = (
  current: number, 
  previous: number
): { value: number; change: number; formatted: string } => {
  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  return {
    value: current,
    change: Math.round(change * 10) / 10,
    formatted: `${formatVnd(current)} (${formatPct(Math.round(change * 10) / 10)})`,
  };
};
