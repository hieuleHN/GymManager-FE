import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Format số tiền VNĐ
export const formatVnd = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Format phần trăm
export const formatPct = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

// Các từ khóa xác định cột tiền
const MONEY_KEYWORDS = [
  'tiền', 'Tiền', 'doanh thu', 'Doanh thu', 'chi phí', 'Chi phí',
  'lợi nhuận', 'Lợi nhuận', 'giá', 'Giá', 'Giá trị', 'Số tiền',
  'revenue', 'expense', 'profit', 'cash', 'cost', 'total', 'amount', 'price', 'value',
  'Số lượng', 'quantity', 'SL bán', 'Giá vốn', 'Đơn giá', 'Thực thu', 'Ghi nhận'
];

// Các từ khóa xác định cột %
const PERCENT_KEYWORDS = ['%', 'tỷ trọng', 'Tỷ trọng', 'thay đổi', 'Thay đổi', 'Biên'];

// Kiểm tra header có phải cột tiền không
const isMoneyColumn = (header: string): boolean => {
  return MONEY_KEYWORDS.some(kw => header.toLowerCase().includes(kw.toLowerCase()));
};

// Kiểm tra header có phải cột % không
const isPercentColumn = (header: string): boolean => {
  return PERCENT_KEYWORDS.some(kw => header.includes(kw));
};

// Format worksheet
const formatWorksheet = (ws: XLSX.WorkSheet, data: any[], headers: string[]) => {
  // Format từng cell
  data.forEach((row, rowIdx) => {
    headers.forEach((header, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      const cell = ws[cellRef];
      if (!cell) return;

      // Format cột tiền
      if (isMoneyColumn(header) && typeof cell.v === 'number') {
        cell.z = '#,##0'; // Format: 1,000,000
      }

      // Format cột % - giữ nguyên text
      if (isPercentColumn(header) && typeof cell.v === 'string') {
        // Không cần format gì thêm vì đã là string
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

// Helper: Tạo row tổng cộng
export const createTotalRow = (label: string, data: any[], fields: string[]) => {
  const total: any = { [Object.keys(data[0])[0]]: label };
  fields.forEach(field => {
    total[field] = data.reduce((sum, row) => sum + (row[field] || 0), 0);
  });
  return total;
};

// Helper: Format data với % thay đổi so với kỳ trước
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
