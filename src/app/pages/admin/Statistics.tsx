import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank,
  Package as PackageIcon, ShoppingBag, Wrench, AlertTriangle,
  BarChart3, Activity, Loader2, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { api } from '../../../lib/api';
import { useClub } from '../../context/ClubContext';
import { exportFinanceExcel, exportOperationsExcel } from '../../../lib/exportExcelWithChart';
import { generateChartImages } from '../../../lib/ChartCapture';
import { ActivityStats } from './ActivityStats';

const PERIODS = [
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm nay' },
];

const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
};
const fmtVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + '₫';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6'];
const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

// ---------- Fallback data (khi BE chưa có dữ liệu) ----------
const fallbackFinance = {
  summary: {
    cashRevenue: 0, accrualRevenue: 0, realCashIn: 0,
    totalExpense: 0, totalProfit: 0, netCashFlow: 0, profitMargin: 0,
    change: { realCashIn: 0, accrualRevenue: 0, totalExpense: 0, totalProfit: 0 },
  },
  cashFlowData: MONTHS.map(m => ({ month: m, cash: 0, revenue: 0 })),
  profitData: MONTHS.map(m => ({ month: m, revenue: 0, expense: 0, profit: 0 })),
  expenseStructure: [],
  packageSalesData: [],
  participation: [],
  topProducts: [],
};

export function Statistics() {
  const [tab, setTab] = useState<'finance' | 'operations' | 'activity'>('finance');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [finance, setFinance] = useState<any>(null);
  const [operations, setOperations] = useState<any>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [periodData, setPeriodData] = useState<Record<string, any>>({});
  const [loadingPeriodData, setLoadingPeriodData] = useState(false);
  const [drilldown, setDrilldown] = useState<{ title: string; subtitle?: string; columns: string[]; rows: any[]; totalLabel?: string; totalValue?: number } | null>(null);
  const [explainModal, setExplainModal] = useState<{ title: string; formula: string; description: string; example?: string } | null>(null);
  const { selectedClub, selectedClubName } = useClub();

  const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';

  const validateCustomDate = (from: string, to: string) => {
    if (!from || !to) { setDateError('Vui lòng chọn cả ngày bắt đầu và kết thúc'); return false; }
    const f = new Date(from + 'T00:00:00');
    const t = new Date(to + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (t < f) { setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu'); return false; }
    if (t > today) { setDateError('Ngày kết thúc không được lớn hơn hôm nay'); return false; }
    const diffMonths = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
    if (diffMonths > 24) { setDateError('Khoảng thời gian tối đa 2 năm'); return false; }
    setDateError('');
    return true;
  };

  const isCustomValid = !showCustomDate || (customFrom && customTo && !dateError);

  const handleOpenFormula = async (metric: string) => {
    setSelectedMetric(metric);
    setShowFormulaModal(true);
    setLoadingPeriodData(true);
    try {
      const periods = ['week', 'month', 'quarter', 'year'];
      const results: Record<string, any> = {};
      await Promise.all(periods.map(async (p) => {
        try {
          let url = `/api/statistics/finance?period=${p}${locParam}`;
          const data = await api.get(url);
          results[p] = data?.summary || null;
        } catch { results[p] = null; }
      }));
      setPeriodData(results);
    } catch { /* ignore */ }
    setLoadingPeriodData(false);
  };

  useEffect(() => {
    if (tab === 'activity') return;
    if (showCustomDate && (!customFrom || !customTo || !!dateError)) return;
    if (tab === 'finance') fetchFinance();
    else fetchOperations();
  }, [tab, period, selectedClub, customFrom, customTo, dateError, showCustomDate]);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      let url = `/api/statistics/finance?period=${period}${locParam}`;
      if (customFrom && customTo) {
        url += `&startDate=${customFrom}&endDate=${customTo}`;
      }
      const data = await api.get(url);
      setFinance(data);
    } catch (e) {
      setFinance(fallbackFinance);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    setLoading(true);
    try {
      let url = `/api/statistics/operations?period=${period}${locParam}`;
      if (customFrom && customTo) {
        url += `&startDate=${customFrom}&endDate=${customTo}`;
      }
      const data = await api.get(url);
      setOperations(data);
    } catch (e) {
      setOperations({
        equipmentStatus: [
          { name: 'Hoạt động', value: 42, color: '#10b981' },
          { name: 'Bảo trì', value: 6, color: '#f59e0b' },
          { name: 'Hỏng', value: 3, color: '#ef4444' },
          { name: 'Ngưng dùng', value: 4, color: '#94a3b8' },
        ],
        equipmentReports: [
          { name: 'Hoạt động', value: 10 },
          { name: 'Bảo trì', value: 6 },
          { name: 'Hỏng hóc', value: 3 },
          { name: 'Thiếu linh kiện', value: 2 },
        ],
        totalQuantity: 55, totalValue: 1_250_000_000, totalReports: 21, pendingReports: 9,
        needMaintenance: [
          { name: 'Máy chạy bộ LifeFit', status: 'maintenance', reports: 2, warrantyLeft: 4 },
          { name: 'Tạ đòn Olympic', status: 'active', reports: 1, warrantyLeft: 12 },
          { name: 'Xà kép Power', status: 'maintenance', reports: 3, warrantyLeft: 2 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const fd = finance || fallbackFinance;
  const od = operations;
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Báo cáo & Thống kê</h1>
            <p className="text-slate-600">Phân tích tài chính và vận hành phòng tập</p>
          </div>
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {[
              { key: 'finance' as const, label: 'Tài chính', icon: BarChart3 },
              { key: 'operations' as const, label: 'Vận hành', icon: Wrench },
              { key: 'activity' as const, label: 'Hoạt động', icon: Activity },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab !== 'activity' && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => { setPeriod(p.key); setShowCustomDate(false); setCustomFrom(''); setCustomTo(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key && !showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {p.label}
                  </button>
                ))}
                <button onClick={() => setShowCustomDate(!showCustomDate)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Tùy chỉnh
                </button>
              </div>
              {showCustomDate && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2">
                    <span className="text-xs text-slate-500">Từ</span>
                    <input type="date" value={customFrom}
                      onChange={e => { const v = e.target.value; setCustomFrom(v); if (customTo) validateCustomDate(v, customTo); }}
                      className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customFrom ? 'border-red-300' : 'border-slate-200'}`} />
                    <span className="text-xs text-slate-500">Đến</span>
                    <input type="date" value={customTo}
                      onChange={e => { const v = e.target.value; setCustomTo(v); if (customFrom) validateCustomDate(customFrom, v); }}
                      className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customTo ? 'border-red-300' : 'border-slate-200'}`} />
                  </div>
                  {dateError && <span className="text-xs text-red-500 ml-2">{dateError}</span>}
                </div>
              )}
            </div>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
          </div>
        )}

        {tab === 'finance' && <FinanceTab data={fd} period={period} customFrom={customFrom} customTo={customTo} onStatClick={handleOpenFormula} onDrilldown={setDrilldown} onExplain={setExplainModal} clubName={selectedClubName} />}
        {tab === 'operations' && <OperationsTab data={od} period={period} customFrom={customFrom} customTo={customTo} clubName={selectedClubName} />}
        {tab === 'activity' && <ActivityStats selectedClub={selectedClub} />}
      </div>

      {showFormulaModal && selectedMetric && (
        <FormulaDetailModal
          metric={selectedMetric}
          data={finance}
          periodData={periodData}
          loading={loadingPeriodData}
          onClose={() => { setShowFormulaModal(false); setSelectedMetric(null); setPeriodData({}); }}
        />
      )}

      {drilldown && (
        <DrilldownModal
          title={drilldown.title}
          subtitle={drilldown.subtitle}
          columns={drilldown.columns}
          rows={drilldown.rows}
          totalLabel={drilldown.totalLabel}
          totalValue={drilldown.totalValue}
          onClose={() => setDrilldown(null)}
        />
      )}

      {explainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setExplainModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{explainModal.title}</h3>
                <button onClick={() => setExplainModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Công thức</p>
                  <p className="text-sm text-blue-900 font-medium">{explainModal.formula}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Giải thích</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{explainModal.description}</p>
                </div>
                {explainModal.example && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-green-700 mb-1">Ví dụ</p>
                    <p className="text-sm text-green-900">{explainModal.example}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setExplainModal(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ stat, onClick }: { stat: any; onClick?: () => void }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${stat.color} p-2.5 rounded-xl`}><Icon className="w-5 h-5 text-white" /></div>
        <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{stat.change}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
      {onClick && <p className="text-[10px] text-indigo-400 mt-2 font-medium">Xem công thức & cách tính →</p>}
    </div>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
        <Download className="w-4 h-4" /> Xuất Excel
      </button>
    </div>
  );
}

const fmtChange = (v: number) => `${v > 0 ? '+' : ''}${v}%`;
const pct = (val: number, total: number) => `${Math.round((val / (total || 1)) * 100)}%`;
const prevVal = (cur: number, change: number) => cur - (cur * (change ?? 0)) / 100;
const changeStr = (v: number) => `${v > 0 ? '+' : ''}${v ?? 0}%`;

function FinanceTab({ data, period, customFrom, customTo, onStatClick, onDrilldown, onExplain, clubName }: { data: any; period: string; customFrom?: string; customTo?: string; onStatClick?: (metric: string) => void; onDrilldown?: (d: { title: string; subtitle?: string; columns: string[]; rows: any[]; totalLabel?: string; totalValue?: number }) => void; onExplain?: (d: { title: string; formula: string; description: string; example?: string }) => void; clubName?: string }) {
  if (!data?.summary) return <div className="text-slate-400 text-sm">Đang tải dữ liệu tài chính...</div>;
  const s = data.summary;
  const c = s.change || {};

  const MONTH_NUM: Record<string, number> = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7, T8: 8, T9: 9, T10: 10, T11: 11, T12: 12 };
  const [expSearch, setExpSearch] = useState('');
  const filteredExpenses = (data.expenseStructure || []).filter((item: any) =>
    !expSearch.trim() || item.name.toLowerCase().includes(expSearch.toLowerCase())
  );
  const filterByMonth = (items: any[], monthLabel: string) => {
    const m = MONTH_NUM[monthLabel];
    if (!m) return [];
    const year = new Date().getFullYear();
    const mStart = new Date(year, m - 1, 1);
    const isCurrent = m === new Date().getMonth() + 1;
    const mEnd = isCurrent ? new Date() : new Date(year, m, 0, 23, 59, 59, 999);
    return items.filter((r: any) => { const d = new Date(r.date); return d >= mStart && d <= mEnd; });
  };
  const drillRevenue = (monthLabel: string, metric: 'cash' | 'revenue') => {
    if (!onDrilldown) return;
    const items = filterByMonth(data.revenueDetails || [], monthLabel);
    const label = metric === 'cash' ? 'Tiền thực thu' : 'Doanh thu ghi nhận';
    onDrilldown({
      title: `${label} — ${monthLabel}`,
      subtitle: `${items.length} giao dịch`,
      columns: ['Ngày', 'Loại', 'Khách hàng', 'Nội dung', 'Số tiền'],
      rows: items.map((r: any) => ({ 'Ngày': new Date(r.date).toLocaleDateString('vi-VN'), 'Loại': r.type, 'Khách hàng': r.customerName, 'Nội dung': r.name, 'Số tiền': fmtVnd(r.amount) })),
      totalLabel: `Tổng ${label}`,
      totalValue: items.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
    });
  };
  const drillExpense = (monthLabel: string) => {
    if (!onDrilldown) return;
    const items = filterByMonth(data.expenseDetails || [], monthLabel);
    onDrilldown({
      title: `Chi phí — ${monthLabel}`,
      subtitle: `${items.length} khoản chi`,
      columns: ['Ngày', 'Tên khoản chi', 'Phân loại', 'Ghi chú', 'Số tiền'],
      rows: items.map((e: any) => ({ 'Ngày': new Date(e.date).toLocaleDateString('vi-VN'), 'Tên khoản chi': e.name, 'Phân loại': e.category || 'Khác', 'Ghi chú': e.note || '', 'Số tiền': fmtVnd(e.amount) })),
      totalLabel: `Tổng chi phí ${monthLabel}`,
      totalValue: items.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
    });
  };
  const drillProfit = (monthLabel: string) => {
    if (!onDrilldown) return;
    const row = (data.profitData || []).find((r: any) => r.month === monthLabel);
    if (!row) return;
    onDrilldown({
      title: `Lợi nhuận — ${monthLabel}`,
      columns: ['Chỉ số', 'Giá trị'],
      rows: [
        { 'Chỉ số': 'Doanh thu ghi nhận', 'Giá trị': fmtVnd(row.revenue) },
        { 'Chỉ số': 'Chi phí', 'Giá trị': fmtVnd(row.expense) },
        { 'Chỉ số': 'Lợi nhuận', 'Giá trị': fmtVnd(row.profit) },
      ],
      totalLabel: 'Lợi nhuận',
      totalValue: row.profit,
    });
  };
  const stats = [
    { key: 'realCashIn', label: 'Doanh thu thực thu', value: fmtVnd(s.realCashIn), change: fmtChange(c.realCashIn ?? 0), trend: (c.realCashIn ?? 0) >= 0 ? 'up' : 'down', icon: Wallet, color: 'bg-emerald-500' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhận', value: fmtVnd(s.accrualRevenue), change: fmtChange(c.accrualRevenue ?? 0), trend: (c.accrualRevenue ?? 0) >= 0 ? 'up' : 'down', icon: DollarSign, color: 'bg-indigo-500' },
    { key: 'netCashFlow', label: 'Dòng tiền ròng (tích lũy)', value: fmtVnd(s.netCashFlow ?? 0), change: '', trend: (s.netCashFlow ?? 0) >= 0 ? 'up' : 'down', icon: Wallet, color: 'bg-cyan-500' },
    { key: 'totalExpense', label: 'Tổng chi phí', value: fmtVnd(s.totalExpense), change: fmtChange(c.totalExpense ?? 0), trend: (c.totalExpense ?? 0) >= 0 ? 'down' : 'up', icon: Activity, color: 'bg-orange-500' },
    { key: 'totalProfit', label: 'Lợi nhuận', value: fmtVnd(s.totalProfit), change: fmtChange(c.totalProfit ?? 0), trend: (c.totalProfit ?? 0) >= 0 ? 'up' : 'down', icon: PiggyBank, color: 'bg-green-500' },
  ];

  const summaryRows = [
    { key: 'realCashIn', label: 'Doanh thu thực thu' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhận' },
    { key: 'netCashFlow', label: 'Dòng tiền ròng' },
    { key: 'totalExpense', label: 'Tổng chi phí' },
    { key: 'totalProfit', label: 'Lợi nhuận' },
  ];

  const periodLabel = customFrom && customTo ? `${customFrom} → ${customTo}` : (PERIODS.find(p => p.key === period)?.label || period);

  const handleExport = async () => {
    const chartImages = generateChartImages(data);
    const clubSuffix = clubName && clubName !== 'Tất cả câu lạc bộ' ? `_${clubName.replace(/\s+/g, '_')}` : '';
    await exportFinanceExcel(data, periodLabel, `BaoCaoTaiChinh${clubSuffix}_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, chartImages.length > 0 ? chartImages : undefined, clubName);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{stats.map((stat, i) => <StatCard key={i} stat={stat} onClick={onStatClick ? () => onStatClick(stat.key) : undefined} />)}</div>
      <ExportBtn onClick={handleExport} />

      {/* 1. Dòng tiền vs Doanh thu ghi nhận */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Dòng tiền thực thu vs Doanh thu ghi nhận</h2>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">VNĐ</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Phân biệt tiền mặt đã vào ví (thực thu) và giá trị hợp đồng gói (ghi nhận theo kỳ)</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.cashFlowData}>
            <defs>
              <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmtVnd(v)} />
            <Legend />
            <Area type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2.5} fill="url(#gCash)" name="Dòng tiền thực thu"
              activeDot={{ r: 6, onClick: (_: any, e: any) => { if (e?.payload?.month) drillRevenue(e.payload.month, 'cash'); } }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRev)" name="Doanh thu ghi nhận"
              activeDot={{ r: 6, onClick: (_: any, e: any) => { if (e?.payload?.month) drillRevenue(e.payload.month, 'revenue'); } }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 1b. Chi tiết theo tháng (khi chọn tùy chỉnh hoặc có monthlyBreakdown) */}
      {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Chi tiết theo tháng</h2>
            <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Breakdown</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Doanh thu, chi phí và lợi nhuận từng tháng trong kỳ đã chọn</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
              <Legend />
              <Bar dataKey="cash" fill="#10b981" name="Tiền thực thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#6366f1" name="DT ghi nhận" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f59e0b" name="Chi phí" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name="Lợi nhuận" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* 2. Chi phí & Lãi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Chi phí & Lợi nhuận theo tháng</h2>
            <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">Biên lãi {s.profitMargin}%</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Theo dõi phòng gym có vận hành hiệu quả không</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.profitData}
              onClick={(e: any) => {
                const payload = e?.activePayload?.[0]?.payload;
                if (!payload?.month) return;
                drillExpense(payload.month);
              }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#6366f1" name="Doanh thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f59e0b" name="Chi phí" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Lợi nhuận" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Cơ cấu chi phí</h2>
          {data.expenseStructure.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={filteredExpenses.length > 0 ? filteredExpenses : data.expenseStructure} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {(filteredExpenses.length > 0 ? filteredExpenses : data.expenseStructure).map((_: any, i: number) => {
                      const origItem = (filteredExpenses.length > 0 ? filteredExpenses : data.expenseStructure)[i];
                      const origIdx = data.expenseStructure.findIndex((e: any) => e.name === origItem?.name);
                      return (
                        <Cell key={i} fill={COLORS[origIdx >= 0 ? origIdx : i % COLORS.length]} style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (!onDrilldown || !origItem) return;
                            const catName = origItem.name || '';
                            const matched = (data.expenseDetails || []).filter((e: any) => e.name === catName || e.category === catName);
                            onDrilldown({
                              title: `Chi phí: ${catName}`,
                              subtitle: `${matched.length} khoản chi`,
                              columns: ['Ngày', 'Tên khoản chi', 'Phân loại', 'Ghi chú', 'Số tiền'],
                              rows: matched.map((e: any) => ({ 'Ngày': new Date(e.date).toLocaleDateString('vi-VN'), 'Tên khoản chi': e.name, 'Phân loại': e.category || 'Khác', 'Ghi chú': e.note || '', 'Số tiền': fmtVnd(e.amount) })),
                              totalLabel: `Tổng ${catName}`,
                              totalValue: matched.reduce((s: number, e: any) => s + (e.amount || 0), 0),
                            });
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtVnd(v)} />
                </PieChart>
              </ResponsiveContainer>
              {data.expenseStructure.length > 3 && (
                <div className="relative mt-2 mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" value={expSearch} onChange={e => setExpSearch(e.target.value)}
                    placeholder="Tìm khoản chi..."
                    className="w-full pl-10 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                  {expSearch && (
                    <button onClick={() => setExpSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                {filteredExpenses.map((item: any, i: number) => {
                  const origIdx = data.expenseStructure.findIndex((e: any) => e.name === item.name);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
                      onClick={() => {
                        if (!onDrilldown) return;
                        const matched = (data.expenseDetails || []).filter((e: any) => e.name === item.name || e.category === item.name);
                        onDrilldown({
                          title: `Chi phí: ${item.name}`,
                          subtitle: `${matched.length} khoản chi`,
                          columns: ['Ngày', 'Tên khoản chi', 'Phân loại', 'Ghi chú', 'Số tiền'],
                          rows: matched.map((e: any) => ({ 'Ngày': new Date(e.date).toLocaleDateString('vi-VN'), 'Tên khoản chi': e.name, 'Phân loại': e.category || 'Khác', 'Ghi chú': e.note || '', 'Số tiền': fmtVnd(e.amount) })),
                          totalLabel: `Tổng ${item.name}`,
                          totalValue: matched.reduce((s: number, e: any) => s + (e.amount || 0), 0),
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[origIdx >= 0 ? origIdx : i % COLORS.length] }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-800">{fmtVnd(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">Chưa có chi phí nào</div>
          )}
        </div>
      </div>

      {/* 3. Doanh số theo loại gói & Tỉ lệ tham gia */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Doanh số theo gói & Tỉ lệ tham gia</h2>
          <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Số lượng & Lượt/ HV</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Gói nào mang lại nhiều tiền nhất và mức độ chăm chỉ của hội viên</p>
        {data.participation?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.participation} layout="vertical"
              onClick={(e: any) => {
                const payload = e?.activePayload?.[0]?.payload;
                if (!payload?.package || !onDrilldown) return;
                const customers = (data.packageDetails || []).filter((p: any) => p.packageName === payload.package);
                onDrilldown({
                  title: `Gói: ${payload.package}`,
                  subtitle: `${customers.length} khách hàng`,
                  columns: ['Khách hàng', 'Giới tính', 'SĐT', 'Giá', 'Bắt đầu', 'Kết thúc'],
                  rows: customers.map((c: any) => ({
                    'Khách hàng': c.customerName,
                    'Giới tính': c.gender === 'Nam' ? 'Nam' : c.gender === 'Nữ' ? 'Nữ' : c.gender || '—',
                    'SĐT': c.phone || '—',
                    'Giá': fmtVnd(c.totalPrice),
                    'Bắt đầu': new Date(c.startDate).toLocaleDateString('vi-VN'),
                    'Kết thúc': new Date(c.endDate).toLocaleDateString('vi-VN'),
                  })),
                  totalLabel: `Tổng doanh thu`,
                  totalValue: payload.revenue,
                });
              }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="package" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v: number, n) => n === 'revenue' ? fmtVnd(v) : [v, '']} />
              <Legend />
              <Bar dataKey="sales" fill="#6366f1" name="Số gói bán" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Doanh thu" radius={[0, 4, 4, 0]} barSize={14} />
              <Line type="monotone" dataKey="participation" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Lượt tham gia / HV" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">Chưa có dữ liệu gói tập</div>
        )}
      </div>

      {/* 4. Top sản phẩm bán chạy */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Top sản phẩm bán chạy</h2>
          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Hàng phụ trợ</span>
        </div>
        {data.topProducts?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => fmtVnd(v)} />
                <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                  {data.topProducts.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Sản phẩm</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">SL</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Doanh thu</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Lợi nhuận</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((item, i) => {
                  const total = data.topProducts.reduce((s, d) => s + d.revenue, 0) || 1;
                  const pct = Math.round((item.revenue / total) * 100);
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        if (!onDrilldown) return;
                        onDrilldown({
                          title: `Sản phẩm: ${item.name}`,
                          subtitle: `${item.quantity} đã bán · Đơn giá: ${fmtVnd(item.price)}`,
                          columns: ['Sản phẩm', 'Đơn giá', 'Giá vốn', 'SL bán', 'Doanh thu', 'Lợi nhuận'],
                          rows: [{ 'Sản phẩm': item.name, 'Đơn giá': fmtVnd(item.price), 'Giá vốn': fmtVnd(item.costPrice), 'SL bán': String(item.quantity), 'Doanh thu': fmtVnd(item.revenue), 'Lợi nhuận': fmtVnd(item.profit) }],
                          totalLabel: 'Tổng doanh thu',
                          totalValue: item.revenue,
                        });
                      }}
                    >
                      <td className="py-2.5 px-2 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(item.revenue)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(item.profit)}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-slate-600 text-xs w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">Chưa có sản phẩm nào</div>
        )}
      </div>

      {/* 5. PHÂN TÍCH HỘI VIÊN */}
      {data.memberAnalytics && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Phân tích hội viên</h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">Retention & ARPU</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Tỷ lệ giữ chân, giá trị TB mỗi hội viên và thời gian sử dụng</p>
          {(() => {
            const m = data.memberAnalytics;
            const cards = [
              { label: 'Hội viên active', value: m.activeMembers, sub: `/${m.totalMembers} tổng`, color: 'bg-blue-500', icon: '👤',
                explain: { title: 'Hội viên active', formula: 'Đếm số khách hàng có ít nhất 1 gói tập còn hiệu lực (end_date >= today)', description: 'Hội viên active là những người đang sở hữu gói tập chưa hết hạn. Đây là chỉ số cơ bản để đo lường quy mô khách hàng hiện tại của phòng gym.', example: 'Nếu có 10 khách hàng đăng ký nhưng chỉ 6 người có gói chưa hết hạn → Active = 6' },
                drill: { title: 'Hội viên đang active', subtitle: `${m.activeMembers} hội viên có gói còn hiệu lực`, columns: ['Họ tên', 'SĐT', 'Gói', 'Ngày bắt đầu', 'Ngày hết hạn', 'Giá trị'], rows: (m.activeList || []).map((r: any) => ({ 'Họ tên': r.name, 'SĐT': r.phone, 'Gói': r.package, 'Ngày bắt đầu': r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—', 'Ngày hết hạn': r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—', 'Giá trị': r.totalPrice ? fmtVnd(r.totalPrice) : '—' })) } },
              { label: 'Tỷ lệ giữ chân', value: `${m.retentionRate}%`, sub: `${m.renewedPackages}/${m.expiredPackages} gói gia hạn`, color: 'bg-green-500', icon: '🔄',
                explain: { title: 'Tỷ lệ giữ chân (Retention Rate)', formula: '(Số gói hết hạn trong kỳ mà khách mua gói mới) / (Tổng số gói hết hạn trong kỳ) × 100%', description: 'Đo lường tỷ lệ khách hàng tiếp tục gia hạn khi gói tập hết hạn. Tỷ lệ giữ chân cao cho thấy dịch vụ tốt, khách hàng hài lòng. Nếu giữ chân = 100% nghĩa là tất cả khách hết hạn đều gia hạn.', example: `Trong kỳ có ${m.expiredPackages} gói hết hạn, ${m.renewedPackages} gói được gia hạn → Tỷ lệ = ${m.retentionRate}%` },
                drill: { title: 'Hội viên giữ chân', subtitle: `${m.renewedPackages} gói hết hạn đã gia hạn`, columns: ['Họ tên', 'SĐT', 'Gói', 'Ngày hết hạn', 'Giá trị'], rows: (m.retainedList || []).map((r: any) => ({ 'Họ tên': r.name, 'SĐT': r.phone, 'Gói': r.package, 'Ngày hết hạn': r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—', 'Giá trị': r.totalPrice ? fmtVnd(r.totalPrice) : '—' })) } },
              { label: 'Tỷ lệ rời bỏ', value: `${m.churnRate}%`, sub: `${m.expiredPackages - m.renewedPackages} gói không gia hạn`, color: 'bg-red-500', icon: '📤',
                explain: { title: 'Tỷ lệ rời bỏ (Churn Rate)', formula: '(Số gói hết hạn trong kỳ KHÔNG gia hạn) / (Tổng số gói hết hạn trong kỳ) × 100% = 100% − Tỷ lệ giữ chân', description: 'Đo lường tỷ lệ khách hàng ngừng sử dụng dịch vụ sau khi gói hết hạn. Tỷ lệ rời bỏ cao là dấu hiệu cần cải thiện chất lượng dịch vụ, giá cả hoặc chương trình khuyến mãi.', example: `Trong kỳ có ${m.expiredPackages} gói hết hạn, ${m.expiredPackages - m.renewedPackages} gói không gia hạn → Tỷ lệ = ${m.churnRate}%` },
                drill: { title: 'Hội viên rời bỏ', subtitle: `${m.expiredPackages - m.renewedPackages} gói hết hạn không gia hạn`, columns: ['Họ tên', 'SĐT', 'Gói', 'Ngày hết hạn', 'Giá trị'], rows: (m.churnedList || []).map((r: any) => ({ 'Họ tên': r.name, 'SĐT': r.phone, 'Gói': r.package, 'Ngày hết hạn': r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—', 'Giá trị': r.totalPrice ? fmtVnd(r.totalPrice) : '—' })) } },
              { label: 'ARPU', value: fmtVnd(m.arpu), sub: 'DT thực thu / HV active', color: 'bg-purple-500', icon: '💰',
                explain: { title: 'ARPU (Average Revenue Per User)', formula: 'Tổng doanh thu thực thu trong kỳ / Số hội viên active', description: 'Doanh thu trung bình mang lại từ mỗi hội viên đang active. Chỉ số này giúp đánh giá giá trị kinh tế của mỗi khách hàng. ARPU càng cao cho thấy khả năng upsell/cross-sell tốt.', example: `DT thực thu = ${fmtVnd(m.arpu * m.activeMembers)}, HV active = ${m.activeMembers} → ARPU = ${fmtVnd(m.arpu)}` },
                drill: null },
              { label: 'Thời gian giữ chân TB', value: `${m.avgLifetime} tháng`, sub: `Hội viên mới: ${m.newMembers}`, color: 'bg-amber-500', icon: '📅',
                explain: { title: 'Thời gian giữ chân trung bình', formula: 'Tổng (thời hạn các gói tập) / Số gói tập', description: 'Thời gian trung bình mà khách hàng sử dụng dịch vụ. Được tính bằng cách lấy tổng thời hạn (duration_months) của tất cả gói tập chia cho số gói. Chỉ số càng cao cho thấy khách hàng trung thành lâu dài.', example: `Tổng thời hạn các gói = X tháng, số gói = Y → TB = ${m.avgLifetime} tháng` },
                drill: { title: 'Hội viên mới trong kỳ', subtitle: `${m.newMembers} hội viên mới đăng ký`, columns: ['Họ tên', 'SĐT', 'Giới tính', 'Ngày đăng ký'], rows: (m.newList || []).map((r: any) => ({ 'Họ tên': r.name, 'SĐT': r.phone, 'Giới tính': r.gender || '—', 'Ngày đăng ký': r.registerDate ? new Date(r.registerDate).toLocaleDateString('vi-VN') : '—' })) } },
              { label: 'Lượt check-in kỳ', value: m.checkinsThisPeriod.toLocaleString(), sub: `${m.expiredPackages} gói hết hạn`, color: 'bg-indigo-500', icon: '✅',
                explain: { title: 'Lượt check-in trong kỳ', formula: 'Đếm số lượt check-in có checkInTime trong khoảng [đầu kỳ, cuối kỳ]', description: 'Tổng số lần hội viên đến phòng gym và quét thẻ/check-in trong kỳ báo cáo. Chỉ số này thể hiện tần suất sử dụng thực tế của khách hàng.', example: `Có ${m.checkinsThisPeriod} lượt check-in trong kỳ này` },
                drill: null },
            ];
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map((c, i) => (
                  <div key={i}
                    onClick={() => c.drill && onDrilldown?.(c.drill)}
                    className={`bg-slate-50 rounded-xl p-4 text-center ${c.drill ? 'cursor-pointer hover:shadow-md hover:bg-white hover:border-indigo-200 border border-transparent transition-all' : ''}`}>
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <p className="text-xl font-bold text-slate-900">{c.value}</p>
                    <p className="text-xs font-medium text-slate-600 mt-1 underline decoration-dotted underline-offset-2 cursor-help hover:text-blue-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onExplain?.(c.explain); }}>{c.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. HIỆU SUẤT HLV */}
      {data.trainerPerformance && data.trainerPerformance.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Hiệu suất HLV</h2>
            <span className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full font-medium">DT & PT Sessions</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Xếp hạng huấn luyện viên theo doanh thu và số buổi tập</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-8">#</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">HLV</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Doanh thu</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Buổi PT</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Khách hàng</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium">Đánh giá</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Hoa hồng</th>
                </tr>
              </thead>
              <tbody>
                {data.trainerPerformance.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{t.name}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">{fmtVnd(t.revenue)}</td>
                    <td className="py-3 px-3 text-right text-slate-700">{t.sessions}</td>
                    <td className="py-3 px-3 text-right text-slate-700">{t.uniqueCustomers}</td>
                    <td className="py-3 px-3 text-center">
                      {t.rating > 0 ? (
                        <span className="text-amber-500 font-medium">★ {t.rating.toFixed(1)}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">{fmtVnd(t.estimatedCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SO SÁNH CLB */}
      {data.clubComparison && data.clubComparison.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">So sánh câu lạc bộ</h2>
            <span className="text-xs bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full font-medium">Revenue & Margin</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">So sánh hiệu quả kinh doanh giữa các chi nhánh trong kỳ</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">CLB</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Doanh thu</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Chi phí</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Lợi nhuận</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium">Margin</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium">Hội viên</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium">HLV</th>
                </tr>
              </thead>
              <tbody>
                {data.clubComparison.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">{fmtVnd(c.revenue)}</td>
                    <td className="py-3 px-3 text-right text-red-600">{fmtVnd(c.expense)}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${c.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtVnd(c.profit)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.margin >= 30 ? 'bg-green-100 text-green-700' : c.margin >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {c.margin}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">{c.memberCount}</td>
                    <td className="py-3 px-3 text-center text-slate-700">{c.trainerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Bar chart so sánh */}
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.clubComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtVnd(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" name="Doanh thu" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f59e0b" name="Chi phí" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Lợi nhuận" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}

function OperationsTab({ data, period, customFrom, customTo, clubName }: { data: any; period?: string; customFrom?: string; customTo?: string; clubName?: string }) {
  if (!data) return <div className="text-slate-400 text-sm">Đang tải dữ liệu vận hành...</div>;
  const opStats = [
    { label: 'Tổng số thiết bị', value: `${data.totalQuantity}`, icon: PackageIcon, color: 'bg-blue-500' },
    { label: 'Giá trị thiết bị', value: fmtVnd(data.totalValue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Tổng báo cáo', value: `${data.totalReports}`, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Chờ xử lý', value: `${data.pendingReports}`, trend: 'up', icon: Wrench, color: 'bg-red-500' },
  ];

  const withPct = (arr: any[]) => arr.map((i: any) => ({ ...i, pct: pct(i.value, arr.reduce((s: number, x: any) => s + x.value, 0)) }));

  const periodLabel = customFrom && customTo ? `${customFrom} → ${customTo}` : (period ? (PERIODS.find(p => p.key === period)?.label || period) : '');

  const handleExport = async () => {
    const clubSuffix = clubName && clubName !== 'Tất cả câu lạc bộ' ? `_${clubName.replace(/\s+/g, '_')}` : '';
    await exportOperationsExcel(data, periodLabel, `BaoCaoVanHanh${clubSuffix}_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, clubName);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{opStats.map((stat, i) => <StatCard key={i} stat={stat} />)}</div>
      <ExportBtn onClick={handleExport} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tình trạng thiết bị */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tình trạng thiết bị</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.equipmentStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.equipmentStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} máy`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.equipmentStatus.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loại báo cáo hỏng hóc */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Phân loại sự cố thiết bị</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.equipmentReports}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} báo cáo`, '']} />
              <Bar dataKey="value" name="Số báo cáo" radius={[6, 6, 0, 0]}>
                {data.equipmentReports.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lịch sử báo cáo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Lịch sử báo cáo sự cố</h2>
        </div>
        {(() => {
          const reports = (data.reportDetails || [])
            .filter(r => r.statusType && r.statusType !== 'hoạt động')
            .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
          return reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Thiết bị</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Loại sự cố</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">Số máy</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Lý do</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Thời gian</th>
                    <th className="text-center py-3 px-4 text-slate-500 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{r.equipmentName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.statusType === 'bảo trì' ? 'bg-amber-100 text-amber-700' :
                          r.statusType === 'hỏng' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.statusType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.affectedQuantity}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={r.reason}>{r.reason || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.reportedAt ? new Date(r.reportedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {r.status === 'pending' ? 'Chờ xử lý' : 'Hoàn thành'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Chưa có báo cáo sự cố nào</p>
          );
        })()}
      </div>


    </>
  );
}

/* ─── Metric detail data ─── */
const METRIC_CLASSES: Record<string, { iconBg: string; iconText: string; formulaBg: string; formulaBorder: string; formulaText: string; dot: string }> = {
  realCashIn: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', formulaBg: 'bg-emerald-50', formulaBorder: 'border-emerald-200', formulaText: 'text-emerald-800', dot: 'bg-emerald-400' },
  accrualRevenue: { iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', formulaBg: 'bg-indigo-50', formulaBorder: 'border-indigo-200', formulaText: 'text-indigo-800', dot: 'bg-indigo-400' },
  netCashFlow: { iconBg: 'bg-cyan-100', iconText: 'text-cyan-600', formulaBg: 'bg-cyan-50', formulaBorder: 'border-cyan-200', formulaText: 'text-cyan-800', dot: 'bg-cyan-400' },
  totalExpense: { iconBg: 'bg-orange-100', iconText: 'text-orange-600', formulaBg: 'bg-orange-50', formulaBorder: 'border-orange-200', formulaText: 'text-orange-800', dot: 'bg-orange-400' },
  totalProfit: { iconBg: 'bg-green-100', iconText: 'text-green-600', formulaBg: 'bg-green-50', formulaBorder: 'border-green-200', formulaText: 'text-green-800', dot: 'bg-green-400' },
};

const METRIC_INFO: Record<string, { title: string; icon: any; color: string; formula: string; description: string; details: string[] }> = {
  realCashIn: {
    title: 'Doanh thu thực thu',
    icon: Wallet,
    color: 'emerald',
    formula: 'Doanh thu thực thu = Tổng tiền khách đã thanh toán vào ví',
    description: 'Là số tiền mặt thực tế phòng tập đã thu từ khách hàng, ghi nhận ngay khi khách đóng tiền mua gói tập.',
    details: [
      'Nguồn dữ liệu: Giao dịch nạp tiền trong ví (loại giao dịch = "nạp tiền")',
      'Chỉ tính các giao dịch đã xác nhận thành công',
      'Tính cả khi khách đóng trước nhiều tháng (ví dụ đóng 6 tháng 1 lần = 6 triệu thực thu ngay)',
      'Là chỉ số quan trọng nhất để theo dõi dòng tiền mặt thực tế của phòng tập',
    ],
  },
  accrualRevenue: {
    title: 'Doanh thu ghi nhận (theo kỳ kế toán)',
    icon: DollarSign,
    color: 'indigo',
    formula: 'Doanh thu ghi nhận = Tổng giá trị gói ÷ Số tháng × Số tháng đã sử dụng',
    description: 'Là doanh thu được phân bổ đều theo thời gian khách sử dụng. Ví dụ: gói 6 tháng = 6 triệu → mỗi tháng ghi nhận 1 triệu.',
    details: [
      'Công thức: Giá trị gói chia đều cho số tháng duration, nhân với số tháng đã đi qua',
      'Số tháng đã đi qua = Tháng hiện tại − Tháng bắt đầu + 1 (tối đa bằng số tháng của gói)',
      'Chỉ tính gói còn hiệu lực: bắt đầu trước hôm nay và kết thúc sau hôm nay',
      'Phản ánh đúng doanh thu "thuộc về" kỳ hiện tại, hợp lý hơn thực thu',
      'Ví dụ: Khách đóng 6 triệu gói 6 tháng → thực thu = 6 triệu ngay, ghi nhận = 1 triệu/tháng',
    ],
  },
  netCashFlow: {
    title: 'Dòng tiền ròng (Tích lũy)',
    icon: Wallet,
    color: 'cyan',
    formula: 'Dòng tiền ròng = Tổng tiền thu từ đầu − Tổng tiền chi từ đầu',
    description: 'Số tiền mặt hiện có tính đến thời điểm hiện tại. Không thay đổi khi chọn kỳ (tháng/quý/năm) vì đây là giá trị tích lũy.',
    details: [
      'Tổng tiền thu từ đầu: Tổng gói tập đã thanh toán + Nạp ví + Book HLV',
      'Tổng tiền chi từ đầu: Tổng chi phí cố định (điện, nước, mặt bằng...) + Tổng tiền nhập hàng',
      'Giá trị này KHÔNG phụ thuộc kỳ đã chọn - nó là số tiền mặt tích lũy thực tế',
      'Dòng tiền ròng > 0 → Phòng đang có tiền mặt dương',
      'Dòng tiền ròng < 0 → Phòng đang âm tiền mặt cần bổ sung',
    ],
  },
  totalExpense: {
    title: 'Tổng chi phí',
    icon: Activity,
    color: 'orange',
    formula: 'Tổng chi phí = Chi phí cố định + Giá vốn hàng bán (COGS) + Khấu hao thiết bị',
    description: 'Tổng hợp tất cả chi phí phát sinh trong kỳ: chi phí cố định hằng tháng, giá vốn hàng đã bán và khấu hao thiết bị.',
    details: [
      'Chi phí cố định: Tổng khoản chi có phân loại "chi phí cố định" (tiền điện, nước, mặt bằng, nhân công...)',
      'Giá vốn hàng bán (COGS): Giá vốn × Số lượng đã bán trong kỳ (chỉ tính hàng đã bán, không tính hàng tồn kho)',
      'Khấu hao thiết bị: Nguyên giá chia đều 60 tháng (5 năm), chỉ tính từ tháng mua đến nay',
      'Nếu phòng có nhiều thiết bị mới mua → khấu hao tháng cao → tổng chi phí lớn',
    ],
  },
  totalProfit: {
    title: 'Lợi nhuận',
    icon: PiggyBank,
    color: 'green',
    formula: 'Lợi nhuận = Doanh thu ghi nhận − Tổng chi phí',
    description: 'Lợi nhuận ròng sau khi trừ toàn bộ chi phí khỏi doanh thu ghi nhận theo kỳ kế toán.',
    details: [
      'Lợi nhuận = Doanh thu ghi nhận − Tổng chi phí',
      'Biên lợi nhuận (%) = Lợi nhuận ÷ Doanh thu ghi nhận × 100%',
      'Dùng doanh thu ghi nhận (không phải thực thu) để phản ánh đúng hiệu quả kinh doanh',
      'Nếu lợi nhuận âm → phòng đang kinh doanh không có lời trong kỳ này',
      'Biên lợi nhuận trên 50% → kinh doanh hiệu quả',
    ],
  },
};

const PERIOD_LABELS: Record<string, string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

function FormulaDetailModal({ metric, data, periodData, loading, onClose }: {
  metric: string;
  data: any;
  periodData: Record<string, any>;
  loading: boolean;
  onClose: () => void;
}) {
  if (!metric || !METRIC_INFO[metric]) return null;
  const info = METRIC_INFO[metric];
  const cls = METRIC_CLASSES[metric];
  const Icon = info.icon;
  const s = data?.summary || {};
  const [detailTab, setDetailTab] = useState<'formula' | 'transactions'>('formula');
  const [txFilter, setTxFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState('');

  const breakdownRows = ['week', 'month', 'quarter', 'year'].map(p => {
    const ps = periodData[p];
    const val = ps ? ps[metric] : null;
    return { key: p, label: PERIOD_LABELS[p], value: val };
  });

  const getTransactionData = () => {
    switch (metric) {
      case 'realCashIn': {
        const items = data?.revenueDetails || [];
        return {
          columns: ['Ngày', 'Loại giao dịch', 'Khách hàng', 'Nội dung', 'Số tiền'],
          rows: items.map((r: any) => ({
            date: r.date,
            type: r.type,
            customer: r.customerName,
            detail: r.name,
            amount: r.amount,
          })),
          types: [...new Set(items.map((r: any) => r.type))],
          filterKey: 'type',
          totalLabel: 'Tổng thực thu',
          totalValue: items.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
        };
      }
      case 'accrualRevenue': {
        const items = data?.accrualDetails || [];
        return {
          columns: ['Gói tập', 'Khách hàng', 'Tổng giá', 'Thời hạn', 'Ghi nhận/tháng', 'Tháng đã qua', 'Tổng ghi nhận'],
          rows: items.map((r: any) => ({
            packageName: r.packageName,
            customer: r.customerName,
            totalPrice: r.totalPrice,
            duration: `${r.duration} tháng`,
            monthlyRevenue: r.monthlyRevenue,
            monthsElapsed: r.monthsElapsed,
            amount: r.accrualAmount,
          })),
          types: [...new Set(items.map((r: any) => r.packageName))],
          filterKey: 'packageName',
          totalLabel: 'Tổng ghi nhận',
          totalValue: items.reduce((sum: number, r: any) => sum + (r.accrualAmount || 0), 0),
        };
      }
      case 'totalExpense': {
        const items = data?.expenseDetails || [];
        return {
          columns: ['Ngày', 'Tên khoản chi', 'Phân loại', 'Ghi chú', 'Số tiền'],
          rows: items.map((r: any) => ({
            date: r.date,
            name: r.name,
            category: r.category || 'Khác',
            note: r.note || '',
            amount: r.amount,
          })),
          types: [...new Set(items.map((r: any) => r.category || 'Khác'))],
          filterKey: 'category',
          totalLabel: 'Tổng chi phí',
          totalValue: items.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
        };
      }
      case 'netCashFlow':
        return {
          columns: ['Chỉ số', 'Giá trị'],
          rows: [
            { label: 'Tổng tiền thu (thực thu)', amount: s.realCashIn || 0 },
            { label: 'Tổng chi phí kỳ này', amount: -(s.totalExpense || 0) },
          ],
          types: [],
          filterKey: '',
          totalLabel: 'Dòng tiền ròng',
          totalValue: (s.realCashIn || 0) - (s.totalExpense || 0),
        };
      case 'totalProfit':
        return {
          columns: ['Chỉ số', 'Giá trị'],
          rows: [
            { label: 'Doanh thu ghi nhận', amount: s.accrualRevenue || 0 },
            { label: 'Tổng chi phí', amount: -(s.totalExpense || 0) },
          ],
          types: [],
          filterKey: '',
          totalLabel: 'Lợi nhuận',
          totalValue: s.totalProfit || 0,
        };
      default:
        return { columns: [], rows: [], types: [], filterKey: '', totalLabel: '', totalValue: 0 };
    }
  };

  const txData = getTransactionData();
  const filteredRows = (() => {
    let rows = txFilter === 'all' ? txData.rows : txData.rows.filter((r: any) => r[txData.filterKey] === txFilter);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      rows = rows.filter((r: any) =>
        Object.values(r).some((v: any) => v != null && String(v).toLowerCase().includes(q))
      );
    }
    return rows;
  })();

  const formatDate = (d: any) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          <div className={`${cls.iconBg} p-3 rounded-xl`}>
            <Icon className={`w-6 h-6 ${cls.iconText}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{info.title}</h3>
            <p className="text-sm text-slate-500">Chi tiết & cách tính</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            onClick={() => setDetailTab('formula')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === 'formula' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Công thức & cách tính
          </button>
          <button
            onClick={() => setDetailTab('transactions')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === 'transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Chi tiết giao dịch
          </button>
        </div>

        {detailTab === 'formula' ? (
          <>
            {/* Current value */}
            <div className="px-6 pt-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Giá trị kỳ hiện tại</p>
                <p className="text-2xl font-bold text-slate-900">{fmtVnd(s[metric] || 0)}</p>
              </div>
            </div>
            {/* Formula */}
            <div className="px-6 pt-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Công thức tính</h4>
              <div className={`${cls.formulaBg} border ${cls.formulaBorder} rounded-xl p-4`}>
                <p className={`text-sm font-mono font-medium ${cls.formulaText}`}>{info.formula}</p>
              </div>
            </div>
            {/* Description */}
            <div className="px-6 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Giải thích</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{info.description}</p>
            </div>
            {/* Details */}
            <div className="px-6 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Chi tiết cách tính</h4>
              <ul className="space-y-2">
                {info.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${cls.dot} shrink-0`} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            {/* Period breakdown */}
            <div className="px-6 pt-5 pb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">So sánh theo khoảng thời gian</h4>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-sm text-slate-500 ml-2">Đang tải...</span>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-2.5 px-4 text-slate-600 font-medium">Khoảng thời gian</th>
                        <th className="text-right py-2.5 px-4 text-slate-600 font-medium">Giá trị</th>
                        <th className="text-right py-2.5 px-4 text-slate-600 font-medium">Thay đổi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownRows.map((r, i) => {
                        const prev = i > 0 ? breakdownRows[i - 1].value : null;
                        const change = r.value && prev ? ((r.value - prev) / (prev || 1)) * 100 : null;
                        return (
                          <tr key={r.key} className={`border-b border-slate-50 ${r.key === 'month' ? 'bg-indigo-50' : ''}`}>
                            <td className="py-2.5 px-4 text-slate-700 font-medium">
                              {r.label}
                              {r.key === 'month' && <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">hiện tại</span>}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                              {r.value != null ? fmtVnd(r.value) : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {change != null ? (
                                <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* TRANSACTIONS TAB */
          <div className="px-6 py-5">
            {/* Filter */}
            {txData.types.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setTxFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${txFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tất cả ({txData.rows.length})
                </button>
                {txData.types.map((t: string) => {
                  const count = txData.rows.filter((r: any) => r[txData.filterKey] === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setTxFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${txFilter === t ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {t} ({count})
                    </button>
                  );
                })}
              </div>
            )}
            {/* Search */}
            {txData.rows.length > 3 && (
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)}
                  placeholder="Tìm kiếm giao dịch..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                {txSearch && (
                  <button onClick={() => setTxSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            )}

            {/* Transaction table */}
            {filteredRows.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                      <tr>
                        {txData.columns.map((col: string) => (
                          <th key={col} className={`py-2.5 px-3 text-slate-600 font-medium ${col === 'Số tiền' || col === 'Tổng ghi nhận' || col === 'Tổng giá' || col === 'Ghi nhận/tháng' ? 'text-right' : 'text-left'}`}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                          {txData.columns.map((col: string) => {
                            let val = '';
                            if (col === 'Ngày') val = formatDate(row.date);
                            else if (col === 'Loại giao dịch') val = row.type || '';
                            else if (col === 'Khách hàng') val = row.customer || row.customerName || '';
                            else if (col === 'Nội dung') val = row.detail || row.name || '';
                            else if (col === 'Gói tập') val = row.packageName || '';
                            else if (col === 'Tổng giá') val = row.totalPrice != null ? fmtVnd(row.totalPrice) : '';
                            else if (col === 'Thời hạn') val = row.duration || '';
                            else if (col === 'Ghi nhận/tháng') val = row.monthlyRevenue != null ? fmtVnd(row.monthlyRevenue) : '';
                            else if (col === 'Tháng đã qua') val = `${row.monthsElapsed || 0}/${row.duration?.toString().replace(' tháng', '') || '?'}`;
                            else if (col === 'Phân loại') val = row.category || '';
                            else if (col === 'Ghi chú') val = row.note || '';
                            else if (col === 'Số tiền') val = row.amount != null ? fmtVnd(row.amount) : '';
                            else if (col === 'Tổng ghi nhận') val = row.amount != null ? fmtVnd(row.amount) : '';
                            else if (col === 'Chỉ số') val = row.label || '';
                            else if (col === 'Giá trị') val = row.amount != null ? fmtVnd(Math.abs(row.amount)) : '';

                            const isMoney = ['Số tiền', 'Tổng giá', 'Ghi nhận/tháng', 'Tổng ghi nhận', 'Giá trị'].includes(col);
                            return (
                              <td key={col} className={`py-2.5 px-3 ${isMoney ? 'text-right font-medium text-slate-800' : 'text-slate-700'}`}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Total footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{txData.totalLabel}</span>
                  <span className="text-sm font-bold text-slate-900">{fmtVnd(txData.totalValue)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Wallet className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Chưa có giao dịch nào trong kỳ này</p>
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Drilldown Modal (for chart/table click) ─── */
function DrilldownModal({ title, subtitle, columns, rows, totalLabel, totalValue, onClose }: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: any[];
  totalLabel?: string;
  totalValue?: number;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row: any) =>
      columns.some((col: string) => {
        const val = row[col];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search */}
        {rows.length > 3 && (
          <div className="px-5 pt-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredRows.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    {columns.map((col: string) => (
                      <th key={col} className={`py-2.5 px-3 text-slate-600 font-medium ${['Số tiền', 'Doanh thu', 'Lợi nhuận', 'Giá trị'].includes(col) ? 'text-right' : 'text-left'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      {columns.map((col: string) => {
                        const isMoney = ['Số tiền', 'Doanh thu', 'Lợi nhuận', 'Giá trị'].includes(col);
                        return (
                          <td key={col} className={`py-2.5 px-3 ${isMoney ? 'text-right font-medium text-slate-800' : 'text-slate-700'}`}>
                            {row[col] ?? '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">{search ? 'Không tìm thấy kết quả' : 'Không có dữ liệu chi tiết'}</p>
            </div>
          )}
        </div>

        {/* Total + Close */}
        {totalLabel && totalValue != null && (
          <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">{totalLabel}</span>
            <span className="text-sm font-bold text-slate-900">{fmtVnd(totalValue)}</span>
          </div>
        )}
        <div className="px-5 pb-4">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
