import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function addTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

function addDataRow(ws: ExcelJS.Worksheet, row: number, values: any[], moneyCols: number[] = []) {
  values.forEach((v, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = v;
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
    if (moneyCols.includes(i) && typeof v === 'number') {
      cell.numFmt = '#,##0';
    }
  });
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

function addTotalRow(ws: ExcelJS.Worksheet, row: number, values: any[], moneyCols: number[] = []) {
  values.forEach((v, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = v;
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
    if (moneyCols.includes(i) && typeof v === 'number') {
      cell.numFmt = '#,##0';
    }
  });
}

// ============ EXPORT TÀI CHÍNH ============
export async function exportFinanceExcel(
  data: any,
  periodLabel: string,
  fileName: string,
  chartImages?: { name: string; dataUrl: string }[],
  clubName?: string
) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const s = data?.summary || {};
  const cashFlow = data?.cashFlowData || [];
  const profit = data?.profitData || [];
  const expense = data?.expenseStructure || [];
  const topProducts = data?.topProducts || [];
  const depreciation = data?.depreciationDetail || [];

  // ── Sheet 1: Tổng quan ──
  const ws1 = wb.addWorksheet('Tổng quan');
  ws1.mergeCells('A1:D1');
  ws1.getCell('A1').value = `BÁO CÁO TÀI CHÍNH — ${periodLabel}`;
  ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  ws1.getCell('A1').alignment = { horizontal: 'center' };

  ws1.mergeCells('A2:D2');
  const clubLine = clubName && clubName !== 'Tất cả câu lạc bộ' ? `Cơ sở: ${clubName} | ` : '';
  ws1.getCell('A2').value = `${clubLine}Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  addTableHeader(ws1, 4, ['Chỉ số', 'Giá trị', 'Thay đổi (%)', 'Xu hướng']);
  const summaryData = [
    ['Doanh thu thực thu', s.realCashIn, s.change?.realCashIn, (s.change?.realCashIn ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Doanh thu ghi nhận', s.accrualRevenue, s.change?.accrualRevenue, (s.change?.accrualRevenue ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Dòng tiền ròng (tích lũy)', s.netCashFlow ?? 0, '', ''],
    ['Tổng chi phí', s.totalExpense, s.change?.totalExpense, (s.change?.totalExpense ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Lợi nhuận', s.totalProfit, s.change?.totalProfit, (s.change?.totalProfit ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
  ];
  summaryData.forEach((r, i) => {
    addDataRow(ws1, 5 + i, r, [1]);
    if (typeof r[2] === 'number') {
      ws1.getCell(5 + i, 3).value = `${r[2] > 0 ? '+' : ''}${r[2]}%`;
    }
  });
  addDataRow(ws1, 10, ['Biên lợi nhuận', `${s.profitMargin || 0}%`, '', '']);
  ws1.getCell(10, 1).font = { bold: true };
  setColWidths(ws1, [25, 20, 15, 12]);

  // ── Sheet 2: Dòng tiền & Doanh thu chi tiết ──
  const ws2 = wb.addWorksheet('Dòng tiền & Doanh thu');
  ws2.mergeCells('A1:F1');
  ws2.getCell('A1').value = 'Dòng tiền thực thu vs Doanh thu ghi nhận';
  ws2.getCell('A1').font = { bold: true, size: 13 };

  // Bảng dòng tiền bên trái (A-C)
  addTableHeader(ws2, 3, ['Tháng', 'DT thực thu', 'DT ghi nhận']);
  cashFlow.forEach((cf: any, i: number) => {
    addDataRow(ws2, 4 + i, [cf.month, cf.cash, cf.revenue], [1, 2]);
  });
  if (cashFlow.length > 0) {
    const tRow = 4 + cashFlow.length;
    const totals = cashFlow.reduce((a: any, cf: any) => {
      return { cash: a.cash + (cf.cash || 0), rev: a.rev + (cf.revenue || 0) };
    }, { cash: 0, rev: 0 });
    addTotalRow(ws2, tRow, ['TỔNG CỘNG', totals.cash, totals.rev], [1, 2]);
  }

  // Bảng doanh thu chi tiết bên phải (E-I)
  const revenueDetails = data?.revenueDetails || [];
  const detailStartCol = 5; // cột E
  ws2.getCell(3, detailStartCol).value = 'Loại dịch vụ';
  ws2.getCell(3, detailStartCol + 1).value = 'Tên';
  ws2.getCell(3, detailStartCol + 2).value = 'Khách hàng';
  ws2.getCell(3, detailStartCol + 3).value = 'Số tiền';
  ws2.getCell(3, detailStartCol + 4).value = 'Ngày';
  for (let c = detailStartCol; c <= detailStartCol + 4; c++) {
    const cell = ws2.getCell(3, c);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  revenueDetails.forEach((rd: any, i: number) => {
    const dateStr = rd.date ? new Date(rd.date).toLocaleDateString('vi-VN') : '';
    const row = 4 + i;
    const vals = [rd.type, rd.name, rd.customerName || '', rd.amount, dateStr];
    vals.forEach((v, ci) => {
      const cell = ws2.getCell(row, detailStartCol + ci);
      cell.value = v;
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
      if (ci === 3 && typeof v === 'number') cell.numFmt = '#,##0';
    });
  });
  if (revenueDetails.length > 0) {
    const totalRev = revenueDetails.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const tRow = 4 + revenueDetails.length;
    ['TỔNG CỘNG', '', '', totalRev, ''].forEach((v, ci) => {
      const cell = ws2.getCell(tRow, detailStartCol + ci);
      cell.value = v;
      cell.font = { bold: true };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
      if (ci === 3 && typeof v === 'number') cell.numFmt = '#,##0';
    });
  }

  setColWidths(ws2, [12, 18, 18, 4, 25, 22, 20, 18, 15]);

  // ── Sheet 3: Chi phí & Lợi nhuận ──
  const ws3 = wb.addWorksheet('Chi phí & Lợi nhuận');
  ws3.mergeCells('A1:H1');
  ws3.getCell('A1').value = 'Chi phí & Lợi nhuận theo tháng';
  ws3.getCell('A1').font = { bold: true, size: 13 };

  // Bảng bên trái (A-D): Chi phí, DT ghi nhận, Lợi nhuận theo tháng
  addTableHeader(ws3, 3, ['Tháng', 'DT ghi nhận', 'Chi phí', 'Lợi nhuận']);
  profit.forEach((p: any, i: number) => {
    addDataRow(ws3, 4 + i, [p.month, p.revenue, p.expense, p.profit], [1, 2]);
  });
  if (profit.length > 0) {
    const tRow = 4 + profit.length;
    const pt = profit.reduce((a: any, p: any) => ({ r: a.r + (p.revenue || 0), e: a.e + p.expense, p: a.p + p.profit }), { r: 0, e: 0, p: 0 });
    addTotalRow(ws3, tRow, ['TỔNG CỘNG', pt.r, pt.e, pt.p], [1, 2]);
  }

  // Bảng bên phải (F-H): Cơ cấu chi phí
  const expDetailStartCol = 6;
  ws3.getCell(3, expDetailStartCol).value = 'Loại chi phí';
  ws3.getCell(3, expDetailStartCol + 1).value = 'Số tiền';
  ws3.getCell(3, expDetailStartCol + 2).value = 'Tỷ trọng (%)';
  for (let c = expDetailStartCol; c <= expDetailStartCol + 2; c++) {
    const cell = ws3.getCell(3, c);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  const totalExp = expense.reduce((sum: number, e: any) => sum + e.value, 0);
  expense.forEach((e: any, i: number) => {
    const row = 4 + i;
    [e.name, e.value, totalExp > 0 ? Math.round((e.value / totalExp) * 100) : 0].forEach((v, ci) => {
      const cell = ws3.getCell(row, expDetailStartCol + ci);
      cell.value = v;
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
      if (ci === 1 && typeof v === 'number') cell.numFmt = '#,##0';
    });
  });
  if (expense.length > 0) {
    const tRow = 4 + expense.length;
    ['TỔNG CỘNG', totalExp, 100].forEach((v, ci) => {
      const cell = ws3.getCell(tRow, expDetailStartCol + ci);
      cell.value = v;
      cell.font = { bold: true };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
      if (ci === 1 && typeof v === 'number') cell.numFmt = '#,##0';
    });
  }

  setColWidths(ws3, [12, 18, 18, 4, 22, 18, 15]);

  // ── Sheet 4: Doanh số gói & Tỉ lệ tham gia + Top sản phẩm ──
  const participation = data?.participation || [];
  const hasParticipation = participation.length > 0;
  const hasTopProducts = topProducts.length > 0;
  if (hasParticipation || hasTopProducts) {
    const ws4 = wb.addWorksheet('Doanh số gói & Tỉ lệ tham gia');
    ws4.mergeCells('A1:L1');
    ws4.getCell('A1').value = 'Doanh số gói tập, Tỉ lệ tham gia & Top sản phẩm';
    ws4.getCell('A1').font = { bold: true, size: 13 };

    // Bảng bên trái (A-E): Doanh số gói
    addTableHeader(ws4, 3, ['Gói tập', 'Đã bán', 'Doanh thu', 'TB phiên/người', 'Tỉ lệ tham gia (%)']);
    participation.forEach((p: any, i: number) => {
      const avgSessions = p.participation || 0;
      const participationRate = Math.min(100, Math.round(avgSessions / 20 * 100));
      addDataRow(ws4, 4 + i, [p.package, p.sales, p.revenue, avgSessions, participationRate], [2]);
    });
    if (hasParticipation) {
      const tRow = 4 + participation.length;
      const totals = participation.reduce((a: any, p: any) => ({
        sales: a.sales + (p.sales || 0),
        revenue: a.revenue + (p.revenue || 0),
      }), { sales: 0, revenue: 0 });
      addTotalRow(ws4, tRow, ['TỔNG CỘNG', totals.sales, totals.revenue, '', ''], [2]);
    }

    // Bảng bên phải (G-L): Top sản phẩm
    const topStartCol = 7;
    ws4.getCell(3, topStartCol).value = 'Sản phẩm';
    ws4.getCell(3, topStartCol + 1).value = 'Đơn giá';
    ws4.getCell(3, topStartCol + 2).value = 'Giá vốn';
    ws4.getCell(3, topStartCol + 3).value = 'SL bán';
    ws4.getCell(3, topStartCol + 4).value = 'Doanh thu';
    ws4.getCell(3, topStartCol + 5).value = 'Lợi nhuận';
    for (let c = topStartCol; c <= topStartCol + 5; c++) {
      const cell = ws4.getCell(3, c);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    topProducts.forEach((p: any, i: number) => {
      const row = 4 + i;
      [p.name, p.price, p.costPrice, p.quantity, p.revenue, p.profit].forEach((v, ci) => {
        const cell = ws4.getCell(row, topStartCol + ci);
        cell.value = v;
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
        if ([1, 2, 4, 5].includes(ci) && typeof v === 'number') cell.numFmt = '#,##0';
      });
    });

    setColWidths(ws4, [22, 12, 18, 16, 18, 4, 18, 15, 15, 10, 18, 18]);
  }

  // ── Sheet 5: Khấu hao ──
  if (depreciation.length > 0) {
    const ws5 = wb.addWorksheet('Khấu hao thiết bị');
    ws5.mergeCells('A1:F1');
    ws5.getCell('A1').value = 'Chi tiết khấu hao thiết bị';
    ws5.getCell('A1').font = { bold: true, size: 13 };

    addTableHeader(ws5, 3, ['Thiết bị', 'Nguyên giá', 'KH/tháng', 'Tháng đã dùng', 'Đã khấu hao', 'Giá trị còn lại']);
    depreciation.forEach((d: any, i: number) => {
      addDataRow(ws5, 4 + i, [d.name, d.total, d.monthlyDepreciation, d.monthsActive, d.totalDepreciated, d.remainingValue], [1, 2, 4, 5]);
    });
    setColWidths(ws5, [20, 16, 16, 15, 16, 16]);
  }

  // ── Sheet 7: Biểu đồ (nhúng hình PNG) ──
  if (chartImages && chartImages.length > 0) {
    const wsChart = wb.addWorksheet('Biểu đồ');
    wsChart.mergeCells('A1:N1');
    wsChart.getCell('A1').value = 'BIỂU ĐỒ TÀI CHÍNH';
    wsChart.getCell('A1').font = { bold: true, size: 14 };
    wsChart.getCell('A1').alignment = { horizontal: 'center' };

    let currentRow = 3;
    for (const img of chartImages) {
      // Title cho từng biểu đồ
      wsChart.getCell(`A${currentRow}`).value = img.name;
      wsChart.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
      currentRow++;

      try {
        // Extract base64 from dataURL: "data:image/png;base64,XXXX" → "XXXX"
        const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');

        const imageId = wb.addImage({
          base64,
          extension: 'png',
        });

        // Size: 600px width → ~450pt (1pt ≈ 1.33px)
        const widthPt = 580;
        const heightPt = 300;
        wsChart.addImage(imageId, {
          tl: { col: 0, row: currentRow },
          ext: { width: widthPt, height: heightPt },
        });

        currentRow += Math.ceil(heightPt / 18) + 2; // ~18pt per row
      } catch {
        wsChart.getCell(`A${currentRow}`).value = `(Không thể tải biểu đồ: ${img.name})`;
        wsChart.getCell(`A${currentRow}`).font = { color: { argb: 'FFEF4444' } };
        currentRow += 2;
      }
    }
    setColWidths(wsChart, [80]);
  }

  // ── Xuất file ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

// ============ EXPORT HOẠT ĐỘNG ============
export async function exportActivityExcel(
  data: any,
  periodLabel: string,
  fileName: string,
  details?: {
    monthly?: any[];
    checkin?: any[];
    sports?: any[];
    trainers?: any[];
    periodData?: Record<string, any>;
  },
  chartImages?: { name: string; dataUrl: string }[]
) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const s = data?.summary || {};
  const growth = data?.customerGrowth || [];
  const sports = data?.sportDistribution || [];
  const checkins = data?.checkInOfWeek || [];
  const trainers = data?.trainerPerformance || [];
  const bookingStats = data?.bookingStats || { today: 0, month: 0, year: 0 };
  const periodData = details?.periodData || {};
  const monthly = details?.monthly || [];
  const checkin = details?.checkin || [];
  const sportDetails = details?.sports || [];
  const trainerDetails = details?.trainers || [];

  const PERIOD_LABELS: Record<string, string> = { week: 'Tuần này', month: 'Tháng này', quarter: 'Quý này', year: 'Năm nay' };

  // ── Sheet 1: Tổng quan ──
  const ws1 = wb.addWorksheet('Tổng quan');
  ws1.mergeCells('A1:E1');
  ws1.getCell('A1').value = `BÁO CÁO HOẠT ĐỘNG — ${periodLabel}`;
  ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  ws1.getCell('A1').alignment = { horizontal: 'center' };

  ws1.mergeCells('A2:E2');
  ws1.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  addTableHeader(ws1, 4, ['Chỉ số', 'Giá trị kỳ hiện tại', 'Hôm nay', 'Tháng này', 'Năm nay']);
  const metricRows = [
    ['Lượng Đặt lịch HLV', s.totalBookings ?? 0, bookingStats.today, bookingStats.month, bookingStats.year],
    ['Hội viên mới', s.totalNewCustomers ?? 0, '', '', ''],
    ['Lượt điểm danh', s.totalCheckins ?? 0, '', '', ''],
    ['Ca dạy HLV', s.totalTrainerSessions ?? 0, '', '', ''],
  ];
  metricRows.forEach((r, i) => addDataRow(ws1, 5 + i, r, [1, 2, 3, 4]));

  if (Object.keys(periodData).length > 0) {
    const startRow = 11;
    addTableHeader(ws1, startRow, ['So sánh theo kỳ', 'Lượng đặt lịch', 'Hội viên mới', 'Lượt điểm danh', 'Ca dạy HLV']);
    ['week', 'month', 'quarter', 'year'].forEach((p, i) => {
      const ps = periodData[p];
      if (!ps) return;
      addDataRow(ws1, startRow + 1 + i, [
        PERIOD_LABELS[p] || p,
        ps.totalBookings ?? 0,
        ps.totalNewCustomers ?? 0,
        ps.totalCheckins ?? 0,
        ps.totalTrainerSessions ?? 0,
      ], [1, 2, 3, 4]);
    });
  }
  setColWidths(ws1, [24, 18, 12, 12, 12]);

  // ── Sheet 2: Tăng trưởng hội viên mới ──
  const ws2 = wb.addWorksheet('Tăng trưởng HV');
  ws2.mergeCells('A1:C1');
  ws2.getCell('A1').value = 'Tốc độ Tăng trưởng Hội viên mới';
  ws2.getCell('A1').font = { bold: true, size: 13 };

  addTableHeader(ws2, 3, ['Kỳ', 'Hội viên mới', 'Tỷ trọng (%)']);
  const totalGrowth = growth.reduce((sum: number, g: any) => sum + (g.count || 0), 0);
  growth.forEach((g: any, i: number) => {
    addDataRow(ws2, 4 + i, [g.month, g.count || 0, totalGrowth > 0 ? Math.round(((g.count || 0) / totalGrowth) * 100) : 0], [1]);
  });
  if (growth.length > 0) addTotalRow(ws2, 4 + growth.length, ['TỔNG CỘNG', totalGrowth, 100], [1]);
  setColWidths(ws2, [18, 15, 12]);

  // ── Sheet 3: Phân bổ theo gói môn tập ──
  const ws3 = wb.addWorksheet('Phân bổ môn tập');
  ws3.mergeCells('A1:C1');
  ws3.getCell('A1').value = 'Phân bổ Hội viên theo Gói môn tập';
  ws3.getCell('A1').font = { bold: true, size: 13 };

  addTableHeader(ws3, 3, ['Môn tập', 'Số hội viên', 'Tỷ trọng (%)']);
  const totalSports = sports.reduce((sum: number, sp: any) => sum + (sp.value || 0), 0);
  sports.forEach((sp: any, i: number) => {
    addDataRow(ws3, 4 + i, [sp.name, sp.value || 0, totalSports > 0 ? Math.round(((sp.value || 0) / totalSports) * 100) : 0], [1]);
  });
  if (sports.length > 0) addTotalRow(ws3, 4 + sports.length, ['TỔNG CỘNG', totalSports, 100], [1]);
  setColWidths(ws3, [20, 15, 12]);

  // ── Sheet 4: Tần suất điểm danh ──
  const ws4 = wb.addWorksheet('Tần suất điểm danh');
  ws4.mergeCells('A1:C1');
  ws4.getCell('A1').value = 'Tần suất Điểm danh';
  ws4.getCell('A1').font = { bold: true, size: 13 };

  addTableHeader(ws4, 3, ['Ngày/Kỳ', 'Số lượt', 'Tỷ trọng (%)']);
  const totalCheckins = checkins.reduce((sum: number, c: any) => sum + (c.count || 0), 0);
  checkins.forEach((c: any, i: number) => {
    addDataRow(ws4, 4 + i, [c.day, c.count || 0, totalCheckins > 0 ? Math.round(((c.count || 0) / totalCheckins) * 100) : 0], [1]);
  });
  if (checkins.length > 0) addTotalRow(ws4, 4 + checkins.length, ['TỔNG CỘNG', totalCheckins, 100], [1]);
  setColWidths(ws4, [18, 15, 12]);

  // ── Sheet 5: Hiệu suất HLV ──
  const ws5 = wb.addWorksheet('Hiệu suất HLV');
  ws5.mergeCells('A1:E1');
  ws5.getCell('A1').value = 'Biểu đồ Hiệu suất Huấn luyện viên (PT)';
  ws5.getCell('A1').font = { bold: true, size: 13 };

  addTableHeader(ws5, 3, ['HLV', 'Ca đã xác nhận', 'Ca bị từ chối', 'Ca đã hủy', 'Tổng']);
  const totalSessions = trainers.reduce((sum: number, t: any) => sum + (t.sessions || 0), 0);
  const avgSessions = trainers.length > 0 ? totalSessions / trainers.length : 0;
  trainers.forEach((t: any, i: number) => {
    addDataRow(ws5, 4 + i, [
      t.name, t.sessions || 0, t.rejected || 0, t.cancelled || 0,
      (t.sessions || 0) + (t.rejected || 0) + (t.cancelled || 0),
    ], [1, 2, 3, 4]);
  });
  if (trainers.length > 0) {
    const tRow = 4 + trainers.length;
    addTotalRow(ws5, tRow, ['TỔNG CỘNG', totalSessions,
      trainers.reduce((a: number, t: any) => a + (t.rejected || 0), 0),
      trainers.reduce((a: number, t: any) => a + (t.cancelled || 0), 0),
      '',], [1, 2, 3]);
    addDataRow(ws5, tRow + 1, ['Trung bình / HLV', Number(avgSessions.toFixed(1)), '', '', '']);
  }
  setColWidths(ws5, [20, 16, 16, 16, 12]);

  // ── Sheet 6: Chi tiết hội viên mới theo tháng ──
  if (monthly.length > 0) {
    const ws6 = wb.addWorksheet('Chi tiết HV theo tháng');
    ws6.mergeCells('A1:H1');
    ws6.getCell('A1').value = 'Chi tiết hội viên mới theo tháng';
    ws6.getCell('A1').font = { bold: true, size: 13 };

    let curRow = 3;
    monthly.forEach((m: any) => {
      ws6.mergeCells(`A${curRow}:H${curRow}`);
      ws6.getCell(`A${curRow}`).value = `Tháng ${m.month}/${m.year} — Tổng: ${m.total} HV, Doanh thu: ${(m.totalRevenue || 0).toLocaleString('vi-VN')}đ`;
      ws6.getCell(`A${curRow}`).font = { bold: true, size: 12, color: { argb: 'FF4F46E5' } };
      curRow++;

      const genderStr = (m.byGender || []).map((g: any) => `${g.name}: ${g.count}`).join(', ');
      ws6.getCell(`A${curRow}`).value = genderStr ? `Phân bổ giới tính: ${genderStr}` : '';
      ws6.getCell(`A${curRow}`).font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
      curRow++;

      addTableHeader(ws6, curRow, ['Họ tên', 'Giới tính', 'SĐT', 'Email', 'Số lượng gói tập', 'Số tiền', 'Ngày đăng ký']);
      curRow++;
      (m.customers || []).forEach((c: any) => {
        addDataRow(ws6, curRow, [
          c.fullName, c.gender, c.phone, c.email, c.packageCount ?? 0,
          c.totalPrice || 0, c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '',
        ], [5]);
        curRow++;
      });
      if ((m.customers || []).length === 0) {
        ws6.getCell(`A${curRow}`).value = 'Không có hội viên';
        curRow++;
      }
      curRow++;
    });
    setColWidths(ws6, [24, 10, 14, 24, 18, 14, 14]);
  }

  // ── Sheet 7: Chi tiết điểm danh ──
  if (checkin.length > 0) {
    const ws7 = wb.addWorksheet('Chi tiết điểm danh');
    ws7.mergeCells('A1:D1');
    ws7.getCell('A1').value = 'Chi tiết điểm danh theo kỳ';
    ws7.getCell('A1').font = { bold: true, size: 13 };

    let curRow = 3;
    checkin.forEach((c: any) => {
      ws7.mergeCells(`A${curRow}:D${curRow}`);
      ws7.getCell(`A${curRow}`).value = `${c.day || 'Kỳ'} — Tổng: ${c.total || 0} lượt`;
      ws7.getCell(`A${curRow}`).font = { bold: true, size: 12, color: { argb: 'FF7C3AED' } };
      curRow++;

      if (c.hourly && c.hourly.length > 0) {
        ws7.getCell(`A${curRow}`).value = 'Giờ trong ngày';
        ws7.getCell(`A${curRow}`).font = { bold: true };
        curRow++;
        (c.hourly || []).forEach((h: any) => {
          ws7.getCell(`A${curRow}`).value = h.hour;
          ws7.getCell(`B${curRow}`).value = h.count || 0;
          curRow++;
        });
      }

      if (c.customers && c.customers.length > 0) {
        addTableHeader(ws7, curRow, ['Họ tên', 'Giới tính', 'SĐT', 'Giờ điểm danh']);
        curRow++;
        (c.customers || []).forEach((cust: any) => {
          addDataRow(ws7, curRow, [
            cust.fullName, cust.gender || '-', cust.phone || '-',
            cust.checkInTime ? new Date(cust.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-',
          ]);
          curRow++;
        });
      }
      curRow++;
    });
    setColWidths(ws7, [24, 12, 16, 14]);
  }

  // ── Sheet 8: Chi tiết môn tập ──
  if (sportDetails.length > 0) {
    const ws8 = wb.addWorksheet('Chi tiết môn tập');
    ws8.mergeCells('A1:H1');
    ws8.getCell('A1').value = 'Chi tiết hội viên theo môn tập';
    ws8.getCell('A1').font = { bold: true, size: 13 };

    let curRow = 3;
    sportDetails.forEach((sd: any) => {
      ws8.mergeCells(`A${curRow}:H${curRow}`);
      ws8.getCell(`A${curRow}`).value = `${sd.sportName || ''} — Tổng: ${sd.total || 0} hội viên`;
      ws8.getCell(`A${curRow}`).font = { bold: true, size: 12, color: { argb: 'FF10B981' } };
      curRow++;

      addTableHeader(ws8, curRow, ['Họ tên', 'Giới tính', 'SĐT', 'Email', 'Gói tập', 'Ngày đăng ký', 'Số tiền', 'Trạng thái']);
      curRow++;
      (sd.members || []).forEach((m: any) => {
        addDataRow(ws8, curRow, [
          m.fullName, m.gender || '-', m.phone || '-', m.email || '-', m.packageName,
          m.registeredAt ? new Date(m.registeredAt).toLocaleDateString('vi-VN') : '',
          m.totalPrice || 0, m.status || '',
        ], [6]);
        curRow++;
      });
      curRow++;
    });
    setColWidths(ws8, [24, 10, 14, 22, 18, 14, 14, 14]);
  }

  // ── Sheet 9: Chi tiết HLV ──
  if (trainerDetails.length > 0) {
    const ws9 = wb.addWorksheet('Chi tiết HLV');
    ws9.mergeCells('A1:G1');
    ws9.getCell('A1').value = 'Chi tiết ca dạy của HLV';
    ws9.getCell('A1').font = { bold: true, size: 13 };

    let curRow = 3;
    trainerDetails.forEach((td: any) => {
      ws9.mergeCells(`A${curRow}:G${curRow}`);
      ws9.getCell(`A${curRow}`).value = `${td.trainerName || ''} — Tổng: ${td.totalSessions || 0} ca, ${td.uniqueCustomers || 0} hội viên`;
      ws9.getCell(`A${curRow}`).font = { bold: true, size: 12, color: { argb: 'FFF59E0B' } };
      curRow++;

      addTableHeader(ws9, curRow, ['Học viên', 'SĐT', 'Ngày', 'Giờ', 'Môn', 'Trạng thái']);
      curRow++;
      (td.sessions || []).forEach((sess: any) => {
        const statusMap: Record<string, string> = { confirmed: 'Đã xác nhận', pending: 'Chờ xác nhận', cancelled: 'Đã hủy', rejected: 'Bị từ chối' };
        addDataRow(ws9, curRow, [
          sess.customerName, sess.customerPhone || '-',
          sess.date ? new Date(sess.date).toLocaleDateString('vi-VN') : '',
          sess.time || '-', sess.discipline || '-', statusMap[sess.status] || sess.status || '',
        ]);
        curRow++;
      });
      curRow++;
    });
    setColWidths(ws9, [22, 14, 14, 10, 14, 16]);
  }

  // ── Sheet 10: Biểu đồ ──
  if (chartImages && chartImages.length > 0) {
    const wsChart = wb.addWorksheet('Biểu đồ');
    wsChart.mergeCells('A1:N1');
    wsChart.getCell('A1').value = 'BIỂU ĐỒ HOẠT ĐỘNG';
    wsChart.getCell('A1').font = { bold: true, size: 14 };
    wsChart.getCell('A1').alignment = { horizontal: 'center' };

    let currentRow = 3;
    for (const img of chartImages) {
      wsChart.getCell(`A${currentRow}`).value = img.name;
      wsChart.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
      currentRow++;

      try {
        const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageId = wb.addImage({ base64, extension: 'png' });
        const widthPt = 580;
        const heightPt = 300;
        wsChart.addImage(imageId, { tl: { col: 0, row: currentRow }, ext: { width: widthPt, height: heightPt } });
        currentRow += Math.ceil(heightPt / 18) + 2;
      } catch {
        wsChart.getCell(`A${currentRow}`).value = `(Không thể tải biểu đồ: ${img.name})`;
        wsChart.getCell(`A${currentRow}`).font = { color: { argb: 'FFEF4444' } };
        currentRow += 2;
      }
    }
    setColWidths(wsChart, [80]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

// ============ EXPORT CHẤM CÔNG NHÂN VIÊN ============
export async function exportAttendanceExcel(
  data: any,
  periodLabel: string,
  fileName: string,
  chartImages?: { name: string; dataUrl: string }[],
  clubName?: string
) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const s = data?.summary || {};
  const daily = data?.daily || [];
  const shiftDist = data?.shiftDist || [];

  const fmtDur = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
  };

  // ── Sheet 1: Tổng quan ──
  const ws1 = wb.addWorksheet('Tổng quan');
  ws1.mergeCells('A1:D1');
  ws1.getCell('A1').value = `BÁO CÁO CHẤM CÔNG NHÂN VIÊN — ${periodLabel}`;
  ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  ws1.getCell('A1').alignment = { horizontal: 'center' };

  ws1.mergeCells('A2:D2');
  const clubLine = clubName && clubName !== 'Tất cả câu lạc bộ' ? `Cơ sở: ${clubName} | ` : '';
  ws1.getCell('A2').value = `${clubLine}Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  addTableHeader(ws1, 4, ['Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú']);
  const summaryData = [
    ['Tổng lượt chấm công', s.total || 0, 'lượt', 'Tổng số lượt check-in trong kỳ'],
    ['Tổng giờ làm', fmtDur(s.totalMinutes || 0), 'giờ', 'Tổng thời gian giữa check-in và check-out'],
    ['Đi muộn', s.lateCount || 0, 'lượt', 'Chấm công sau giờ bắt đầu ca (sau 15 phút khoan hồng)'],
    ['Đúng giờ', s.onTimeCount || 0, 'lượt', 'Không đi muộn, không về sớm, đã check-out'],
    ['Tăng ca', fmtDur(s.overtimeMinutes || 0), 'giờ', 'Làm sau giờ kết thúc ca'],
    ['Vắng mặt', s.absentCount || 0, 'lượt', 'Được phân ca nhưng không chấm công trong ngày'],
  ];
  summaryData.forEach((r, i) => addDataRow(ws1, 5 + i, r, [1]));
  setColWidths(ws1, [24, 24, 12, 42]);

  // ── Sheet 2: Chi tiết theo ngày ──
  if (daily.length > 0) {
    const ws2 = wb.addWorksheet('Chi tiết theo ngày');
    ws2.mergeCells('A1:E1');
    ws2.getCell('A1').value = 'Số lượt chấm công và tổng giờ làm theo ngày';
    ws2.getCell('A1').font = { bold: true, size: 13 };

    addTableHeader(ws2, 3, ['Ngày', 'Số lượt chấm công', 'Tổng giờ làm', 'Đi muộn', 'Tăng ca']);
    daily.forEach((d: any, i: number) => {
      addDataRow(ws2, 4 + i, [
        d.date, d.count || 0, fmtDur(d.totalMinutes || 0), d.lateCount || 0,
        d.overtimeMinutes ? fmtDur(d.overtimeMinutes) : 0,
      ], [1]);
    });
    const tTotal = daily.reduce((a: any, d: any) => a + (d.count || 0), 0);
    const tMinutes = daily.reduce((a: any, d: any) => a + (d.totalMinutes || 0), 0);
    addTotalRow(ws2, 4 + daily.length, ['TỔNG CỘNG', tTotal, fmtDur(tMinutes), daily.reduce((a: any, d: any) => a + (d.lateCount || 0), 0), 0], [1]);
    setColWidths(ws2, [14, 22, 20, 12, 16]);
  }

  // ── Sheet 3: Phân bổ theo ca ──
  if (shiftDist.length > 0) {
    const ws3 = wb.addWorksheet('Phân bổ theo ca');
    ws3.mergeCells('A1:C1');
    ws3.getCell('A1').value = 'Phân bổ lượt chấm công theo ca làm';
    ws3.getCell('A1').font = { bold: true, size: 13 };

    const totalShift = shiftDist.reduce((a: any, e: any) => a + (e.value || 0), 0);
    addTableHeader(ws3, 3, ['Ca làm', 'Số lượt', 'Tỷ trọng (%)']);
    shiftDist.forEach((e: any, i: number) => {
      addDataRow(ws3, 4 + i, [e.name, e.value || 0, totalShift > 0 ? Math.round((e.value / totalShift) * 100) : 0], [1]);
    });
    addTotalRow(ws3, 4 + shiftDist.length, ['TỔNG CỘNG', totalShift, 100], [1]);
    setColWidths(ws3, [26, 12, 15]);
  }

  // ── Sheet 4: Phân chia theo cơ sở ──
  const byLocation = data?.byLocation || [];
  if (byLocation.length > 0) {
    const ws4 = wb.addWorksheet('Theo cơ sở');
    ws4.mergeCells('A1:F1');
    ws4.getCell('A1').value = 'Phân chia chấm công theo cơ sở phòng tập';
    ws4.getCell('A1').font = { bold: true, size: 13 };

    addTableHeader(ws4, 3, ['Cơ sở', 'Lượt chấm công', 'Tổng giờ làm', 'Đi muộn', 'Đúng giờ', 'Vắng mặt']);
    byLocation.forEach((l: any, i: number) => {
      addDataRow(ws4, 4 + i, [
        l.locationName || 'Phòng tập', l.total || 0, fmtDur(l.totalMinutes || 0),
        l.lateCount || 0, l.onTimeCount || 0, l.absentCount || 0,
      ], [1]);
    });
    const sumLoc = byLocation.reduce((a: any, l: any) => {
      return {
        total: a.total + (l.total || 0),
        minutes: a.minutes + (l.totalMinutes || 0),
        late: a.late + (l.lateCount || 0),
        onTime: a.onTime + (l.onTimeCount || 0),
        absent: a.absent + (l.absentCount || 0),
      };
    }, { total: 0, minutes: 0, late: 0, onTime: 0, absent: 0 });
    addTotalRow(ws4, 4 + byLocation.length, ['TỔNG CỘNG', sumLoc.total, fmtDur(sumLoc.minutes), sumLoc.late, sumLoc.onTime, sumLoc.absent], [1]);
    setColWidths(ws4, [26, 18, 18, 12, 12, 12]);
  }

  // ── Sheet 5: Biểu đồ ──
  if (chartImages && chartImages.length > 0) {
    const wsChart = wb.addWorksheet('Biểu đồ');
    wsChart.mergeCells('A1:N1');
    wsChart.getCell('A1').value = 'BIỂU ĐỒ CHẤM CÔNG';
    wsChart.getCell('A1').font = { bold: true, size: 14 };
    wsChart.getCell('A1').alignment = { horizontal: 'center' };

    let currentRow = 3;
    for (const img of chartImages) {
      wsChart.getCell(`A${currentRow}`).value = img.name;
      wsChart.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
      currentRow++;

      try {
        const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageId = wb.addImage({ base64, extension: 'png' });
        const widthPt = 580;
        const heightPt = 300;
        wsChart.addImage(imageId, { tl: { col: 0, row: currentRow }, ext: { width: widthPt, height: heightPt } });
        currentRow += Math.ceil(heightPt / 18) + 2;
      } catch {
        wsChart.getCell(`A${currentRow}`).value = `(Không thể tải biểu đồ: ${img.name})`;
        wsChart.getCell(`A${currentRow}`).font = { color: { argb: 'FFEF4444' } };
        currentRow += 2;
      }
    }
    setColWidths(wsChart, [80]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

// ============ EXPORT VẬN HÀNH ============
export async function exportOperationsExcel(
  data: any,
  periodLabel: string,
  fileName: string,
  clubName?: string
) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  // ── Sheet 1: Tổng quan ──
  const ws1 = wb.addWorksheet('Tổng quan');
  ws1.mergeCells('A1:C1');
  ws1.getCell('A1').value = `BÁO CÁO VẬN HÀNH — ${periodLabel}`;
  ws1.getCell('A1').font = { bold: true, size: 14 };
  ws1.getCell('A1').alignment = { horizontal: 'center' };

  ws1.mergeCells('A2:C2');
  const clubLine = clubName && clubName !== 'Tất cả câu lạc bộ' ? `Cơ sở: ${clubName} | ` : '';
  ws1.getCell('A2').value = `${clubLine}Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  addTableHeader(ws1, 4, ['Chỉ số', 'Giá trị', 'Ghi chú']);
  addDataRow(ws1, 5, ['Tổng số thiết bị', data.totalQuantity || 0, 'Tất cả thiết bị'], [1]);
  addDataRow(ws1, 6, ['Giá trị thiết bị', data.totalValue || 0, 'Tổng nguyên giá'], [1]);
  addDataRow(ws1, 7, ['Tổng báo cáo', data.totalReports || 0, 'Sự cố đã báo cáo'], []);
  addDataRow(ws1, 8, ['Chờ xử lý', data.pendingReports || 0, 'Cần xử lý sớm'], []);
  setColWidths(ws1, [22, 20, 22]);

  // ── Sheet 2: Tình trạng thiết bị ──
  const eqStatus = data.equipmentStatus || [];
  if (eqStatus.length > 0) {
    const ws2 = wb.addWorksheet('Tình trạng thiết bị');
    ws2.mergeCells('A1:C1');
    ws2.getCell('A1').value = 'Phân loại tình trạng thiết bị';
    ws2.getCell('A1').font = { bold: true, size: 13 };

    const totalEq = eqStatus.reduce((s: number, e: any) => s + e.value, 0);
    addTableHeader(ws2, 3, ['Trạng thái', 'Số lượng', 'Tỷ trọng (%)']);
    eqStatus.forEach((e: any, i: number) => {
      addDataRow(ws2, 4 + i, [e.name, e.value, totalEq > 0 ? Math.round((e.value / totalEq) * 100) : 0], [1]);
    });
    addTotalRow(ws2, 4 + eqStatus.length, ['TỔNG CỘNG', totalEq, 100], [1]);
    setColWidths(ws2, [20, 15, 15]);
  }

  // ── Sheet 3: Phân loại sự cố ──
  const eqReports = data.equipmentReports || [];
  if (eqReports.length > 0) {
    const ws3 = wb.addWorksheet('Phân loại sự cố');
    ws3.mergeCells('A1:C1');
    ws3.getCell('A1').value = 'Phân loại sự cố thiết bị';
    ws3.getCell('A1').font = { bold: true, size: 13 };

    const totalR = eqReports.reduce((s: number, e: any) => s + e.value, 0);
    addTableHeader(ws3, 3, ['Loại sự cố', 'Số báo cáo', 'Tỷ trọng (%)']);
    eqReports.forEach((e: any, i: number) => {
      addDataRow(ws3, 4 + i, [e.name, e.value, totalR > 0 ? Math.round((e.value / totalR) * 100) : 0], [1]);
    });
    addTotalRow(ws3, 4 + eqReports.length, ['TỔNG CỘNG', totalR, 100], [1]);
    setColWidths(ws3, [20, 15, 15]);
  }

  // ── Sheet 4: Chi tiết báo cáo ──
  const reports = (data.reportDetails || [])
    .filter((r: any) => r.statusType !== 'hoạt động')
    .sort((a: any, b: any) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  if (reports.length > 0) {
    const ws4 = wb.addWorksheet('Chi tiết báo cáo');
    ws4.mergeCells('A1:F1');
    ws4.getCell('A1').value = 'Lịch sử báo cáo sự cố';
    ws4.getCell('A1').font = { bold: true, size: 13 };

    addTableHeader(ws4, 3, ['Thiết bị', 'Loại sự cố', 'Số máy', 'Lý do', 'Thời gian', 'Trạng thái']);
    reports.forEach((r: any, i: number) => {
      addDataRow(ws4, 4 + i, [
        r.equipmentName, r.statusType, r.affectedQuantity,
        r.reason || '—', r.reportedAt ? new Date(r.reportedAt).toLocaleDateString('vi-VN') : '—',
        r.status === 'pending' ? 'Chờ xử lý' : 'Hoàn thành',
      ], [2]);
    });
    setColWidths(ws4, [20, 15, 12, 25, 15, 15]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}
