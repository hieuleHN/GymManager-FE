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
import { exportToExcel } from '../../../lib/exportExcel';
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
    cashRevenue: 680_000_000, accrualRevenue: 720_000_000, realCashIn: 1_050_000_000,
    totalExpense: 280_000_000, totalProfit: 440_000_000, profitMargin: 61,
    change: { realCashIn: 0, accrualRevenue: 0, totalExpense: 0, totalProfit: 0 },
  },
  cashFlowData: MONTHS.map((m, i) => ({ month: m, cash: [120, 150, 140, 180, 200, 230, 210, 250, 240, 270, 260, 290][i] * 1000_000, revenue: [130, 160, 150, 190, 210, 240, 220, 260, 250, 280, 270, 300][i] * 1000_000 })),
  profitData: MONTHS.map((m, i) => { const rev = [130, 160, 150, 190, 210, 240, 220, 260, 250, 280, 270, 300][i] * 1000_000; const exp = [50, 60, 55, 70, 65, 80, 75, 85, 80, 90, 85, 95][i] * 1000_000; return { month: m, revenue: rev, expense: exp, profit: rev - exp }; }),
  expenseStructure: [
    { name: 'Thiết bị', value: 120_000_000 },
    { name: 'Tiện ích', value: 80_000_000 },
    { name: 'Thuế/Phí', value: 50_000_000 },
    { name: 'Khác', value: 30_000_000 },
  ],
  packageSalesData: [
    { package: '1 tháng', sales: 120, revenue: 120_000_000 },
    { package: '3 tháng', sales: 280, revenue: 560_000_000 },
    { package: '6 tháng', sales: 350, revenue: 1_050_000_000 },
    { package: '12 tháng', sales: 550, revenue: 2_750_000_000 },
  ],
  participation: [
    { package: '1 tháng', sales: 120, revenue: 120_000_000, participation: 18 },
    { package: '3 tháng', sales: 280, revenue: 560_000_000, participation: 34 },
    { package: '6 tháng', sales: 350, revenue: 1_050_000_000, participation: 52 },
    { package: '12 tháng', sales: 550, revenue: 2_750_000_000, participation: 88 },
  ],
  topProducts: [
    { name: 'Whey Protein', price: 300_000, quantity: 85, revenue: 25_500_000 },
    { name: 'BCAA', price: 200_000, quantity: 62, revenue: 12_400_000 },
    { name: 'Pre-Workout', price: 300_000, quantity: 48, revenue: 14_400_000 },
    { name: 'Creatine', price: 150_000, quantity: 72, revenue: 10_800_000 },
    { name: 'Vitamin', price: 100_000, quantity: 95, revenue: 9_500_000 },
  ],
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
  const { selectedClub } = useClub();

  const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';

  const validateCustomDate = (from: string, to: string) => {
    if (!from || !to) { setDateError('Vui lòng chọn cả ngày bắt đầu và kết thúc'); return false; }
    const f = new Date(from);
    const t = new Date(to);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (f > t) { setDateError('Ngày bắt đầu phải trước ngày kết thúc'); return false; }
    if (t > today) { setDateError('Ngày kết thúc không được lớn hơn hôm nay'); return false; }
    const diffMonths = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
    if (diffMonths > 24) { setDateError('Khoảng thời gian tối đa 2 năm'); return false; }
    setDateError('');
    return true;
  };

  const isCustomValid = !showCustomDate || (customFrom && customTo && !dateError);

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

        {tab === 'finance' && <FinanceTab data={fd} period={period} />}
        {tab === 'operations' && <OperationsTab data={od} />}
        {tab === 'activity' && <ActivityStats />}
      </div>
    </AdminLayout>
  );
}

function StatCard({ stat }: { stat: any }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`${stat.color} p-2.5 rounded-xl`}><Icon className="w-5 h-5 text-white" /></div>
        <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{stat.change}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
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

function FinanceTab({ data, period }: { data: any; period: string }) {
  if (!data?.summary) return <div className="text-slate-400 text-sm">Đang tải dữ liệu tài chính...</div>;
  const s = data.summary;
  const c = s.change || {};
  const stats = [
    { label: 'Doanh thu thực thu', value: fmtVnd(s.realCashIn), change: fmtChange(c.realCashIn ?? 0), trend: (c.realCashIn ?? 0) >= 0 ? 'up' : 'down', icon: Wallet, color: 'bg-emerald-500' },
    { label: 'Doanh thu ghi nhận', value: fmtVnd(s.accrualRevenue), change: fmtChange(c.accrualRevenue ?? 0), trend: (c.accrualRevenue ?? 0) >= 0 ? 'up' : 'down', icon: DollarSign, color: 'bg-indigo-500' },
    { label: 'Tổng chi phí', value: fmtVnd(s.totalExpense), change: fmtChange(c.totalExpense ?? 0), trend: (c.totalExpense ?? 0) >= 0 ? 'down' : 'up', icon: Activity, color: 'bg-orange-500' },
    { label: 'Lợi nhuận', value: fmtVnd(s.totalProfit), change: fmtChange(c.totalProfit ?? 0), trend: (c.totalProfit ?? 0) >= 0 ? 'up' : 'down', icon: PiggyBank, color: 'bg-green-500' },
  ];

  const summaryRows = [
    { key: 'realCashIn', label: 'Doanh thu thực thu' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhận' },
    { key: 'totalExpense', label: 'Tổng chi phí' },
    { key: 'totalProfit', label: 'Lợi nhuận' },
  ];

  const handleExport = () => {
    exportToExcel([
      { name: 'Tong quan', headers: ['Chỉ số', 'Giá trị', 'Thay đổi (%)'], data: [{ 'Chỉ số': 'Kỳ báo cáo', 'Giá trị': period, 'Thay đổi (%)': '' }, ...summaryRows.map(r => ({ 'Chỉ số': r.label, 'Giá trị': s[r.key], 'Thay đổi (%)': changeStr(c[r.key]) })), { 'Chỉ số': 'Biên lợi nhuận', 'Giá trị': `${s.profitMargin}%`, 'Thay đổi (%)': '' }] },
      { name: 'So sanh ky truoc', headers: ['Chỉ số', 'Kỳ này', 'Kỳ trước', 'Thay đổi'], data: summaryRows.map(r => ({ 'Chỉ số': r.label, 'Kỳ này': s[r.key], 'Kỳ trước': prevVal(s[r.key], c[r.key]), 'Thay đổi': changeStr(c[r.key]) })) },
      { name: 'Chi phi theo loai', headers: ['Loại chi phí', 'Số tiền', 'Tỷ trọng (%)'], data: data.expenseStructure.map((i: any) => ({ 'Loại chi phí': i.name, 'Số tiền': i.value, 'Tỷ trọng (%)': pct(i.value, data.expenseStructure.reduce((s: number, x: any) => s + x.value, 0)) })) },
      { name: 'Top san pham', headers: ['Sản phẩm', 'Đơn giá', 'Giá vốn', 'SL bán', 'Doanh thu', 'Lợi nhuận', 'Tỷ trọng (%)'], data: data.topProducts.map((i: any) => ({ 'Sản phẩm': i.name, 'Đơn giá': i.price, 'Giá vốn': i.costPrice, 'SL bán': i.quantity, 'Doanh thu': i.revenue, 'Lợi nhuận': i.profit, 'Tỷ trọng (%)': pct(i.revenue, data.topProducts.reduce((s: number, x: any) => s + x.revenue, 0)) })) },
      { name: 'Dong tien chi tiet', headers: ['Tháng', 'Tiền thực thu', 'Tiền ghi nhận', 'Chi phí', 'Lợi nhuận', '% DT ghi nhận'], data: data.cashFlowData.map((cf: any, idx: number) => { const pd = data.profitData?.[idx] || {}; return { 'Tháng': cf.month, 'Tiền thực thu': cf.cash, 'Tiền ghi nhận': cf.revenue, 'Chi phí': pd.expense ?? 0, 'Lợi nhuận': pd.profit ?? 0, '% DT ghi nhận': pct(cf.cash, cf.revenue) }; }) },
      { name: 'Khau hao thiet bi', headers: ['Thiết bị', 'Nguyên giá', 'Khấu hao/tháng', 'Tháng đã dùng', 'Đã khấu hao', 'Giá trị còn lại'], data: (data.depreciationDetail || []).map((d: any) => ({ 'Thiết bị': d.name, 'Nguyên giá': d.total, 'Khấu hao/tháng': d.monthlyDepreciation, 'Tháng đã dùng': d.monthsActive, 'Đã khấu hao': d.totalDepreciated, 'Giá trị còn lại': d.remainingValue })) },
    ], `BaoCaoTaiChinh_${period}_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat, i) => <StatCard key={i} stat={stat} />)}</div>
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.expenseStructure} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.expenseStructure.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.expenseStructure.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-800">{fmtVnd(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Doanh số theo loại gói & Tỉ lệ tham gia */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Doanh số theo gói & Tỉ lệ tham gia</h2>
          <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Số lượng & Lượt/ HV</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Gói nào mang lại nhiều tiền nhất và mức độ chăm chỉ của hội viên</p>
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
      </div>

      {/* 4. Top sản phẩm bán chạy */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Top sản phẩm bán chạy</h2>
          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Hàng phụ trợ</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
              <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                {data.topProducts.map((_, i) => (
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
      </div>
    </>
  );
}

function OperationsTab({ data }: { data: any }) {
  if (!data) return <div className="text-slate-400 text-sm">Đang tải dữ liệu vận hành...</div>;
  const opStats = [
    { label: 'Tổng số thiết bị', value: `${data.totalQuantity}`, icon: PackageIcon, color: 'bg-blue-500' },
    { label: 'Giá trị thiết bị', value: fmtVnd(data.totalValue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Tổng báo cáo', value: `${data.totalReports}`, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Chờ xử lý', value: `${data.pendingReports}`, trend: 'up', icon: Wrench, color: 'bg-red-500' },
  ];

  const withPct = (arr: any[]) => arr.map((i: any) => ({ ...i, pct: pct(i.value, arr.reduce((s: number, x: any) => s + x.value, 0)) }));

  const handleExport = () => {
    exportToExcel([
      { name: 'Tong quan van hanh', headers: ['Chỉ số', 'Giá trị'], data: opStats.map(s => ({ 'Chỉ số': s.label, 'Giá trị': typeof s.value === 'string' ? s.value.replace('₫', '').trim() : s.value })) },
      { name: 'Tinh trang thiet bi', headers: ['Trạng thái', 'Số lượng', 'Tỷ trọng (%)'], data: withPct(data.equipmentStatus).map((i: any) => ({ 'Trạng thái': i.name, 'Số lượng': i.value, 'Tỷ trọng (%)': i.pct })) },
      { name: 'Phan loai su co', headers: ['Loại sự cố', 'Số báo cáo', 'Tỷ trọng (%)'], data: withPct(data.equipmentReports).map((i: any) => ({ 'Loại sự cố': i.name, 'Số báo cáo': i.value, 'Tỷ trọng (%)': i.pct })) },
      { name: 'Chi tiet bao cao', headers: ['Thiết bị', 'Loại sự cố', 'Số máy', 'Lý do', 'Thời gian', 'Trạng thái'], data: (data.reportDetails || []).map((r: any) => ({ 'Thiết bị': r.equipmentName, 'Loại sự cố': r.statusType, 'Số máy': r.affectedQuantity, 'Lý do': r.reason, 'Thời gian': r.reportedAt ? new Date(r.reportedAt).toLocaleDateString('vi-VN') : '', 'Trạng thái': r.status === 'pending' ? 'Chờ xử lý' : 'Hoàn thành' })) },
      { name: 'Thiet bi can bao tri', headers: ['Thiết bị', 'Tổng số', 'Bị ảnh hưởng', 'Trạng thái', 'Báo cáo chờ', 'Bảo hành còn (tháng)'], data: data.needMaintenance.map((i: any) => ({ 'Thiết bị': i.name, 'Tổng số': i.quantity, 'Bị ảnh hưởng': i.affectedQuantity ?? '—', 'Trạng thái': i.status === 'maintenance' ? 'Đang bảo trì' : 'Hoạt động', 'Báo cáo chờ xử lý': i.reports, 'Bảo hành còn (tháng)': i.warrantyLeft ?? '—' })) },
    ], `BaoCaoVanHanh_${new Date().toISOString().slice(0, 10)}`);
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
