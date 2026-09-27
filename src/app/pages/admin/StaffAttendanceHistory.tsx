import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Calendar,
  X,
  User,
  Phone,
  Clock,
  Loader2,
  ChevronRight,
  Mail,
  ShieldCheck,
  CalendarClock,
  AlarmClock,
  Hourglass,
  TrendingUp,
  Briefcase,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Users,
  BarChart2
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { useClub } from '../../context/ClubContext';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface ShiftInfo {
  type: string;
  start: string;
  end: string;
}

interface StaffAttendanceRecord {
  _id: string;
  staffId?: {
    _id: string;
    fullName?: string;
    account?: string;
    phone?: string;
    avatar?: string;
    gender?: string;
    email?: string;
    job?: { _id: string; name?: string } | string | null;
    locationId?: string;
  } | null;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  locationId?: string;
  status?: string;
  statusLabel?: string;
  minutesLate?: number;
  minutesEarly?: number;
  overtime?: number;
  totalMinutes?: number;
  note?: string;
  shiftId?: { _id: string; shift?: string; notes?: string } | null;
  shiftTimes?: ShiftInfo;
}

const PAGE_SIZE = 20;

interface AbsenceRecord {
  _id: string;
  staff?: {
    _id: string;
    fullName?: string;
    account?: string;
    avatar?: string;
    phone?: string;
    gender?: string;
    email?: string;
    locationId?: string;
  } | null;
  date: string;
  shift?: string;
  shiftTimes?: ShiftInfo | null;
  notes?: string;
}

const SHIFT_META: Record<string, { label: string; time: string; badge: string }> = {
  'morning-noon': { label: 'Ca sáng', time: '06:00 – 13:30', badge: 'bg-amber-100 text-amber-700' },
  'afternoon-evening': { label: 'Ca chiều', time: '13:30 – 21:00', badge: 'bg-violet-100 text-violet-700' }
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDuration = (mins?: number | null) => {
  if (mins == null || isNaN(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}p` : `${m}p`;
};

const staffAvatarSrc = (avatar?: string) =>
  avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))
    ? avatar
    : `${getApiUrl()}/uploads/staff/${avatar || ''}`;

const statusBadge: Record<string, string> = {
  'checked-out': 'bg-green-100 text-green-700',
  'checked-in': 'bg-blue-100 text-blue-700',
  'late': 'bg-amber-100 text-amber-700',
  'absent': 'bg-red-100 text-red-700'
};

export function StaffAttendanceHistory() {
  const { selectedClub, clubs } = useClub();
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<StaffAttendanceRecord | null>(null);
  const [staffFilter, setStaffFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summaryView, setSummaryView] = useState<'staff' | 'month'>('staff');
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  const locParam = selectedClub && selectedClub !== 'all' ? selectedClub : '';

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (locParam) params.set('locationId', locParam);
      const res = await fetch(
        `${getApiUrl()}/api/staff-attendance/history?${params.toString()}`,
        { headers: getAuthHeaders() as HeadersInit }
      );
      if (!res.ok) throw new Error('Lỗi tải lịch sử chấm công');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setRecords(list);
    } catch (err) {
      console.error('StaffAttendanceHistory load error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAbsences = async () => {
    if (!fromDate || !toDate) {
      setAbsences([]);
      return;
    }
    setLoadingAbsences(true);
    try {
      const params = new URLSearchParams();
      params.set('from', fromDate);
      params.set('to', toDate);
      if (locParam) params.set('locationId', locParam);
      const res = await fetch(
        `${getApiUrl()}/api/staff-attendance/absences?${params.toString()}`,
        { headers: getAuthHeaders() as HeadersInit }
      );
      if (!res.ok) throw new Error('Lỗi tải danh sách vắng mặt');
      const data = await res.json();
      setAbsences(data.data || []);
    } catch (err) {
      console.error('Absences load error:', err);
      setAbsences([]);
    } finally {
      setLoadingAbsences(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadHistory();
    loadAbsences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, selectedClub]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, staffFilter, shiftFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return records.filter(r => {
      if (q) {
        const name = (r.staffId?.fullName || '').toLowerCase();
        const account = (r.staffId?.account || '').toLowerCase();
        if (!name.includes(q) && !account.includes(q)) return false;
      }
      if (staffFilter && r.staffId?._id !== staffFilter) return false;
      if (shiftFilter) {
        const key = r.shiftId?.shift || 'none';
        if (key !== shiftFilter) return false;
      }
      if (statusFilter && (r.status || '') !== statusFilter) return false;
      return true;
    });
  }, [records, searchTerm, staffFilter, shiftFilter, statusFilter]);

  const staffOptions = useMemo(() => {
    const map = new Map<string, { _id: string; fullName?: string; account?: string }>();
    records.forEach(r => {
      if (r.staffId?._id && !map.has(r.staffId._id)) {
        map.set(r.staffId._id, { _id: r.staffId._id, fullName: r.staffId.fullName, account: r.staffId.account });
      }
    });
    return [...map.values()].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi'));
  }, [records]);

  const staffSummary = useMemo(() => {
    const map = new Map<string, any>();
    records.forEach(r => {
      const id = r.staffId?._id || 'unknown';
      if (!map.has(id)) {
        map.set(id, {
          id, name: r.staffId?.fullName || 'Nhân viên', account: r.staffId?.account || '',
          count: 0, totalMinutes: 0, lateCount: 0, overtimeMinutes: 0, onTimeCount: 0,
        });
      }
      const row = map.get(id);
      row.count++;
      if (r.totalMinutes) row.totalMinutes += r.totalMinutes;
      if (r.status === 'late' || (r.minutesLate || 0) > 0) row.lateCount++;
      if (r.overtime) row.overtimeMinutes += r.overtime;
      if (r.status === 'checked-out' && !(r.minutesLate || 0) && !(r.minutesEarly || 0)) row.onTimeCount++;
    });
    return [...map.values()].sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [records]);

  const monthSummary = useMemo(() => {
    const map = new Map<string, any>();
    records.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!map.has(key)) {
        map.set(key, { key, count: 0, totalMinutes: 0, lateCount: 0, overtimeMinutes: 0, onTimeCount: 0 });
      }
      const row = map.get(key);
      row.count++;
      if (r.totalMinutes) row.totalMinutes += r.totalMinutes;
      if (r.status === 'late' || (r.minutesLate || 0) > 0) row.lateCount++;
      if (r.overtime) row.overtimeMinutes += r.overtime;
      if (r.status === 'checked-out' && !(r.minutesLate || 0) && !(r.minutesEarly || 0)) row.onTimeCount++;
    });
    return [...map.values()].sort((a, b) => {
      const [am, ay] = a.key.split('/').map(Number);
      const [bm, by] = b.key.split('/').map(Number);
      return by - ay || bm - am;
    });
  }, [records]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    let totalMinutes = 0;
    let lateCount = 0;
    let overtimeMinutes = 0;
    let onTimeCount = 0;
    filtered.forEach(r => {
      if (r.totalMinutes) totalMinutes += r.totalMinutes;
      if ((r.status === 'late' || (r.minutesLate || 0) > 0)) lateCount++;
      if (r.overtime) overtimeMinutes += r.overtime;
      if (r.status === 'checked-out' && !(r.minutesLate || 0) && !(r.minutesEarly || 0)) onTimeCount++;
    });
    return { totalMinutes, lateCount, overtimeMinutes, onTimeCount };
  }, [filtered]);

  const renderShift = (rec: StaffAttendanceRecord) => {
    const key = rec.shiftId?.shift;
    const meta = key ? SHIFT_META[key] : null;
    if (!meta) {
      return <span className="text-slate-400">Không phân ca</span>;
    }
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.badge}`}>
          {meta.label}
        </span>
        <span className="text-xs text-slate-400">{meta.time}</span>
      </div>
    );
  };

  const renderStatus = (rec: StaffAttendanceRecord) => {
    const st = rec.status || '';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge[st] || 'bg-slate-100 text-slate-500'}`}>
        {rec.statusLabel || st}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử chấm công nhân viên</h1>
          <p className="text-slate-600">Theo dõi giờ vào ra, ca làm và hiệu suất chấm công của nhân viên</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <CalendarClock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tổng lượt chấm công</p>
              <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <Hourglass className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tổng giờ làm</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalMinutes > 0 ? formatDuration(stats.totalMinutes) : '—'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <AlarmClock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Đi muộn</p>
              <p className="text-2xl font-bold text-slate-900">{stats.lateCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="bg-violet-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tăng ca</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.overtimeMinutes > 0 ? formatDuration(stats.overtimeMinutes) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Tổng hợp theo tháng / nhân viên */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Tổng hợp theo {summaryView === 'staff' ? 'nhân viên' : 'tháng'}
              </h2>
            </div>
            <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setSummaryView('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  summaryView === 'staff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" /> Theo nhân viên
              </button>
              <button
                onClick={() => setSummaryView('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  summaryView === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CalendarClock className="w-4 h-4" /> Theo tháng
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-900 font-bold">
                    {summaryView === 'staff' ? 'Nhân viên' : 'Tháng'}
                  </th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Số lượt</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Tổng giờ làm</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Đi muộn</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Tăng ca</th>
                  <th className="text-center py-3 px-4 text-slate-900 font-bold">Đúng giờ</th>
                </tr>
              </thead>
              <tbody>
                {summaryView === 'staff' && staffSummary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Chưa có dữ liệu chấm công trong khoảng thời gian này
                    </td>
                  </tr>
                )}
                {summaryView === 'month' && monthSummary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Chưa có dữ liệu chấm công trong khoảng thời gian này
                    </td>
                  </tr>
                )}
                {summaryView === 'staff' &&
                  staffSummary.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.account}</p>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700">{row.count}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{formatDuration(row.totalMinutes)}</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-semibold">{row.lateCount}</td>
                      <td className="py-3 px-4 text-center text-violet-600 font-semibold">
                        {row.overtimeMinutes > 0 ? formatDuration(row.overtimeMinutes) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{row.onTimeCount}</td>
                    </tr>
                  ))}
                {summaryView === 'month' &&
                  monthSummary.map(row => (
                    <tr key={row.key} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                          Tháng {row.key}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700">{row.count}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{formatDuration(row.totalMinutes)}</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-semibold">{row.lateCount}</td>
                      <td className="py-3 px-4 text-center text-violet-600 font-semibold">
                        {row.overtimeMinutes > 0 ? formatDuration(row.overtimeMinutes) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{row.onTimeCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên / tài khoản nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> Nhân viên
              </label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
              >
                <option value="">Tất cả nhân viên</option>
                {staffOptions.map(o => (
                  <option key={o._id} value={o._id}>
                    {o.fullName || o.account || o._id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Ca làm
              </label>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
              >
                <option value="">Tất cả ca</option>
                <option value="morning-noon">Ca sáng (06:00 – 13:30)</option>
                <option value="afternoon-evening">Ca chiều (13:30 – 21:00)</option>
                <option value="none">Không phân ca</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="checked-out">Đã chấm công</option>
                <option value="checked-in">Đang làm</option>
                <option value="late">Đi muộn</option>
                <option value="absent">Nghỉ</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Chú thích ca làm:</span>
            {Object.entries(SHIFT_META).map(([k, m]) => (
              <span key={k} className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.badge}`}>
                {m.label} · {m.time}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              {stats.onTimeCount} lượt đúng giờ
            </span>
          </div>
        </div>

        {/* Cảnh báo vắng mặt */}
        <div className={`bg-white rounded-2xl shadow-sm border p-6 ${absences.length > 0 ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${absences.length > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${absences.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Cảnh báo vắng mặt</h2>
              {absences.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  {absences.length} ca chưa chấm công
                </span>
              )}
            </div>
            {loadingAbsences && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Nhân viên được phân ca nhưng chưa có lượt chấm công trong ngày
            {!fromDate || !toDate ? ' — vui lòng chọn ngày bắt đầu và kết thúc ở trên để kiểm tra' : ''}
          </p>
          {fromDate && toDate && absences.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50 border-b border-red-100">
                    <th className="text-left py-3 px-4 text-red-800 font-bold">Nhân viên</th>
                    <th className="text-left py-3 px-4 text-red-800 font-bold">Ngày</th>
                    <th className="text-left py-3 px-4 text-red-800 font-bold">Ca làm</th>
                    <th className="text-left py-3 px-4 text-red-800 font-bold">Ghi chú ca</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map(a => (
                    <tr key={a._id} className="border-b border-red-50 hover:bg-red-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 overflow-hidden shrink-0">
                            {a.staff?.avatar ? (
                              <img
                                src={staffAvatarSrc(a.staff.avatar)}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{a.staff?.fullName || 'Nhân viên'}</p>
                            <p className="text-xs text-slate-400">{a.staff?.account || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 font-medium">{formatDate(a.date)}</td>
                      <td className="py-3 px-4">
                        {a.shift && SHIFT_META[a.shift] ? (
                          <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-bold ${SHIFT_META[a.shift].badge}`}>
                            {SHIFT_META[a.shift].label}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : fromDate && toDate ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Không có nhân viên nào được phân ca nhưng vắng mặt trong khoảng thời gian này
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4 shrink-0" />
              Chọn ngày bắt đầu và kết thúc để hiển thị cảnh báo vắng mặt
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Đang tải lịch sử chấm công...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Nhân viên</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ca làm</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Check-in</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Check-out</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời gian làm</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đi muộn</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tăng ca</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
                        Không có lượt chấm công nào trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                  {paged.map((record, index) => {
                    const staff = record.staffId;
                    return (
                      <tr
                        key={record._id}
                        onClick={() => setSelectedRecord(record)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                              {staff?.avatar ? (
                                <img
                                  src={staffAvatarSrc(staff.avatar)}
                                  alt="avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {staff?.fullName || 'Nhân viên'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {staff?.job && typeof staff.job === 'object' && staff.job.name
                                  ? staff.job.name
                                  : (staff?.account || '—')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(record.date)}</td>
                        <td className="px-6 py-4">{renderShift(record)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatTime(record.checkInTime)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatTime(record.checkOutTime)}</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                          {formatDuration(record.totalMinutes)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {(record.minutesLate || 0) > 0 ? (
                            <span className="text-amber-600 font-semibold">{record.minutesLate} phút</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {(record.overtime || 0) > 0 ? (
                            <span className="text-violet-600 font-semibold">{record.overtime} phút</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{renderStatus(record)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Chi tiết chấm công</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Staff info */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                  {selectedRecord.staffId?.avatar ? (
                    <img
                      src={staffAvatarSrc(selectedRecord.staffId.avatar)}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-slate-900">
                    {selectedRecord.staffId?.fullName || 'Nhân viên'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Tài khoản: <b>{selectedRecord.staffId?.account || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      SĐT: <b>{selectedRecord.staffId?.phone || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      Email: <b>{selectedRecord.staffId?.email || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      Chức vụ:{' '}
                      <b>
                        {selectedRecord.staffId?.job && typeof selectedRecord.staffId.job === 'object'
                          ? selectedRecord.staffId.job.name || '—'
                          : '—'}
                      </b>
                    </span>
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Giới tính: <b>{selectedRecord.staffId?.gender || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      Phòng tập:{' '}
                      <b>
                        {selectedRecord.locationId
                          ? clubs.find(c => c._id === selectedRecord.locationId)?.address || 'Phòng tập'
                          : '—'}
                      </b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Time summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Ca làm</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedRecord.shiftId?.shift
                      ? `${SHIFT_META[selectedRecord.shiftId.shift]?.label || selectedRecord.shiftId.shift} · ${SHIFT_META[selectedRecord.shiftId.shift]?.time || ''}`
                      : 'Không phân ca'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Check-in</p>
                  <p className="text-sm font-semibold text-slate-900">{formatTime(selectedRecord.checkInTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Check-out</p>
                  <p className="text-sm font-semibold text-slate-900">{formatTime(selectedRecord.checkOutTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Tổng thời gian</p>
                  <p className="text-sm font-semibold text-green-600">{formatDuration(selectedRecord.totalMinutes)}</p>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Đánh giá buổi làm
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`rounded-xl border p-4 ${(selectedRecord.minutesLate || 0) > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
                    <p className="text-xs text-slate-500 mb-1">Đi muộn</p>
                    <p className={`font-bold ${(selectedRecord.minutesLate || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {(selectedRecord.minutesLate || 0) > 0 ? `${selectedRecord.minutesLate} phút` : 'Đúng giờ'}
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 ${(selectedRecord.minutesEarly || 0) > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
                    <p className="text-xs text-slate-500 mb-1">Về sớm</p>
                    <p className={`font-bold ${(selectedRecord.minutesEarly || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {(selectedRecord.minutesEarly || 0) > 0 ? `${selectedRecord.minutesEarly} phút` : 'Đủ giờ'}
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 ${(selectedRecord.overtime || 0) > 0 ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-xs text-slate-500 mb-1">Tăng ca</p>
                    <p className={`font-bold ${(selectedRecord.overtime || 0) > 0 ? 'text-violet-700' : 'text-slate-400'}`}>
                      {(selectedRecord.overtime || 0) > 0 ? `${selectedRecord.overtime} phút` : 'Không tăng ca'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {renderStatus(selectedRecord)}
                  {selectedRecord.shiftId?.notes && (
                    <span className="text-sm text-slate-500">
                      Ghi chú ca: <b>{selectedRecord.shiftId.notes}</b>
                    </span>
                  )}
                  {selectedRecord.note && (
                    <span className="text-sm text-slate-500">
                      Ghi chú chấm công: <b>{selectedRecord.note}</b>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                {selectedRecord.status === 'checked-out' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400" />
                )}
                Mã lượt chấm công: {selectedRecord._id}
                <ChevronRight className="w-3 h-3" />
                <Clock className="w-3.5 h-3.5" />
                {formatDate(selectedRecord.date)}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
