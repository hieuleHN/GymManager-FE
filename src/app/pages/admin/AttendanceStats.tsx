import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock, Hourglass, AlarmClock, XCircle, Download, Loader2, TrendingUp, ShieldCheck, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { exportAttendanceExcel } from '../../../lib/exportExcelWithChart';
import { generateAttendanceChartImages } from '../../../lib/ChartCapture';

const PERIOD_LABELS: Record<string, string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const fmtDur = (mins: number) => {
  if (!mins || isNaN(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}p` : `${m}p`;
};

interface AttendanceStatsProps {
  selectedClub: string | null;
  period: string;
  customFrom?: string;
  customTo?: string;
}

export function AttendanceStats({ selectedClub, period, customFrom, customTo }: AttendanceStatsProps) {
  const { clubs, selectedClubName } = useClub();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
  const locName = selectedClub && selectedClub !== 'all'
    ? clubs.find(c => c._id === selectedClub)?.address || selectedClubName
    : selectedClubName;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${getApiUrl()}/api/staff-attendance/stats?period=${period}${locParam}`;
      if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
      const res = await fetch(url, { headers: getAuthHeaders() as HeadersInit });
      if (!res.ok) throw new Error('Lỗi tải thống kê chấm công');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('AttendanceStats load error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo, locParam]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const periodLabel = customFrom && customTo ? `${customFrom} → ${customTo}` : (PERIOD_LABELS[period] || period);
      const chartImages = generateAttendanceChartImages(data);
      const clubSuffix = locName && locName !== 'Tất cả câu lạc bộ' ? `_${String(locName).replace(/\s+/g, '_')}` : '';
      await exportAttendanceExcel(
        data,
        periodLabel,
        `BaoCaoChamCong${clubSuffix}_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
        chartImages.length > 0 ? chartImages : undefined,
        locName
      );
    } catch (err: any) {
      console.error('Lỗi xuất Excel chấm công:', err);
      alert('Không thể xuất Excel: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary || {};
  const stats = [
    { label: 'Tổng lượt chấm công', value: `${s.total ?? 0}`, icon: CalendarClock, color: 'bg-indigo-500' },
    { label: 'Tổng giờ làm', value: fmtDur(s.totalMinutes), icon: Hourglass, color: 'bg-emerald-500' },
    { label: 'Đi muộn', value: `${s.lateCount ?? 0}`, icon: AlarmClock, color: 'bg-amber-500' },
    { label: 'Vắng mặt', value: `${s.absentCount ?? 0}`, icon: XCircle, color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Đang tải thống kê chấm công...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-400">
        Không có dữ liệu chấm công nhân viên
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
              <div className={`${stat.color} p-2.5 rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Xuất Excel
        </button>
      </div>

      {/* Biểu đồ lượt chấm công & giờ làm theo ngày */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Lượt chấm công & giờ làm theo ngày</h2>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">Lượt & Giờ</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Cột thể hiện số lượt chấm công, đường thể hiện tổng giờ làm mỗi ngày</p>
        {(data.daily || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, name: string) => name === 'Tổng giờ làm' ? fmtDur(v) : [v, name]} />
              <Legend />
              <Bar dataKey="count" name="Lượt chấm công" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="totalMinutes" name="Tổng giờ làm" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">Chưa có dữ liệu chấm công</div>
        )}
      </div>

      {/* Phân bổ theo ca làm */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Phân bổ lượt chấm công theo ca</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Ca sáng (06:00 – 13:30) · Ca chiều (13:30 – 21:00)</p>
        {(data.shiftDist || []).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.shiftDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {(data.shiftDist || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} lượt`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex flex-col justify-center">
              {(data.shiftDist || []).map((item: any, i: number) => {
                const total = (data.shiftDist || []).reduce((a: number, d: any) => a + (d.value || 0), 0);
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400">Ca: {item.name === 'Ca sáng' ? '06:00 – 13:30' : item.name === 'Ca chiều' ? '13:30 – 21:00' : 'Không phân ca'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{item.value} lượt</p>
                      <p className="text-xs text-slate-400">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">Chưa có dữ liệu ca làm</div>
        )}
      </div>

      {/* Phân chia theo cơ sở phòng tập */}
      {(data.byLocation || []).length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900">Chấm công theo cơ sở phòng tập</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Phân chia lượt chấm công, giờ làm và vắng mặt theo từng cơ sở</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-900 font-bold">Cơ sở</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Lượt chấm công</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Tổng giờ làm</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Đi muộn</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Vắng mặt</th>
                </tr>
              </thead>
              <tbody>
                {data.byLocation.map((loc: any, i: number) => {
                  const maxTotal = Math.max(...data.byLocation.map((l: any) => l.total || 0), 1);
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-800">{loc.locationName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max((loc.total / maxTotal) * 100, 2)}%` }} />
                          </div>
                          <span className="font-semibold text-slate-800">{loc.total} lượt</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{fmtDur(loc.totalMinutes)}</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-semibold">{loc.lateCount}</td>
                      <td className="py-3 px-4 text-center">
                        {loc.absentCount > 0 ? (
                          <span className="text-red-600 font-semibold">{loc.absentCount}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chất lượng chấm công */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900">Chất lượng chấm công</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-slate-500 mb-1">Đúng giờ</p>
            <p className="text-xl font-bold text-emerald-700">{s.onTimeCount ?? 0} lượt</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-slate-500 mb-1">Đi muộn</p>
            <p className="text-xl font-bold text-amber-700">{s.lateCount ?? 0} lượt</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs text-slate-500 mb-1">Tăng ca</p>
            <p className="text-xl font-bold text-violet-700">{fmtDur(s.overtimeMinutes)}</p>
          </div>
        </div>
      </div>
    </>
  );
}
