import { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, Check, X, ArrowRight, UserPlus, CalendarDays, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getAuthHeaders, getApiUrl, useAuth } from '../../context/AuthContext';

interface Staff {
  _id: string;
  fullName: string;
  avatar?: string;
  job?: { name: string; permissions?: string[] };
  disciplineId?: { _id: string; name: string };
}

interface Customer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

interface Booking {
  _id: string;
  customerId: Customer;
  trainerId: { _id: string; fullName: string };
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
  disciplineId?: string;
  transferType: string;
  transferToTrainerId?: { _id: string; fullName: string };
  transferReason?: string;
  transferStatus: string;
  transferNewDate?: string;
  transferNewTime?: string;
  transferFromDate?: string;
  transferFromTime?: string;
  transferredFromTrainerId?: { _id: string; fullName: string };
  transferRejectionReason?: string;
}

export function TrainingSchedule() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [transferTab, setTransferTab] = useState<'colleague' | 'date'>('colleague');
  const [selectedColleague, setSelectedColleague] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferNewDate, setTransferNewDate] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [trainerDropdownOpen, setTrainerDropdownOpen] = useState(false);

  // Đặt lịch cho hội viên - state cho admin/trainer
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMember, setBookingMember] = useState<any>(null);
  const [bookingMemberSearch, setBookingMemberSearch] = useState('');
  const [bookingMemberResults, setBookingMemberResults] = useState<any[]>([]);
  const [bookingTrainerId, setBookingTrainerId] = useState<string>('');
  const [bookingDisciplineId, setBookingDisciplineId] = useState<string>('');
  const [bookingSelections, setBookingSelections] = useState<Record<string, { start: string; end: string }>>({});
  const [bookingActiveDate, setBookingActiveDate] = useState<string | null>(null);
  const [bookingFreeSessions, setBookingFreeSessions] = useState<Record<string, number>>({});
  const [bookingOwnedDisciplines, setBookingOwnedDisciplines] = useState<Set<string>>(new Set());
  const [bookingCurrentMonth, setBookingCurrentMonth] = useState(new Date());
  const [bookingTrainerShifts, setBookingTrainerShifts] = useState<Record<string, string[]>>({});
  const [bookingBookedTimes, setBookingBookedTimes] = useState<Set<string>>(new Set());
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMemberPtLoading, setBookingMemberPtLoading] = useState(false);
  const [bookingTrainerPrice, setBookingTrainerPrice] = useState<number>(500000);
  const [bookingMemberPackages, setBookingMemberPackages] = useState<any[]>([]);

  const isTrainerAccount = !user?.isAdmin && (user?.jobPermissions?.includes('huan_luyen_vien') || (user?.role || '').toLowerCase().includes('huấn luyện viên') || (user?.role || '').toLowerCase().includes('hlv'));

  const isAdminOrManager = user?.isAdmin === true ||
    user?.jobPermissions?.includes('quan_ly') ||
    user?.jobPermissions?.includes('le_tan');

  const fetchData = async () => {
    setLoading(true);
    try {
      const urls = [
        fetch(`${getApiUrl()}/api/bookings/my-trainer?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/staff/trainers?permission=huan_luyen_vien`, { headers: getAuthHeaders() })
      ];
      if (isAdminOrManager) {
        urls.push(fetch(`${getApiUrl()}/api/bookings/transfer-requests`, { headers: getAuthHeaders() }));
      }
      const [bookingsRes, trainersRes, transferRes] = await Promise.all(urls);
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }
      if (trainersRes.ok) {
        const data = await trainersRes.json();
        setTrainers(data.filter((t: Staff) => t._id !== user?.id));
      }
      if (transferRes?.ok) {
        const transferData = await transferRes.json();
        setBookings(prev => {
          const ids = new Set(prev.map(b => b._id));
          const merged = [...prev];
          for (const b of transferData) {
            if (!ids.has(b._id)) merged.push(b);
          }
          return merged;
        });
      }
    } catch {
      setError('Không thể tải dữ liệu');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!transferNewDate || !selectedBooking || transferTab !== 'date') {
      setConflictError('');
      return;
    }
    const checkConflict = async () => {
      try {
        const trainerId = selectedBooking.trainerId?._id || selectedBooking.trainerId;
        const time = selectedBooking.time || selectedBooking.startTime || '';
        const res = await fetch(
          `${getApiUrl()}/api/bookings/check-conflict?trainerId=${trainerId}&date=${transferNewDate}&time=${time}`,
          { headers: getAuthHeaders() }
        );
        const data = await res.json();
        setConflictError(data.hasConflict ? 'Khung giờ này đã có lịch tập! Vui lòng chọn ngày khác.' : '');
      } catch { setConflictError(''); }
    };
    checkConflict();
  }, [transferNewDate, selectedBooking, transferTab]);

  // Đặt lịch cho hội viên - logic giống BookTrainer nhưng cho admin/trainer
  const timeSlots = [
    { start: '06:00', end: '07:30' },
    { start: '07:30', end: '09:00' },
    { start: '09:00', end: '10:30' },
    { start: '10:30', end: '12:00' },
    { start: '12:00', end: '13:30' },
    { start: '13:30', end: '15:00' },
    { start: '15:00', end: '16:30' },
    { start: '16:30', end: '18:00' },
    { start: '18:00', end: '19:30' },
    { start: '19:30', end: '21:00' }
  ];
  const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const searchBookingMembers = async (q: string) => {
    if (!q.trim()) { setBookingMemberResults([]); return; }
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/search?q=${encodeURIComponent(q)}`, { headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json(); setBookingMemberResults(Array.isArray(data) ? data : []); }
    } catch { setBookingMemberResults([]); }
  };
  const fetchBookingMemberPtSessions = async (customerId: string) => {
    setBookingMemberPtLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/pt-sessions?customerId=${customerId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const byDisc: Record<string, number> = {};
        const owned = new Set<string>();
        data.forEach((p: any) => {
          const discIds = [p.disciplineId, ...(p.comboDisciplineIds || [])].filter(Boolean);
          discIds.forEach((id: string) => { owned.add(id); byDisc[id] = (byDisc[id] || 0) + (p.currentMonthRemaining || 0); });
        });
        setBookingFreeSessions(byDisc);
        setBookingOwnedDisciplines(owned);
      }
    } catch {} finally { setBookingMemberPtLoading(false); }
  };
  const fetchBookingTrainerShifts = async (trainerId: string, year: number, month: number) => {
    try {
      const start = formatDateKey(new Date(year, month, 1));
      const end = formatDateKey(new Date(year, month + 1, 0));
      const res = await fetch(`${getApiUrl()}/api/staff-shifts/by-range?startDate=${start}&endDate=${end}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const shifts: Record<string, string[]> = {};
        (data.data || []).forEach((a: any) => {
          if (String(a.staffId?._id || a.staffId) === String(trainerId)) {
            const d = a.date ? a.date.split('T')[0] : '';
            if (!shifts[d]) shifts[d] = [];
            if (!shifts[d].includes(a.shift)) shifts[d].push(a.shift);
          }
        });
        setBookingTrainerShifts(shifts);
      }
    } catch {}
  };
  const fetchBookingBookedTimes = async (trainerId: string, dateStr: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/trainer/${trainerId}?date=${dateStr}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const times = new Set<string>();
        (Array.isArray(data) ? data : []).forEach((b: any) => { if (b.time) times.add(b.time); if (b.startTime) times.add(b.startTime); });
        setBookingBookedTimes(times);
      }
    } catch { setBookingBookedTimes(new Set()); }
  };
  useEffect(() => {
    if (bookingMember?._id) {
      fetchBookingMemberPtSessions(bookingMember._id);
      // Lấy tên các gói tập của hội viên để hiển thị khi không còn buổi free
      fetch(`${getApiUrl()}/api/user-packages/my?customerId=${bookingMember._id}`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          setBookingMemberPackages(list.filter((p: any) => p.status !== 'đã hủy' && p.status !== 'hết hạn'));
        })
        .catch(() => setBookingMemberPackages([]));
    } else {
      setBookingMemberPackages([]);
    }
  }, [bookingMember]);
  useEffect(() => {
    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
    if (tid) fetchBookingTrainerShifts(tid, bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth());
  }, [bookingCurrentMonth, bookingTrainerId, user]);
  useEffect(() => {
    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
    if (bookingActiveDate && tid) fetchBookingBookedTimes(tid, bookingActiveDate);
    else setBookingBookedTimes(new Set());
  }, [bookingActiveDate, bookingTrainerId]);
  useEffect(() => {
    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
    if (!tid) { setBookingTrainerPrice(500000); return; }
    fetch(`${getApiUrl()}/api/staff/${tid}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setBookingTrainerPrice(data.pricePerSession || 500000))
      .catch(() => setBookingTrainerPrice(500000));
  }, [bookingTrainerId, user]);
  const openBookingModal = () => {
    setBookingMember(null); setBookingMemberSearch(''); setBookingMemberResults([]);
    setBookingTrainerId(isTrainerAccount ? (user?.id || '') : '');
    setBookingDisciplineId(''); setBookingSelections({}); setBookingActiveDate(null);
    setBookingFreeSessions({}); setBookingOwnedDisciplines(new Set());
    setBookingCurrentMonth(new Date()); setBookingTrainerShifts({}); setBookingBookedTimes(new Set());
    setShowBookingModal(true);
  };
  const handleBookingDateClick = (day: number) => {
    const d = new Date(bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth(), day);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < today) return;
    const key = formatDateKey(d);
    if (bookingActiveDate === key) setBookingActiveDate(null);
    else setBookingActiveDate(key);
  };
  const handleBookingTimeSelect = (slot: { start: string; end: string }) => {
    if (!bookingActiveDate) return;
    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
    if (!tid) return;
    // check shift
    const shifts = bookingTrainerShifts[bookingActiveDate] || [];
    if (shifts.length) {
      const idx = timeSlots.findIndex(s => s.start === slot.start);
      const isMorning = idx >=0 && idx <5;
      if (isMorning && !shifts.includes('morning-noon')) return;
      if (!isMorning && !shifts.includes('afternoon-evening')) return;
    } else return;
    if (bookingBookedTimes.has(slot.start)) return;
    setBookingSelections(prev => ({ ...prev, [bookingActiveDate]: slot }));
    setBookingActiveDate(null);
  };
  const handleBookingSubmit = async () => {
    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
    if (!bookingMember?._id) { alert('Vui lòng chọn hội viên'); return; }
    if (!tid) { alert('Vui lòng chọn HLV'); return; }
    if (!bookingDisciplineId) { alert('Vui lòng chọn bộ môn'); return; }
    if (Object.keys(bookingSelections).length === 0) { alert('Chọn ít nhất một ngày và giờ'); return; }
    setBookingSubmitting(true);
    try {
      const slots = Object.entries(bookingSelections).map(([date, t]) => ({ date, time: t.start, startTime: t.start, endTime: t.end }));
      const trainerRes = await fetch(`${getApiUrl()}/api/staff/${tid}`, { headers: getAuthHeaders() });
      const trainerData = await trainerRes.json();
      const price = trainerData?.pricePerSession || 500000;
      const locId = trainerData?.locationId?._id || trainerData?.locationId || null;
      const res = await fetch(`${getApiUrl()}/api/bookings/admin-create`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: bookingMember._id, trainerId: tid, disciplineId: bookingDisciplineId, slots, locationId: locId, price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo lịch thất bại');
      alert(data.message || 'Đặt lịch thành công!');
      setShowBookingModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); } finally { setBookingSubmitting(false); }
  };

  const openTransfer = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedColleague('');
    setTransferReason('');
    setTransferNewDate('');
    setConflictError('');
    setTransferTab('colleague');
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const body: any = { transferType: transferTab === 'colleague' ? 'to_colleague' : 'to_another_day', transferReason };
      if (transferTab === 'colleague') {
        if (!selectedColleague) { alert('Vui lòng chọn đồng nghiệp'); setSubmitting(false); return; }
        body.transferToTrainerId = selectedColleague;
      } else {
        if (!transferNewDate) { alert('Vui lòng chọn ngày mới'); setSubmitting(false); return; }
        if (conflictError) { alert('Ngày này đã có trùng lịch! Vui lòng chọn ngày khác.'); setSubmitting(false); return; }
        body.transferNewDate = transferNewDate;
        body.transferNewTime = selectedBooking.time || selectedBooking.startTime || '';
      }
      const res = await fetch(`${getApiUrl()}/api/bookings/${selectedBooking._id}/transfer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === selectedBooking._id ? {
          ...b,
          transferStatus: 'pending_approval',
          transferReason: transferReason,
          transferType: body.transferType,
          ...(body.transferType === 'to_colleague' ? {
            transferToTrainerId: body.transferToTrainerId ? { _id: body.transferToTrainerId, fullName: trainers.find(t => t._id === body.transferToTrainerId)?.fullName || '' } : b.transferToTrainerId
          } : {
            transferNewDate: body.transferNewDate,
            transferNewTime: body.transferNewTime,
            transferFromDate: b.date,
            transferFromTime: b.time || b.startTime || ''
          })
        } : b));
        setShowTransferModal(false);
      } else {
        alert(data.error || 'Lỗi gửi yêu cầu');
      }
    } catch { alert('Lỗi kết nối'); }
    setSubmitting(false);
  };

  const handleApproveTransfer = async (bookingId: string) => {
    if (!confirm('Xác nhận phê duyệt chuyển lịch này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}/approve-transfer`, {
        method: 'PUT', headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === bookingId && b.transferStatus === 'pending_approval' ? { ...b, transferStatus: 'approved', trainerId: b.transferToTrainerId || b.trainerId } : b));
      } else {
        alert(data.error || 'Lỗi phê duyệt');
      }
    } catch { alert('Lỗi kết nối'); }
  };

  const handleRejectTransfer = async (bookingId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}/reject-transfer`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejectionReason: reason || 'Từ chối' })
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === bookingId && b.transferStatus === 'pending_approval' ? { ...b, transferStatus: 'rejected', transferRejectionReason: reason || 'Từ chối' } : b));
      } else {
        alert(data.error || 'Lỗi từ chối');
      }
    } catch { alert('Lỗi kết nối'); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getTransferBadge = (booking: Booking) => {
    const ts = booking.transferStatus;
    if (ts === 'none') return null;
    if (ts === 'pending_approval')
      return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Chờ phê duyệt</span>;
    if (ts === 'approved') {
      if (booking.transferType === 'to_another_day') {
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Đã chuyển lịch</span>;
      }
      const recipientName = booking.transferToTrainerId?.fullName || 'HLV';
      const isRecipient = booking.trainerId?._id === user?.id;
      if (isRecipient) return null;
      return <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-semibold">Đã chuyển cho {recipientName}</span>;
    }
    if (ts === 'rejected')
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Từ chối</span>;
    return null;
  };

  const canApprove = (booking: Booking) =>
    booking.transferStatus === 'pending_approval' && isAdminOrManager;

  const canTransfer = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    const fromId = typeof booking.transferredFromTrainerId === 'object'
      ? booking.transferredFromTrainerId?._id
      : booking.transferredFromTrainerId;
    if (fromId === user?.id) return false;
    if (booking.transferStatus === 'approved') {
      const trainerId = typeof booking.trainerId === 'object'
        ? booking.trainerId?._id
        : booking.trainerId;
      return trainerId === user?.id;
    }
    return ['none', 'rejected'].includes(booking.transferStatus) &&
      (booking.trainerId?._id === user?.id || isAdminOrManager);
  };

  const visibleBookings = isAdminOrManager && selectedTrainer !== 'all'
    ? bookings.filter(b => {
        const tid = typeof b.trainerId === 'object' ? b.trainerId?._id : b.trainerId;
        return tid === selectedTrainer;
      })
    : bookings;

  const groupedByDate = visibleBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const d = new Date(b.date).toLocaleDateString('vi-VN');
    if (!acc[d]) acc[d] = [];
    acc[d].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const [d1, m1, y1] = a.split('/').map(Number);
    const [d2, m2, y2] = b.split('/').map(Number);
    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lịch tập</h1>
          <p className="text-slate-600 mt-2">Quản lý lịch tập của huấn luyện viên</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={openBookingModal} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
            <Calendar className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-bold text-slate-900">Đặt lịch mới</h3>
            <p className="text-sm text-slate-600 mt-1">Tạo lịch tập cho hội viên</p>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
          >
            <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-bold text-slate-900">Chuyển lịch</h3>
            <p className="text-sm text-slate-600 mt-1">Chuyển cho đồng nghiệp khi bận</p>
          </button>

          <button
            onClick={() => {
              const now = new Date();
              const from = new Date(now.getFullYear(), now.getMonth(), 1);
              const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setDateFrom(from.toISOString().split('T')[0]);
              setDateTo(to.toISOString().split('T')[0]);
            }}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left"
          >
            <Clock className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-bold text-slate-900">Xem lịch tháng</h3>
            <p className="text-sm text-slate-600 mt-1">Xem toàn bộ lịch trong tháng</p>
          </button>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  setDateFrom(d.toISOString().split('T')[0]);
                  setDateTo(new Date().toISOString().split('T')[0]);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                30 ngày gần đây
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const from = new Date(now.getFullYear(), now.getMonth(), 1);
                  setDateFrom(from.toISOString().split('T')[0]);
                  setDateTo(now.toISOString().split('T')[0]);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Từ đầu tháng
              </button>
            </div>
            {isAdminOrManager && (
              <div className="relative min-w-[240px]">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Huấn luyện viên</label>
                <input
                  type="text"
                  value={trainerDropdownOpen ? trainerSearch : (selectedTrainer === 'all' ? 'Tất cả HLV' : trainers.find(t => t._id === selectedTrainer)?.fullName || 'Tất cả HLV')}
                  onChange={e => { setTrainerSearch(e.target.value); setTrainerDropdownOpen(true); }}
                  onFocus={() => { setTrainerSearch(''); setTrainerDropdownOpen(true); }}
                  placeholder="Tìm và chọn HLV..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {trainerDropdownOpen && (
                  <>
                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedTrainer('all'); setTrainerSearch(''); setTrainerDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${selectedTrainer === 'all' ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}
                      >
                        Tất cả HLV
                      </button>
                      {trainers
                        .filter(t => (t.fullName || '').toLowerCase().includes(trainerSearch.toLowerCase()))
                        .map(t => (
                          <button
                            key={t._id}
                            onClick={() => { setSelectedTrainer(t._id); setTrainerSearch(''); setTrainerDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${selectedTrainer === t._id ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}
                          >
                            {t.fullName}
                          </button>
                        ))}
                    </div>
                    <div className="fixed inset-0 z-40" onClick={() => setTrainerDropdownOpen(false)} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>


        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700">{error}</div>
        ) : visibleBookings.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Không có lịch tập nào trong khoảng thời gian này</p>
          </div>
        ) : (
          sortedDates.map(dateStr => (
            <div key={dateStr} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {dateStr}
                  <span className="text-sm font-normal text-indigo-600 ml-2">({groupedByDate[dateStr].length} buổi)</span>
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {groupedByDate[dateStr]
                  .sort((a, b) => (a.time || a.startTime || '').localeCompare(b.time || b.startTime || ''))
                  .map(booking => (
                    <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <img
                          src={booking.customerId?.avatar ||
                            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'}
                          alt={booking.customerId?.fullName || 'Hội viên'}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-900">
                              {booking.customerId?.fullName || 'Hội viên'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                            {getTransferBadge(booking)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                            {isAdminOrManager && booking.trainerId?.fullName && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                HLV: {booking.trainerId.fullName}
                              </div>
                            )}
                            <div className={`flex items-center gap-1.5 ${booking.transferStatus === 'approved' && booking.transferType === 'to_colleague' ? 'line-through text-slate-400' : ''}`}>
                              <Clock className="w-4 h-4" />
                              {`${booking.startTime || booking.time} - ${booking.endTime}`}
                            </div>
                            {booking.customerId?.phone && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                {booking.customerId.phone}
                              </div>
                            )}
                          </div>
                          {booking.transferStatus !== 'none' && (
                            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm text-orange-900">
                                <span className="font-semibold">Yêu cầu chuyển lịch:</span>{' '}
                                {booking.transferStatus === 'approved' ? (
                                  booking.transferType === 'to_colleague' ? (
                                    <>Đã chuyển cho HLV <strong>{booking.transferToTrainerId?.fullName || 'đồng nghiệp'}</strong></>
                                  ) : (
                                    <>Chuyển từ ngày {booking.transferFromDate ? new Date(booking.transferFromDate).toLocaleDateString('vi-VN') : ''} lúc {booking.transferFromTime || ''} sang ngày {booking.transferNewDate ? new Date(booking.transferNewDate).toLocaleDateString('vi-VN') : ''} lúc {booking.transferNewTime || ''}</>
                                  )
                                ) : booking.transferStatus === 'rejected' ? (
                                  <>Đã bị từ chối. Lý do: {booking.transferRejectionReason || 'Không có lý do'}</>
                                ) : (
                                  <>Đang chờ quản lý phê duyệt</>
                                )}
                                {booking.transferReason && `. Lý do: ${booking.transferReason}`}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {canTransfer(booking) && (
                            <button onClick={() => openTransfer(booking)}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-1.5">
                              <ArrowRight className="w-4 h-4" />
                              Chuyển lịch
                            </button>
                          )}
                          {canApprove(booking) && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApproveTransfer(booking._id)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-1.5">
                                <Check className="w-4 h-4" />
                                Duyệt
                              </button>
                              <button onClick={() => handleRejectTransfer(booking._id)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-1.5">
                                <X className="w-4 h-4" />
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}

        {/* Legend */}
<div className="mt-4 pt-4 border-t border-slate-200">
  <div className="flex flex-wrap gap-4 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded bg-amber-400"></div>
      <span className="text-slate-600">Đang chờ xác nhận</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded bg-green-500"></div>
      <span className="text-slate-600">Xác nhận lịch tập thành công</span>
    </div>
  </div>
</div>

        {/* Modal đặt lịch cho hội viên (admin/trainer) */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Đặt lịch tập cho hội viên</h2>
                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              {/* Chọn hội viên */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn hội viên *</label>
                {bookingMember ? (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <img src={bookingMember.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{bookingMember.fullName}</p>
                      <p className="text-xs text-slate-500">{bookingMember.phone} {bookingMember.account ? `· ${bookingMember.account}` : ''}</p>
                    </div>
                    <button onClick={() => { setBookingMember(null); setBookingMemberSearch(''); }} className="p-2 hover:bg-white rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" value={bookingMemberSearch} onChange={e => { setBookingMemberSearch(e.target.value); searchBookingMembers(e.target.value); }} placeholder="Nhập tên, SĐT, tài khoản hội viên..." className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {bookingMemberResults.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {bookingMemberResults.map((m: any) => (
                          <button key={m._id} onClick={() => { setBookingMember(m); setBookingMemberSearch(''); setBookingMemberResults([]); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left">
                            <img src={m.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div><p className="font-semibold text-slate-900">{m.fullName}</p><p className="text-xs text-slate-500">{m.phone} {m.account ? `· ${m.account}` : ''}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chọn HLV - chỉ hiện nếu không phải tài khoản HLV */}
              {!isTrainerAccount && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn HLV *</label>
                  <select value={bookingTrainerId} onChange={e => setBookingTrainerId(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">-- Chọn HLV --</option>
                    {trainers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                  </select>
                </div>
              )}
              {isTrainerAccount && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  HLV: <b>{user?.fullName || user?.name}</b> (tài khoản huấn luyện viên chỉ đặt cho hội viên, HLV tự động là bạn)
                </div>
              )}

              {/* Chọn bộ môn */}
              {(bookingTrainerId || isTrainerAccount) && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn bộ môn *</label>
                  {(() => {
                    const tid = isTrainerAccount ? user?.id : bookingTrainerId;
                    const tr = trainers.find(t => t._id === tid) || (isTrainerAccount ? { disciplineId: null, specialties: [] } as any : null);
                    if (!tr && !isTrainerAccount) return <p className="text-sm text-slate-500">Chọn HLV trước</p>;
                    const items: { id: string; name: string }[] = [];
                    // Lấy từ trainer data thực tế
                    const realTr = trainers.find(t => t._id === tid);
                    if (realTr?.disciplineId) items.push({ id: realTr.disciplineId._id, name: realTr.disciplineId.name });
                    realTr?.specialties?.forEach((s: string) => { if (!items.find(i => i.name === s)) items.push({ id: s, name: s }); });
                    if (items.length === 0) return <p className="text-sm text-slate-500">HLV chưa có bộ môn</p>;
                    return (
                      <div className="flex flex-wrap gap-2">
                        {items.map(item => {
                          const isOwned = bookingOwnedDisciplines.has(item.id) || bookingOwnedDisciplines.has(item.name);
                          const isSelected = bookingDisciplineId === item.id;
                          const free = (bookingFreeSessions[item.id] || 0) + (bookingFreeSessions[item.name] || 0);
                          return (
                            <button key={item.id} onClick={() => {
                              if (!bookingMember) { alert('Chọn hội viên trước'); return; }
                              if (!isOwned) { alert('Hội viên chưa mua gói bộ môn này - vẫn đặt được nhưng sẽ tính phí'); }
                              setBookingDisciplineId(item.id);
                            }} className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : isOwned ? 'border-slate-200 hover:border-indigo-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                              {item.name} {isOwned && free > 0 ? `(${free} buổi free)` : !isOwned ? '(Chưa mua)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {bookingMemberPtLoading && <p className="text-xs text-slate-500 mt-2">Đang kiểm tra số buổi của hội viên...</p>}
                  {bookingMember && bookingDisciplineId && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      {(() => {
                        const free = (bookingFreeSessions[bookingDisciplineId] || 0);
                        const isFull = Object.values(bookingFreeSessions).some(v => v >= 999);
                        if (isFull) return <span className="text-green-700 font-bold">Gói full tháng - chọn ngày miễn phí</span>;
                        if (free > 0) return <span className="text-green-700">Còn <b>{free}</b> buổi miễn phí trong tháng</span>;
                        return <span className="text-amber-700">Hết buổi miễn phí - sẽ tính phí theo giá HLV</span>;
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Lịch */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setBookingCurrentMonth(new Date(bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth() -1, 1))} className="p-2 hover:bg-white rounded-lg"><X className="w-4 h-4 rotate-90" /></button>
                    <span className="font-bold">Tháng {bookingCurrentMonth.getMonth()+1}/{bookingCurrentMonth.getFullYear()}</span>
                    <button onClick={() => setBookingCurrentMonth(new Date(bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth() +1, 1))} className="p-2 hover:bg-white rounded-lg"><X className="w-4 h-4 -rotate-90" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['CN','T2','T3','T4','T5','T6','T7'].map(d => <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: new Date(bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth()+1,0).getDate() }, (_, i) => {
                      const day = i+1;
                      const d = new Date(bookingCurrentMonth.getFullYear(), bookingCurrentMonth.getMonth(), day);
                      const key = formatDateKey(d);
                      const isPast = d < new Date(new Date().setHours(0,0,0,0));
                      const hasShift = (bookingTrainerShifts[key] || []).length > 0;
                      const isSelected = !!bookingSelections[key];
                      const isActive = bookingActiveDate === key;
                      return (
                        <button key={day} disabled={isPast || !hasShift} onClick={() => handleBookingDateClick(day)} className={`aspect-square rounded-lg text-sm font-semibold border ${isPast ? 'bg-slate-100 text-slate-300 border-slate-100' : !hasShift ? 'bg-orange-50 text-orange-300 border-orange-100' : isSelected ? 'bg-indigo-600 text-white border-indigo-600' : isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Cam = HLV không có ca, Xám = quá khứ</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-3">{bookingActiveDate ? `Chọn giờ ${bookingActiveDate.split('-')[2]}/${bookingActiveDate.split('-')[1]}` : Object.keys(bookingSelections).length ? `Đã chọn ${Object.keys(bookingSelections).length} buổi` : 'Chọn ngày trước'}</h4>
                  {bookingActiveDate ? (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(slot => {
                        const tid = isTrainerAccount ? user?.id : bookingTrainerId;
                        const shifts = bookingTrainerShifts[bookingActiveDate] || [];
                        const isMorning = timeSlots.findIndex(s=>s.start===slot.start) <5;
                        const noShift = shifts.length && ((isMorning && !shifts.includes('morning-noon')) || (!isMorning && !shifts.includes('afternoon-evening')));
                        const booked = bookingBookedTimes.has(slot.start);
                        const disabled = !!noShift || booked;
                        const selected = bookingSelections[bookingActiveDate]?.start === slot.start;
                        return (
                          <button key={slot.start} disabled={disabled} onClick={() => handleBookingTimeSelect(slot)} className={`px-3 py-2 rounded-xl text-sm font-semibold border ${disabled ? 'bg-slate-100 text-slate-300 border-slate-100' : selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:border-indigo-300 border-slate-200'}`}>
                            {slot.start}-{slot.end}{booked ? ' (Đã đặt)' : noShift ? ' (Không ca)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  ) : Object.keys(bookingSelections).length ? (
                    <div className="space-y-2">
                      {Object.entries(bookingSelections).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <span className="text-sm font-semibold text-indigo-900">{k} {v.start}-{v.end}</span>
                          <button onClick={() => setBookingSelections(prev => { const n={...prev}; delete n[k]; return n; })} className="p-1 hover:bg-white rounded"><X className="w-4 h-4 text-red-600" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">Chọn ngày trên lịch để chọn giờ</p>
                  )}
                </div>
              </div>

              {/* Tổng kết - hiển thị số tiền kể cả khi không có buổi free */}
              {Object.keys(bookingSelections).length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 space-y-2">
                  <p className="font-semibold text-indigo-900">Tổng {Object.keys(bookingSelections).length} buổi</p>
                  {(() => {
                    const free = bookingDisciplineId ? (bookingFreeSessions[bookingDisciplineId] || 0) : 0;
                    const total = Object.keys(bookingSelections).length;
                    const freeCount = Math.min(free, total);
                    const paidCount = total - freeCount;
                    const isFull = free >= 999;
                    const totalPrice = paidCount * bookingTrainerPrice;
                    return (
                      <div className="text-sm text-indigo-700 space-y-1">
                        {isFull ? (
                          <span className="text-green-700 font-bold">Full tháng - miễn phí toàn bộ (0đ)</span>
                        ) : (
                          <>
                            <p>{freeCount > 0 ? `${freeCount} buổi miễn phí, ${paidCount} buổi × ${bookingTrainerPrice.toLocaleString('vi-VN')}đ` : `${paidCount} buổi × ${bookingTrainerPrice.toLocaleString('vi-VN')}đ`} = <b className="text-indigo-900">{totalPrice.toLocaleString('vi-VN')}đ</b></p>
                            {freeCount > 0 && <p className="text-xs text-slate-500">Hội viên còn {free} buổi free cho bộ môn này</p>}
                            {paidCount > 0 && freeCount === 0 && (
                              <p className="text-xs text-slate-600">Gói của hội viên: {bookingMemberPackages.length ? bookingMemberPackages.map((p: any) => p.package_id?.name || p.name || 'Gói tập').join(', ') : 'Chưa có gói'}</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold">Hủy</button>
                <button onClick={handleBookingSubmit} disabled={bookingSubmitting || Object.keys(bookingSelections).length===0} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {bookingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Tạo lịch ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
