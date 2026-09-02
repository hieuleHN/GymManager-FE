import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, TrendingDown, Activity, DollarSign, Clock,
  AlertTriangle, CheckCircle2, Target, CalendarRange,
  Loader2, Package as PackageIcon, PieChart as PieChartIcon,
  ShoppingBag, Shield, HeartPulse
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Line, ReferenceLine
} from 'recharts';
import { api } from '../../../lib/api';
import { useClub } from '../../context/ClubContext';

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

const fmtVnd = (v: number) => (v ?? 0).toLocaleString('vi-VN') + '₫';
const fmtNum = (v: number) => (v ?? 0).toLocaleString('vi-VN');

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#84cc16', '#e11d48'];
const HEALTH_COLORS: Record<string, string> = { xanh: '#10b981', vàng: '#f59e0b', đỏ: '#ef4444' };
const HEALTH_LABELS: Record<string, string> = { xanh: 'Xanh', vàng: 'Vàng', đỏ: 'Đỏ' };

type TabKey = 'overview' | 'revenue' | 'churn' | 'customers' | 'activity' | 'health';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Tổng quan', icon: PieChartIcon },
  { key: 'revenue', label: 'Doanh thu & Bán vé', icon: DollarSign },
  { key: 'churn', label: 'Churn & Giữ chân', icon: CalendarRange },
  { key: 'customers', label: 'Khách hàng', icon: Users },
  { key: 'activity', label: 'Hoạt động', icon: Activity },
  { key: 'health', label: 'Sức khỏe gói', icon: HeartPulse },
];

export function PackageAnalytics() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState('month');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
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
    setDateError('');
    return true;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/package-analytics?period=${period}${locParam}`;
      if (selectedPkgId) url += `&packageId=${selectedPkgId}`;
      if (showCustomDate && customFrom && customTo) {
        url += `&startDate=${customFrom}&endDate=${customTo}`;
      }
      const result = await api.get(url);
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedClub, selectedPkgId, showCustomDate, customFrom, customTo]);

  const packages = data?.filters?.packages || [];
  const locations = data?.filters?.locations || [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Thống kê & Phân tích gói tập</h1>
          <p className="text-slate-600">Phân tích chuyên sâu hiệu quả từng gói tập, hành vi khách hàng và doanh thu</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 flex-wrap">
            <div className="flex gap-2 bg-slate-50 rounded-xl border border-slate-200 p-1">
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => { setPeriod(p.key); setShowCustomDate(false); setCustomFrom(''); setCustomTo(''); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key && !showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {p.label}
                </button>
              ))}
              <button onClick={() => setShowCustomDate(!showCustomDate)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                Tùy chỉnh
              </button>
            </div>

            {showCustomDate && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 flex-wrap">
                <span className="text-xs text-slate-500">Từ</span>
                <input type="date" value={customFrom}
                  onChange={e => { const v = e.target.value; setCustomFrom(v); if (customTo) validateCustomDate(v, customTo); }}
                  className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customFrom ? 'border-red-300' : 'border-slate-200'}`} />
                <span className="text-xs text-slate-500">Đến</span>
                <input type="date" value={customTo}
                  onChange={e => { const v = e.target.value; setCustomTo(v); if (customFrom) validateCustomDate(customFrom, v); }}
                  className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customTo ? 'border-red-300' : 'border-slate-200'}`} />
                {dateError && <span className="text-xs text-red-500 ml-2">{dateError}</span>}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                <PackageIcon className="w-4 h-4 text-slate-400" />
                <select value={selectedPkgId} onChange={e => setSelectedPkgId(e.target.value)}
                  className="text-sm text-slate-700 focus:outline-none bg-transparent">
                  <option value="">Tất cả gói tập</option>
                  {packages.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                <Users className="w-4 h-4 text-slate-400" />
                <select value={selectedClub === 'all' ? '' : selectedClub} onChange={e => { }} disabled
                  className="text-sm text-slate-700 focus:outline-none bg-transparent">
                  <option value="">{locations.length ? `${locations.length} chi nhánh` : 'Tất cả chi nhánh'}</option>
                </select>
              </div>
            </div>

            {loading && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-slate-200 p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error} — Vui lòng kiểm tra lại kết nối backend.
          </div>
        )}

        {!loading && !error && data && (
          <>
            {tab === 'overview' && <OverviewTab data={data} />}
            {tab === 'revenue' && <RevenueTab data={data} />}
            {tab === 'churn' && <ChurnTab data={data} />}
            {tab === 'customers' && <CustomersTab data={data} />}
            {tab === 'activity' && <ActivityTab data={data} />}
            {tab === 'health' && <HealthTab data={data} />}
          </>
        )}

        {!loading && !data && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
            Không có dữ liệu để hiển thị
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Card({ children, className = '', title, subtitle, badge }: { children: React.ReactNode; className?: string; title?: string; subtitle?: string; badge?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between mb-1">
          {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
          {badge && <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">{badge}</span>}
        </div>
      )}
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
      {(title || badge) && <div style={{ height: subtitle ? 0 : 12 }} />}
      {children}
    </div>
  );
}

function NotEnough() {
  return (
    <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
      <Shield className="w-8 h-8 mb-2" />
      <p className="text-sm font-medium">Chưa đủ dữ liệu</p>
      <p className="text-xs">Cần thêm dữ liệu gói tập & điểm danh thực tế để phân tích mục này</p>
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  const d = data || {};
  const rev = d.revenueByPackage || {};
  const ownership = d.ownership || [];
  const totalOwners = ownership.reduce((s: number, o: any) => s + o.totalOwners, 0);
  const totalRevenue = rev.totalRevenue || 0;
  const totalCheckins = (d.checkInFrequency?.frequencyByPackage || []).reduce((s: number, f: any) => s + f.totalCheckins, 0);
  const activeCount = ownership.reduce((s: number, o: any) => s + o.activeCount, 0);

  const stats = [
    { label: 'Người sở hữu gói', value: fmtNum(totalOwners), icon: Users, color: 'bg-indigo-500' },
    { label: 'Đang hoạt động', value: fmtNum(activeCount), icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Doanh thu', value: fmtVnd(totalRevenue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'ARPU', value: rev.arpu ? fmtVnd(rev.arpu) : '—', icon: Target, color: 'bg-amber-500' },
    { label: 'Tổng lượt check-in', value: fmtNum(totalCheckins), icon: Clock, color: 'bg-purple-500' },
  ];

  const avgCheckin = d.checkInFrequency?.avgCheckinsPerCustomer ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className={`${s.color} p-2.5 rounded-xl w-fit mb-3`}><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Số người sở hữu theo gói" subtitle="Số lượt đăng ký đã thanh toán chia theo gói" >
          {ownership.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ownership}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="packageName" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [fmtNum(v), 'Số người']} />
                <Bar dataKey="totalOwners" name="Số người sở hữu" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Danh sách người đang dùng theo gói" subtitle="Trạng thái hợp đồng hiện tại" >
          {ownership.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-2 text-slate-500 font-medium">Gói</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Tổng</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Đang dùng</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Hết hạn</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {ownership.map((o: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2 font-medium text-slate-800">{o.packageName}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtNum(o.totalOwners)}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-600">{fmtNum(o.activeCount)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-500">{fmtNum(o.expiredCount)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(o.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <NotEnough />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tần suất check-in trung bình / gói" subtitle={`Trung bình toàn hệ thống: ${avgCheckin} lượt/người`} >
          {(d.checkInFrequency?.frequencyByPackage || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.checkInFrequency.frequencyByPackage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="packageName" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: any) => [`${v} lượt`, 'TB check-in']} />
                <Bar dataKey="avgCheckins" name="Lượt check-in TB" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Doanh thu theo gói" subtitle="Tỷ trọng đóng góp vào tổng doanh thu" >
          {(rev.byPackage || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={rev.byPackage} dataKey="revenue" nameKey="packageName" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {(rev.byPackage as any[]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmtVnd(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Thời hạn phổ biến" subtitle="Tỷ lệ khách chọn thời hạn 1/3/6/12 tháng" >
          {(() => {
            const distMap = new Map<number, number>();
            (d.ownership || []).forEach((o: any) => (o.durationDistribution || []).forEach((dd: any) => {
              distMap.set(dd.months, (distMap.get(dd.months) || 0) + dd.count);
            }));
            const dist = [...distMap.entries()].map(([months, count]) => ({ months, count })).sort((a, b) => a.months - b.months);
            const maxCount = dist[0]?.count || 1;
            return dist.length > 0 ? (
              <div className="space-y-3 h-full py-2">
                {dist.slice(0, 6).map((dd: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-slate-600 font-medium">{dd.months} tháng</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dd.count / maxCount) * 100)}%` }} />
                    </div>
                    <span className="text-slate-500 text-xs w-8 text-right">{dd.count}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-sm text-slate-400 py-10 text-center">Chưa có dữ liệu thời hạn</div>;
          })()}
        </Card>
      </div>
    </>
  );
}

function RevenueTab({ data }: { data: any }) {
  const d = data || {};
  const sv = d.salesVelocity || {};
  const rev = d.revenueByPackage || {};
  const fore = d.revenueForecast || {};
  const pareto = d.pareto || {};

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gói bán tháng này', value: fmtNum(sv.thisMonthSales), icon: PackageIcon, color: 'bg-indigo-500' },
          { label: 'Doanh thu tháng này', value: fmtVnd(sv.thisMonthRevenue), icon: DollarSign, color: 'bg-emerald-500' },
          { label: 'Tăng trưởng MoM', value: `${sv.salesGrowthMoM > 0 ? '+' : ''}${sv.salesGrowthMoM ?? 0}%`, icon: sv.salesGrowthMoM >= 0 ? TrendingUp : TrendingDown, color: sv.salesGrowthMoM >= 0 ? 'bg-green-500' : 'bg-red-500' },
          { label: 'ARPU trung bình', value: rev.arpu ? fmtVnd(rev.arpu) : '—', icon: Target, color: 'bg-amber-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className={`${s.color} p-2.5 rounded-xl w-fit mb-3`}><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tốc độ bán gói theo tháng" subtitle="Số gói bán được mỗi tháng trong năm" >
          {(sv.monthlySales || []).some((m: any) => m.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={sv.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? fmtVnd(v) : [v, 'Số gói']} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Số gói bán" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Doanh thu & tỷ trọng theo gói" subtitle={`Tổng ${fmtVnd(rev.totalRevenue)} từ ${fmtNum(rev.totalUsers)} lượt mua`} >
          {(rev.byPackage || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-2 text-slate-500 font-medium">Gói</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Doanh thu</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Tỷ trọng</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">TB/gói</th>
                  </tr>
                </thead>
                <tbody>
                  {rev.byPackage.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2 font-medium text-slate-800">{r.packageName}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(r.revenue)}</td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-600 text-xs w-10 text-right">{r.revenueShare}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, r.revenueShare)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(r.avgPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <NotEnough />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Dự báo doanh thu tháng tới" subtitle={`Doanh thu trung bình/tháng hiện tại: ${fmtVnd(fore.avgMonthlyRevenue)} — dự báo 3 tháng tới`} >
          {(fore.forecast || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fore.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => fmtVnd(v)} />
                <Legend />
                <Bar dataKey="forecastRevenue" name="Dự báo doanh thu" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Pareto 80/20 doanh thu" subtitle={`${pareto.top20PctRevenue ?? '—'}% doanh thu đến từ ${pareto.top20PctPackages ?? '—'}/${pareto.totalPackages ?? '—'} gói`} >
          {(pareto.pareto || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={pareto.pareto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="packageName" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? fmtVnd(v) : [`${v}%`, 'Tích lũy']} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePct" name="% tích lũy" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '80%', position: 'insideTopRight', fontSize: 11, fill: '#f59e0b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>
    </>
  );
}

function ChurnTab({ data }: { data: any }) {
  const d = data || {};
  const cr = d.churnRenewal || {};
  const rt = d.repurchaseTiming || {};
  const cohort = d.retentionCohort || {};
  const cur = cr.current || {};
  const prev = cr.previous || {};

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tỷ lệ gia hạn', value: `${cur.renewalRate ?? '—'}%`, change: `MoM ${cr.renewalChangeMoM ?? 0}%`, icon: CheckCircle2, color: 'bg-green-500' },
          { label: 'Tỷ lệ churn', value: `${cur.churnRate ?? '—'}%`, change: `MoM ${cr.churnChangeMoM ?? 0}%`, icon: TrendingDown, color: 'bg-red-500' },
          { label: 'Chu kỳ mua lại TB', value: rt.avgRepurchaseDays ? `${rt.avgRepurchaseDays} ngày` : '—', change: `${rt.repurchaseCount ?? 0} lần mua lại`, icon: CalendarRange, color: 'bg-indigo-500' },
          { label: 'Cohort M1', value: cohort.cohorts?.length ? `${cohort.cohorts[cohort.cohorts.length - 1]?.retainedMonth1 ?? '—'}%` : '—', change: 'Giữ chân tháng +1', icon: Users, color: 'bg-amber-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className={`${s.color} p-2.5 rounded-xl w-fit mb-3`}><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Gia hạn vs Churn (tháng hiện tại vs tháng trước)" subtitle="So sánh MoM với kỳ trước" >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              { name: 'Tỷ lệ gia hạn', current: cur.renewalRate ?? 0, previous: prev.renewalRate ?? 0 },
              { name: 'Tỷ lệ churn', current: cur.churnRate ?? 0, previous: prev.churnRate ?? 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Legend />
              <Bar dataKey="current" name="Kỳ hiện tại" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="previous" name="Kỳ trước" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Retention Cohort 1/2/3 tháng" subtitle="Tỷ lệ khách còn duy trì sau tháng thứ 1, 2, 3" >
          {cohort.cohorts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cohort.cohorts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="cohortMonth" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => v == null ? 'Chưa đủ thời gian' : `${v}%`} />
                <Legend />
                <Bar dataKey="retainedMonth1" name="Tháng +1" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="retainedMonth2" name="Tháng +2" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="retainedMonth3" name="Tháng +3" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Thời điểm mua theo tháng" subtitle="Số gói bán theo từng tháng trong năm" >
          {(rt.purchaseByMonth || []).some((m: any) => m.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={rt.purchaseByMonth}>
                <defs>
                  <linearGradient id="gMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} gói`, 'Lượt mua']} />
                <Area type="monotone" dataKey="count" name="Lượt mua" stroke="#8b5cf6" strokeWidth={2} fill="url(#gMonth)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Thời điểm mua theo giờ" subtitle="Khung giờ khách đăng ký/mua gói nhiều nhất" >
          {(rt.purchaseByHour || []).some((h: any) => h.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rt.purchaseByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} gói`, 'Lượt mua']} />
                <Bar dataKey="count" name="Lượt mua" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>

      <Card title="Biểu đồ doanh số theo tuần/tháng" subtitle="Lịch sử doanh thu theo tháng" >
        {(d.salesVelocity?.monthlySales || []).some((m: any) => m.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={d.salesVelocity.monthlySales}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => fmtVnd(v)} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2.5} fill="url(#gSales)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <NotEnough />}
      </Card>
    </>
  );
}

function CustomersTab({ data }: { data: any }) {
  const d = data || {};
  const demog = d.demographics || {};
  const multi = d.multiPackageAnalysis || {};
  const top = d.checkInFrequency?.topCustomers || [];

  const genderCombined = (demog.genderByPackage || []).reduce((acc: any[], g: any) => {
    const existing = acc.find(a => a.packageName === g.packageName);
    if (existing) { existing.male += g.male; existing.female += g.female; existing.other += g.other; }
    else acc.push({ ...g });
    return acc;
  }, []);

  const genderData = [
    { name: 'Nam', value: genderCombined.reduce((s: number, g: any) => s + g.male, 0) },
    { name: 'Nữ', value: genderCombined.reduce((s: number, g: any) => s + g.female, 0) },
    { name: 'Khác', value: genderCombined.reduce((s: number, g: any) => s + g.other, 0) },
  ].filter(g => g.value > 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top khách tập nhiều" subtitle="Khách có số lượt check-in cao nhất" badge="Top 20">
          {top.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-2 text-slate-500 font-medium">#</th>
                    <th className="text-left py-2.5 px-2 text-slate-500 font-medium">Khách hàng</th>
                    <th className="text-right py-2.5 px-2 text-slate-500 font-medium">Lượt check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-800">{c.fullName}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-indigo-600">{c.checkInCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <NotEnough />}
        </Card>

        <div className="space-y-6">
          <Card title="Phân bố giới tính người mua" subtitle="Theo giới tính trên toàn bộ gói">
            {genderData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="45%" height={200}>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {genderData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [fmtNum(v), 'Người']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {genderData.map((g: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{g.name}</span>
                      <span className="font-semibold text-slate-800 ml-auto">{fmtNum(g.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <NotEnough />}
          </Card>

          <Card title="Khách mua nhiều gói" subtitle="Khách đăng ký từ 2 gói trở lên" badge={`${multi.multiPkgCount ?? 0} khách`}>
            {multi.multiPkgCount > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-slate-600">Tỷ lệ nâng cấp (gói giá cao hơn)</span>
                  <span className="font-bold text-indigo-600">{multi.upgradeRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-slate-600">Số lần nâng cấp</span>
                  <span className="font-bold text-indigo-600">{multi.upgradeCount ?? 0}</span>
                </div>
                {multi.coPurchases?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 mt-3">Gói mua kèm phổ biến</p>
                    {multi.coPurchases.slice(0, 6).map((cp: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm py-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate">{cp.pair}</span>
                        <span className="text-slate-400 text-xs ml-auto">{cp.count} khách</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <NotEnough />}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Phân bố độ tuổi theo gói" subtitle="Nhóm tuổi của người mua từng gói" className="lg:col-span-2">
          {(demog.ageByPackage || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demog.ageByPackage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="packageName" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [fmtNum(v), 'Người']} />
                <Legend />
                <Bar dataKey="< 18" name="< 18" stackId="a" fill="#94a3b8" />
                <Bar dataKey="18-24" name="18-24" stackId="a" fill="#06b6d4" />
                <Bar dataKey="25-34" name="25-34" stackId="a" fill="#6366f1" />
                <Bar dataKey="35-44" name="35-44" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="45+" name="45+" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="LTV theo gói" subtitle="Tổng chi tiêu trung bình 1 khách cho gói" badge={`LTV TB ${fmtVnd(d.ltv?.overallLTV || 0)}`}>
          {(d.ltv?.ltvByPackage || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.ltv.ltvByPackage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="packageName" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: any) => fmtVnd(v)} />
                <Bar dataKey="ltv" name="LTV" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>
    </>
  );
}

function ActivityTab({ data }: { data: any }) {
  const d = data || {};
  const pt = d.ptUsage || {};
  const sd = d.stayDuration || {};
  const heat = d.checkInHeatmap || {};

  const pctUsed = pt.totalSessionsAllocated ? Math.round((pt.usedCount / pt.totalSessionsAllocated) * 100) : 0;
  const pctRemaining = 100 - pctUsed;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'PT đã dùng', value: fmtNum(pt.usedCount), icon: Activity, color: 'bg-indigo-500' },
          { label: 'PT còn lại', value: fmtNum(pt.remainingCount), icon: Target, color: 'bg-amber-500' },
          { label: 'T. gian ở lại TB', value: sd.avgStayMinutes ? `${sd.avgStayMinutes} phút` : '—', icon: Clock, color: 'bg-emerald-500' },
          { label: 'Gói dùng hết PT', value: `${pt.fullyUsedPct ?? '—'}%`, icon: CheckCircle2, color: 'bg-green-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className={`${s.color} p-2.5 rounded-xl w-fit mb-3`}><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tỷ lệ dùng PT" subtitle="Tỷ lệ dùng hết vs bỏ phí buổi PT">
          {pt.totalSessionsAllocated > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Đã dùng', value: pt.usedCount },
                    { name: 'Còn lại', value: pt.remainingCount },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmtNum(v), 'buổi']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Đã dùng: <b>{pctUsed}%</b></span>
                  <div className="w-24 bg-slate-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pctUsed}%` }} /></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Còn lại: <b>{pctRemaining}%</b></span>
                  <div className="w-24 bg-slate-100 rounded-full h-2"><div className="bg-slate-300 h-2 rounded-full" style={{ width: `${pctRemaining}%` }} /></div>
                </div>
                <p className="text-xs text-slate-400 pt-1">Bỏ phí hoàn toàn (0 buổi): {pt.wastedCount ?? 0}/{pt.totalPkgWithPT ?? 0} gói · <b>{pt.wastedPct ?? 0}%</b></p>
              </div>
            </>
          ) : <NotEnough />}
        </Card>

        <Card title="Thời gian ở lại thực tế" subtitle={`Trung vị ${sd.medianStayMinutes ?? '—'} phút/lượt`} className="lg:col-span-2">
          {(sd.distribution || []).some((b: any) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sd.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [fmtNum(v), 'lượt']} />
                <Bar dataKey="count" name="Số lượt" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {sd.distribution.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>

      <Card title="Heatmap giờ check-in theo gói" subtitle="Số lượt điểm danh theo khung giờ (6h–22h) và thứ trong tuần, chia theo gói" badge={heat.insufficientData ? 'Chưa đủ dữ liệu' : `${heat.heatmap?.length ?? 0} gói`}>
        {!heat.insufficientData && heat.heatmap?.length > 0 ? (
          <div className="space-y-6">
            {heat.heatmap.map((pkg: any, pi: number) => (
              <div key={pi}>
                <p className="text-sm font-semibold text-slate-700 mb-2">{pkg.packageName}</p>
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid" style={{ gridTemplateColumns: '60px repeat(17, 1fr)', gap: 2 }}>
                      <div />
                      {pkg.data[0]?.hours.map((h: any) => (
                        <div key={h.hour} className="text-center text-[10px] text-slate-400">{h.hour}</div>
                      ))}
                      {pkg.data.map((day: any, di: number) => {
                        const maxCount = Math.max(1, ...pkg.data.flatMap((dd: any) => dd.hours.map((hh: any) => hh.count)));
                        return (
                          <div key={di} className="contents">
                            <div className="flex items-center text-[11px] text-slate-500 font-medium">{day.day}</div>
                            {day.hours.map((hh: any, hi: number) => {
                              const intensity = hh.count / maxCount;
                              const bg = hh.count === 0 ? '#f8fafc' : `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`;
                              return (
                                <div key={hi} className="h-7 rounded flex items-center justify-center text-[10px] font-medium"
                                  style={{ backgroundColor: bg, color: intensity > 0.5 ? '#fff' : '#94a3b8' }}
                                  title={`${day.day} ${hh.hour}: ${hh.count} lượt`}>
                                  {hh.count > 0 ? hh.count : ''}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <NotEnough />}
      </Card>
    </>
  );
}

function HealthTab({ data }: { data: any }) {
  const d = data || {};
  const health = d.packageHealth || [];
  const comp = d.crossComparison || {};

  const colorCounts = {
    xanh: health.filter((h: any) => h.color === 'xanh').length,
    vàng: health.filter((h: any) => h.color === 'vàng').length,
    đỏ: health.filter((h: any) => h.color === 'đỏ').length,
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {(['xanh', 'vàng', 'đỏ'] as const).map(c => (
          <div key={c} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" style={{ borderLeftWidth: 4, borderLeftColor: HEALTH_COLORS[c] }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLORS[c] }} />
              <span className="text-sm font-bold text-slate-800">Gói {HEALTH_LABELS[c]}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: HEALTH_COLORS[c] }}>{colorCounts[c]}</p>
            <p className="text-xs text-slate-400 mt-1">{c === 'xanh' ? 'Sức khỏe tốt' : c === 'vàng' ? 'Cần theo dõi' : 'Cảnh báo'}</p>
          </div>
        ))}
      </div>

      <Card title="Điểm sức khỏe gói (Đỏ / Vàng / Xanh)" subtitle="Điểm dựa trên doanh số 2 kỳ gần & tần suất điểm danh. Đỏ = giảm 2 kỳ liên tiếp → cảnh báo" >
        {health.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {health.map((h: any, i: number) => (
              <div key={i} className={`rounded-xl border p-4 ${h.color === 'xanh' ? 'bg-emerald-50 border-emerald-100' : h.color === 'vàng' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: HEALTH_COLORS[h.color] }} />
                    <span className="font-semibold text-slate-800 text-sm">{h.packageName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white`} style={{ backgroundColor: HEALTH_COLORS[h.color] }}>
                      {HEALTH_LABELS[h.color]}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{h.score}/100</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex-1 bg-white/70 rounded-full h-2">
                    <div className={`h-2 rounded-full`} style={{ backgroundColor: HEALTH_COLORS[h.color], width: `${h.score}%` }} />
                  </div>
                  <span className="text-slate-500 w-48">Bán: {h.recentSales} (kỳ trước {h.previousSales})</span>
                </div>
                {h.consecutiveDecline && (
                  <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {h.warning || 'Cảnh báo: doanh số đang giảm'}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : <NotEnough />}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="So sánh gói cùng môn" subtitle="Doanh thu và số lượt bán theo bộ môn" >
          {(comp.disciplineComparison || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={comp.disciplineComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="discipline" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? fmtVnd(v) : [v, 'Số lượt']} />
                <Legend />
                <Bar yAxisId="right" dataKey="count" name="Số lượt' bán" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="So sánh giữa các chi nhánh" subtitle="Doanh thu & số lượt bán theo cơ sở" >
          {(comp.branchComparison || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={comp.branchComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? fmtVnd(v) : [v, 'Số lượt']} />
                <Legend />
                <Bar yAxisId="right" dataKey="count" name="Số lượt' bán" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Mục tiêu doanh thu & dự báo" subtitle={`Doanh thu YTD: ${fmtVnd(d.revenueForecast?.ytdRevenue || 0)} — TB/tháng: ${fmtVnd(d.revenueForecast?.avgMonthlyRevenue || 0)}`}>
          {(d.revenueForecast?.revenueByMonth || []).some((m: any) => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={d.revenueForecast.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => fmtVnd(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="avgMonthlyRevenue" name="Mục tiêu TB" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NotEnough />}
        </Card>

        <Card title="Thời hạn phổ biến (1/3/6/12 tháng)" subtitle="Phân bố thời hạn hợp đồng mà khách chọn">
          {d.ownership?.length > 0 ? (
            <div className="space-y-4 h-full py-2 flex flex-col justify-center">
              {['1', '3', '6', '12'].map(m => {
                const totalAcrossPkgs = d.ownership.reduce((s: number, o: any) => s + (o.durationDistribution?.find((dd: any) => dd.months === Number(m))?.count || 0), 0);
                const totalAll = d.ownership.reduce((s: number, o: any) => s + o.durationDistribution?.reduce((ss: number, dd: any) => ss + dd.count, 0) || 0, 0);
                const pct = totalAll ? Math.round((totalAcrossPkgs / totalAll) * 100) : 0;
                return (
                  <div key={m} className="flex items-center gap-3 text-sm">
                    <span className="w-14 text-slate-600 font-medium">{m} tháng</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3">
                      <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-700 font-semibold w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : <NotEnough />}
        </Card>
      </div>
    </>
  );
}