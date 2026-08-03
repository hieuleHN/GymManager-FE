import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
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
    totalExpense: 0, totalProfit: 0, profitMargin: 0,
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
  const { selectedClub } = useClub();

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

        {tab === 'finance' && <FinanceTab data={fd} period={period} customFrom={customFrom} customTo={customTo} onStatClick={handleOpenFormula} />}
        {tab === 'operations' && <OperationsTab data={od} period={period} customFrom={customFrom} customTo={customTo} />}
        {tab === 'activity' && <ActivityStats />}
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

function FinanceTab({ data, period, customFrom, customTo, onStatClick }: { data: any; period: string; customFrom?: string; customTo?: string; onStatClick?: (metric: string) => void }) {
  if (!data?.summary) return <div className="text-slate-400 text-sm">Đang tải dữ liệu tài chính...</div>;
  const s = data.summary;
  const c = s.change || {};
  const stats = [
    { key: 'realCashIn', label: 'Doanh thu thực thu', value: fmtVnd(s.realCashIn), change: fmtChange(c.realCashIn ?? 0), trend: (c.realCashIn ?? 0) >= 0 ? 'up' : 'down', icon: Wallet, color: 'bg-emerald-500' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhận', value: fmtVnd(s.accrualRevenue), change: fmtChange(c.accrualRevenue ?? 0), trend: (c.accrualRevenue ?? 0) >= 0 ? 'up' : 'down', icon: DollarSign, color: 'bg-indigo-500' },
    { key: 'totalExpense', label: 'Tổng chi phí', value: fmtVnd(s.totalExpense), change: fmtChange(c.totalExpense ?? 0), trend: (c.totalExpense ?? 0) >= 0 ? 'down' : 'up', icon: Activity, color: 'bg-orange-500' },
    { key: 'totalProfit', label: 'Lợi nhuận', value: fmtVnd(s.totalProfit), change: fmtChange(c.totalProfit ?? 0), trend: (c.totalProfit ?? 0) >= 0 ? 'up' : 'down', icon: PiggyBank, color: 'bg-green-500' },
  ];

  const summaryRows = [
    { key: 'realCashIn', label: 'Doanh thu thực thu' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhận' },
    { key: 'totalExpense', label: 'Tổng chi phí' },
    { key: 'totalProfit', label: 'Lợi nhuận' },
  ];

  const periodLabel = customFrom && customTo ? `${customFrom} → ${customTo}` : (PERIODS.find(p => p.key === period)?.label || period);

  const handleExport = async () => {
    const chartImages = generateChartImages(data);
    await exportFinanceExcel(data, periodLabel, `BaoCaoTaiChinh_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, chartImages.length > 0 ? chartImages : undefined);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat, i) => <StatCard key={i} stat={stat} onClick={onStatClick ? () => onStatClick(stat.key) : undefined} />)}</div>
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
            <Area type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2.5} fill="url(#gCash)" name="Dòng tiền thực thu" />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRev)" name="Doanh thu ghi nhận" />
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
            <ComposedChart data={data.profitData}>
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
                  <Pie data={data.expenseStructure} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {data.expenseStructure.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtVnd(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.expenseStructure.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">{fmtVnd(item.value)}</span>
                  </div>
                ))}
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
            <ComposedChart data={data.participation} layout="vertical">
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
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
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
    </>
  );
}

function OperationsTab({ data, period, customFrom, customTo }: { data: any; period?: string; customFrom?: string; customTo?: string }) {
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
    await exportOperationsExcel(data, periodLabel, `BaoCaoVanHanh_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`);
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
  totalExpense: {
    title: 'Tổng chi phí',
    icon: Activity,
    color: 'orange',
    formula: 'Tổng chi phí = Chi phí cố định + Tiền nhập hàng + Khấu hao thiết bị',
    description: 'Tổng hợp tất cả chi phí phát sinh trong kỳ: chi phí cố định hằng tháng, tiền nhập hàng hóa và khấu hao thiết bị.',
    details: [
      'Chi phí cố định: Tổng khoản chi có phân loại "chi phí cố định" (tiền điện, nước, mặt bằng, nhân công...)',
      'Tiền nhập hàng: Tổng tiền mua hàng hóa (Giá vốn × Số lượng nhập)',
      'Khấu hao thiết bị: Nguyên giá chia đều 60 tháng (5 năm), chỉ tính từ tháng mua đến nay',
      'Chi phí sửa chữa: Nếu có sự cố thiết bị cần sửa, chi phí sửa cũng được cộng vào',
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

  const breakdownRows = ['week', 'month', 'quarter', 'year'].map(p => {
    const ps = periodData[p];
    const val = ps ? ps[metric] : null;
    return { key: p, label: PERIOD_LABELS[p], value: val };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          <div className={`${cls.iconBg} p-3 rounded-xl`}>
            <Icon className={`w-6 h-6 ${cls.iconText}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{info.title}</h3>
            <p className="text-sm text-slate-500">Công thức & cách tính</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

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
