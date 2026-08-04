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
  chartImages?: { name: string; dataUrl: string }[]
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
  ws1.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  addTableHeader(ws1, 4, ['Chỉ số', 'Giá trị', 'Thay đổi (%)', 'Xu hướng']);
  const summaryData = [
    ['Doanh thu thực thu', s.realCashIn, s.change?.realCashIn, (s.change?.realCashIn ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Doanh thu ghi nhận', s.accrualRevenue, s.change?.accrualRevenue, (s.change?.accrualRevenue ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Tổng chi phí', s.totalExpense, s.change?.totalExpense, (s.change?.totalExpense ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
    ['Lợi nhuận', s.totalProfit, s.change?.totalProfit, (s.change?.totalProfit ?? 0) >= 0 ? 'Tăng' : 'Giảm'],
  ];
  summaryData.forEach((r, i) => {
    addDataRow(ws1, 5 + i, r, [1]);
    if (typeof r[2] === 'number') {
      ws1.getCell(5 + i, 3).value = `${r[2] > 0 ? '+' : ''}${r[2]}%`;
    }
  });
  addDataRow(ws1, 9, ['Biên lợi nhuận', `${s.profitMargin || 0}%`, '', '']);
  ws1.getCell(9, 1).font = { bold: true };
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

  // Bảng bên trái (A-C): Chi phí theo tháng
  addTableHeader(ws3, 3, ['Tháng', 'Chi phí', 'Lợi nhuận']);
  profit.forEach((p: any, i: number) => {
    addDataRow(ws3, 4 + i, [p.month, p.expense, p.profit], [1, 2]);
  });
  if (profit.length > 0) {
    const tRow = 4 + profit.length;
    const pt = profit.reduce((a: any, p: any) => ({ e: a.e + p.expense, p: a.p + p.profit }), { e: 0, p: 0 });
    addTotalRow(ws3, tRow, ['TỔNG CỘNG', pt.e, pt.p], [1, 2]);
  }

  // Bảng bên phải (E-G): Cơ cấu chi phí
  const expDetailStartCol = 5;
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

// ============ EXPORT VẬN HÀNH ============
export async function exportOperationsExcel(
  data: any,
  periodLabel: string,
  fileName: string
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
  ws1.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
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
