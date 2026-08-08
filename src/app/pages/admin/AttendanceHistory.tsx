import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Calendar,
  X,
  User,
  Phone,
  Clock,
  Package,
  Lock,
  UserCheck,
  UserX,
  Loader2,
  ChevronRight,
  Mail,
  MapPin,
  CreditCard,
  CalendarClock,
  Dumbbell,
  ShieldCheck
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { useClub } from '../../context/ClubContext';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface HistoryPackage {
  packageName: string;
  startDate: string;
  endDate: string;
  status: string;
  payment_status: string;
  remainingDays: number;
  features?: string[];
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
  hasHLV?: boolean;
  remainingPtSessions?: number;
  totalPrice?: number;
}

interface HistoryRecord {
  _id: string;
  customerId?: {
    _id: string;
    fullName?: string;
    phone?: string;
    gender?: string;
    email?: string;
    avatar?: string;
    address?: string;
    idNumber?: string;
    registerDate?: string;
    status?: string;
    account?: string;
    balance?: number;
    locationId?: string;
  } | null;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  totalMinutes?: number | null;
  packageCount?: number;
  packages?: HistoryPackage[];
  lockerNumber?: string;
  isCheckedOut?: boolean;
}

const PAGE_SIZE = 20;

const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN') : '—';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

const formatDuration = (mins?: number | null) => {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}p` : `${m} phút`;
};

const statusColor: Record<string, string> = {
  'đang hoạt động': 'bg-emerald-100 text-emerald-700',
  'còn 10 ngày': 'bg-amber-100 text-amber-700',
  'hết hạn': 'bg-red-100 text-red-700',
  'đã hủy': 'bg-slate-100 text-slate-500'
};

export function AttendanceHistory() {
  const { selectedClub, clubs } = useClub();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/checkin/history?limit=200&date=${encodeURIComponent(selectedDate)}`,
        { headers: getAuthHeaders() as HeadersInit }
      );
      if (!res.ok) throw new Error('Lỗi tải lịch sử điểm danh');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setRecords(list);
    } catch (err) {
      console.error('AttendanceHistory load error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedClub]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => {
      const name = (r.customerId?.fullName || '').toLowerCase();
      const phone = (r.customerId?.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [records, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderPackageCell = (rec: HistoryRecord) => {
    const count = rec.packageCount ?? 0;
    if (count === 0) return <span className="text-slate-400">—</span>;
    if (count === 1) {
      const p = (rec.packages || []).find(
        x => x.status === 'đang hoạt động' || x.status === 'còn 10 ngày'
      );
      return <span className="text-indigo-600 font-semibold">{p?.packageName || '1 gói tập'}</span>;
    }
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
        {count} gói tập
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử điểm danh</h1>
          <p className="text-slate-600">Xem lại lịch sử điểm danh của hội viên</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tổng số điểm danh</p>
              <p className="text-3xl font-bold text-slate-900">{filtered.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên / số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Đang tải lịch sử điểm danh...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Hội viên</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Check-in</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Check-out</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời gian tập</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Gói tập</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tủ đồ</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                        Không có lượt điểm danh nào trong ngày này
                      </td>
                    </tr>
                  )}
                  {paged.map((record, index) => {
                    const cust = record.customerId;
                    const checkedOut = record.isCheckedOut || !!record.checkOutTime;
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
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {cust?.fullName || 'Hội viên'}
                              </p>
                              <p className="text-xs text-slate-400">{cust?.phone || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(record.checkInTime)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatTime(record.checkInTime)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatTime(record.checkOutTime)}</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                          {formatDuration(record.totalMinutes)}
                        </td>
                        <td className="px-6 py-4 text-sm">{renderPackageCell(record)}</td>
                        <td className="px-6 py-4 text-sm">
                          {record.lockerNumber ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">
                              <Lock className="w-3.5 h-3.5" />
                              {record.lockerNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {checkedOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <UserCheck className="w-3.5 h-3.5" />
                              Đã check-out
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                              <UserX className="w-3.5 h-3.5" />
                              Đang tập
                            </span>
                          )}
                        </td>
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
              <h2 className="text-lg font-bold text-slate-900">Chi tiết lượt điểm danh</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Member info */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                  {selectedRecord.customerId?.avatar ? (
                    <img
                      src={
                        String(selectedRecord.customerId.avatar).startsWith('http') ||
                        String(selectedRecord.customerId.avatar).startsWith('data:')
                          ? selectedRecord.customerId.avatar
                          : `${getApiUrl()}/uploads/customers/${selectedRecord.customerId.avatar}`
                      }
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">
                      {selectedRecord.customerId?.fullName || 'Hội viên'}
                    </p>
                    {selectedRecord.customerId?.status && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedRecord.customerId.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedRecord.customerId.status === 'locked'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {selectedRecord.customerId.status === 'approved'
                          ? 'Đang hoạt động'
                          : selectedRecord.customerId.status === 'pending_approval'
                            ? 'Chờ duyệt'
                            : selectedRecord.customerId.status === 'locked'
                              ? 'Bị khóa'
                              : selectedRecord.customerId.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Tài khoản: <b>{selectedRecord.customerId?.account || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      SĐT: <b>{selectedRecord.customerId?.phone || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      Email: <b>{selectedRecord.customerId?.email || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                      CMND/CCCD: <b>{selectedRecord.customerId?.idNumber || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Giới tính: <b>{selectedRecord.customerId?.gender || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      Địa chỉ: <b>{selectedRecord.customerId?.address || '—'}</b>
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      Phòng tập:{' '}
                      <b>
                        {selectedRecord.customerId?.locationId
                          ? clubs.find(c => c._id === selectedRecord.customerId?.locationId)?.address
                            || 'Phòng tập'
                          : '—'}
                      </b>
                    </span>
                    <span className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-slate-400 shrink-0" />
                      Ngày đăng ký:{' '}
                      <b>{selectedRecord.customerId?.registerDate
                        ? new Date(selectedRecord.customerId.registerDate).toLocaleDateString('vi-VN')
                        : '—'}</b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Time info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Ngày điểm danh</p>
                  <p className="font-semibold text-slate-900">{formatDate(selectedRecord.checkInTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Check-in</p>
                  <p className="font-semibold text-slate-900">{formatTime(selectedRecord.checkInTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Check-out</p>
                  <p className="font-semibold text-slate-900">{formatTime(selectedRecord.checkOutTime)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-slate-500">Thời gian tập:</span>
                  <span className="font-bold text-green-600">
                    {formatDuration(selectedRecord.totalMinutes)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-cyan-600" />
                  <span className="text-slate-500">Tủ đồ:</span>
                  <span className="font-bold text-cyan-700">
                    {selectedRecord.lockerNumber || 'Không dùng'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {selectedRecord.isCheckedOut || !!selectedRecord.checkOutTime ? (
                    <UserCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <UserX className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-slate-900">
                    {(selectedRecord.isCheckedOut || !!selectedRecord.checkOutTime)
                      ? 'Đã check-out'
                      : 'Đang tập'}
                  </span>
                </div>
              </div>

              {/* Packages */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Gói tập của hội viên ({selectedRecord.packages?.length || 0})
                </h3>
                {(!selectedRecord.packages || selectedRecord.packages.length === 0) && (
                  <p className="text-sm text-slate-400">Hội viên chưa có gói tập</p>
                )}
                <div className="space-y-2">
                  {selectedRecord.packages?.map((p, i) => (
                    <div
                      key={i}
                      className="border border-slate-100 rounded-xl px-4 py-3 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{p.packageName}</p>
                            <p className="text-xs text-slate-500">
                              {p.startDate} → {p.endDate}
                              {p.remainingDays > 0 && ` · còn ${p.remainingDays} ngày`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[p.status] || 'bg-slate-100 text-slate-500'}`}
                          >
                            {p.status}
                          </span>
                          {p.payment_status === 'chờ thanh toán' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                              Chưa thanh toán
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-7 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-indigo-500" />
                          {p.hasHLV ? (
                            <b className="text-indigo-700">
                              Có tập với HLV · {p.ptSessionsPerMonth} buổi/tháng
                              {p.isFullMonth
                                ? ' · không giới hạn'
                                : ` · còn ${p.remainingPtSessions ?? 0} buổi tháng này`}
                            </b>
                          ) : (
                            <span>Không kèm HLV</span>
                          )}
                        </span>
                        {p.totalPrice ? (
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            Giá: <b>{p.totalPrice.toLocaleString('vi-VN')}đ</b>
                          </span>
                        ) : null}
                      </div>

                      {p.features && p.features.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-7">
                          <span className="flex items-center gap-1 text-xs text-slate-500 mr-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Tiện ích:
                          </span>
                          {p.features.map((f, fi) => (
                            <span
                              key={fi}
                              className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
