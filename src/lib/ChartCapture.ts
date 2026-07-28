const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6'];

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2; // 2x for retina
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}

function toDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: { size?: number; bold?: boolean; color?: string; align?: CanvasTextAlign } = {}) {
  ctx.fillStyle = opts.color || '#1e293b';
  ctx.font = `${opts.bold ? 'bold ' : ''}${opts.size || 12}px Calibri, sans-serif`;
  ctx.textAlign = opts.align || 'left';
  ctx.fillText(text, x, y);
}

// ============ BAR CHART ============
function drawBarChart(
  labels: string[],
  datasets: { name: string; values: number[]; color: string }[],
  title: string,
  width = 600,
  height = 360
): string {
  const { canvas, ctx } = createCanvas(width, height);
  const padding = { top: 40, right: 20, bottom: 50, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Title
  drawText(ctx, title, width / 2, 24, { size: 14, bold: true, align: 'center' });

  // Max value
  const allVals = datasets.flatMap(d => d.values);
  const maxVal = Math.max(...allVals, 1) * 1.15;

  // Grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + chartH - (i / gridLines) * chartH;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const val = (maxVal / gridLines) * i;
    drawText(ctx, val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}M` : val >= 1_000 ? `${(val / 1_000).toFixed(0)}K` : `${val.toFixed(0)}`, padding.left - 8, y + 4, { size: 10, color: '#94a3b8', align: 'right' });
  }

  // Bars
  const groupWidth = chartW / labels.length;
  const barWidth = Math.min(groupWidth * 0.7 / datasets.length, 30);
  const groupPad = (groupWidth - barWidth * datasets.length) / 2;

  labels.forEach((label, li) => {
    datasets.forEach((ds, di) => {
      const val = ds.values[li] || 0;
      const barH = (val / maxVal) * chartH;
      const x = padding.left + li * groupWidth + groupPad + di * barWidth;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = ds.color;
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    });
    drawText(ctx, label, padding.left + li * groupWidth + groupWidth / 2, height - padding.bottom + 18, { size: 11, align: 'center' });
  });

  // Legend
  let legendX = width / 2 - (datasets.length * 80) / 2;
  datasets.forEach(ds => {
    ctx.fillStyle = ds.color;
    ctx.fillRect(legendX, height - 14, 12, 12);
    drawText(ctx, ds.name, legendX + 16, height - 4, { size: 10, color: '#475569' });
    legendX += 80;
  });

  return toDataUrl(canvas);
}

// ============ PIE CHART ============
function drawPieChart(
  labels: string[],
  values: number[],
  title: string,
  width = 500,
  height = 360
): string {
  const { canvas, ctx } = createCanvas(width, height);
  drawText(ctx, title, width / 2, 24, { size: 14, bold: true, align: 'center' });

  const total = values.reduce((s, v) => s + v, 0) || 1;
  const cx = width * 0.35;
  const cy = height * 0.5;
  const r = Math.min(cx - 30, cy - 40, 120);
  let startAngle = -Math.PI / 2;

  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Label on slice
    if (sliceAngle > 0.2) {
      const midAngle = startAngle + sliceAngle / 2;
      const lx = cx + Math.cos(midAngle) * (r * 0.65);
      const ly = cy + Math.sin(midAngle) * (r * 0.65);
      const pct = Math.round((val / total) * 100);
      drawText(ctx, `${pct}%`, lx, ly + 4, { size: 11, bold: true, color: '#ffffff', align: 'center' });
    }
    startAngle += sliceAngle;
  });

  // Legend
  let legendY = 50;
  labels.forEach((label, i) => {
    const pct = Math.round((values[i] / total) * 100);
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fillRect(width * 0.68, legendY - 10, 14, 14);
    drawText(ctx, `${label} (${pct}%)`, width * 0.68 + 20, legendY, { size: 11, color: '#475569' });
    legendY += 22;
  });

  return toDataUrl(canvas);
}

// ============ LINE CHART (for profit) ============
function drawLineChart(
  labels: string[],
  datasets: { name: string; values: number[]; color: string }[],
  title: string,
  width = 600,
  height = 360
): string {
  const { canvas, ctx } = createCanvas(width, height);
  const padding = { top: 40, right: 20, bottom: 50, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  drawText(ctx, title, width / 2, 24, { size: 14, bold: true, align: 'center' });

  const allVals = datasets.flatMap(d => d.values);
  const maxVal = Math.max(...allVals.map(Math.abs), 1) * 1.15;
  const minVal = Math.min(0, ...allVals);
  const range = maxVal - minVal;

  // Grid
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + chartH - (i / gridLines) * chartH;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const val = minVal + (range / gridLines) * i;
    drawText(ctx, val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}M` : val >= 1_000 ? `${(val / 1_000).toFixed(0)}K` : `${val.toFixed(0)}`, padding.left - 8, y + 4, { size: 10, color: '#94a3b8', align: 'right' });
  }

  // X labels
  labels.forEach((label, i) => {
    const x = padding.left + (i / (labels.length - 1 || 1)) * chartW;
    drawText(ctx, label, x, height - padding.bottom + 18, { size: 11, align: 'center' });
  });

  // Lines
  datasets.forEach(ds => {
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ds.values.forEach((val, i) => {
      const x = padding.left + (i / (labels.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((val - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    ds.values.forEach((val, i) => {
      const x = padding.left + (i / (labels.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((val - minVal) / range) * chartH;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Legend
  let legendX = width / 2 - (datasets.length * 80) / 2;
  datasets.forEach(ds => {
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX, height - 8);
    ctx.lineTo(legendX + 14, height - 8);
    ctx.stroke();
    ctx.fillStyle = ds.color;
    ctx.beginPath();
    ctx.arc(legendX + 7, height - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, ds.name, legendX + 18, height - 4, { size: 10, color: '#475569' });
    legendX += 80;
  });

  return toDataUrl(canvas);
}

// ============ PUBLIC ============
export function generateChartImages(data: any): { name: string; dataUrl: string }[] {
  const images: { name: string; dataUrl: string }[] = [];
  if (!data) return images;

  const cashFlow = data.cashFlowData || [];
  const profit = data.profitData || [];
  const expense = data.expenseStructure || [];
  const topProducts = data.topProducts || [];

  if (cashFlow.length > 0) {
    images.push({
      name: 'Dòng tiền thực thu vs Doanh thu ghi nhận',
      dataUrl: drawBarChart(
        cashFlow.map((c: any) => c.month),
        [
          { name: 'Tiền thực thu', values: cashFlow.map((c: any) => c.cash || 0), color: '#10b981' },
          { name: 'DT ghi nhận', values: cashFlow.map((c: any) => c.revenue || 0), color: '#6366f1' },
        ],
        'Dòng tiền thực thu vs Doanh thu ghi nhận (VNĐ)'
      ),
    });
  }

  if (profit.length > 0) {
    images.push({
      name: 'Chi phí & Lợi nhuận theo tháng',
      dataUrl: drawBarChart(
        profit.map((p: any) => p.month),
        [
          { name: 'Doanh thu', values: profit.map((p: any) => p.revenue || 0), color: '#6366f1' },
          { name: 'Chi phí', values: profit.map((p: any) => p.expense || 0), color: '#f59e0b' },
        ],
        'Chi phí & Lợi nhuận theo tháng (VNĐ)'
      ),
    });
    images.push({
      name: 'Lợi nhuận theo tháng',
      dataUrl: drawLineChart(
        profit.map((p: any) => p.month),
        [{ name: 'Lợi nhuận', values: profit.map((p: any) => p.profit || 0), color: '#10b981' }],
        'Lợi nhuận theo tháng (VNĐ)'
      ),
    });
  }

  if (expense.length > 0) {
    images.push({
      name: 'Cơ cấu chi phí',
      dataUrl: drawPieChart(
        expense.map((e: any) => e.name),
        expense.map((e: any) => e.value),
        'Cơ cấu chi phí'
      ),
    });
  }

  if (topProducts.length > 0) {
    images.push({
      name: 'Top sản phẩm theo doanh thu',
      dataUrl: drawBarChart(
        topProducts.map((p: any) => p.name),
        [{ name: 'Doanh thu', values: topProducts.map((p: any) => p.revenue || 0), color: '#8b5cf6' }],
        'Top sản phẩm bán chạy (VNĐ)'
      ),
    });
  }

  return images;
}
