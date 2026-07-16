import { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, Check, X, ArrowRight, UserPlus, CalendarDays, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getAuthHeaders, getApiUrl, useAuth } from '../../context/AuthContext';

interface Staff {
  _id: string;
  fullName: string;
  avatar?: string;
  job?: { name: string };
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
  transferType: string;
  transferToTrainerId?: { _id: string; fullName: string };
  transferReason?: string;
  transferStatus: string;
  transferNewDate?: string;
  transferNewTime?: string;
  pendingColleagueIds?: { _id: string; fullName: string }[];
  rejectedColleagueIds?: { _id: string; fullName: string }[];
  transferredFromTrainerId?: { _id: string; fullName: string };
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

  const isAdminOrManager = user?.isAdmin === true || user?.permissions?.includes('schedule');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, trainersRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/bookings/my-trainer?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/staff/trainers`, { headers: getAuthHeaders() })
      ]);
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }
      if (trainersRes.ok) {
        const data = await trainersRes.json();
        setTrainers(data.filter((t: Staff) => t._id !== user?.id));
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

  const [sentColleagues, setSentColleagues] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const openTransfer = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedColleague('');
    setTransferReason('');
    setTransferNewDate('');
    setConflictError('');
    setTransferTab('colleague');
    setSentColleagues([]);
    setSuccessMsg('');
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
        if (transferTab === 'colleague') {
          const name = trainers.find(t => t._id === selectedColleague)?.fullName || selectedColleague;
          setSentColleagues(prev => [...prev, selectedColleague]);
          setSuccessMsg(`Đã gửi yêu cầu cho HLV ${name}`);
          setSelectedColleague('');
          fetchData();
        } else {
          alert('Đã chuyển lịch tập thành công!');
          setShowTransferModal(false);
          fetchData();
        }
      } else {
        alert(data.error || 'Lỗi gửi yêu cầu');
      }
    } catch { alert('Lỗi kết nối'); }
    setSubmitting(false);
  };

  const handleColleagueConfirm = async (bookingId: string, accept: boolean) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}/colleague-confirm`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ accept })
      });
      const data = await res.json();
      if (res.ok) {
        alert(accept ? 'Bạn đã xác nhận nhận lịch tập!' : 'Bạn đã từ chối nhận lịch tập');
        fetchData();
      } else {
        alert(data.error || 'Lỗi xác nhận');
      }
    } catch { alert('Lỗi kết nối'); }
  };

  const handleApproveTransfer = async (bookingId: string) => {
    if (!confirm('Xác nhận phê duyệt chuyển lịch này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}/approve-transfer`, {
        method: 'PUT', headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đã phê duyệt chuyển lịch!');
        fetchData();
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
        alert('Đã từ chối yêu cầu chuyển lịch!');
        fetchData();
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
    if (ts === 'pending_colleague') {
      const count = (booking.pendingColleagueIds || []).length;
      return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">Chờ đồng nghiệp{count > 0 ? ` (${count})` : ''}</span>;
    }
    if (ts === 'pending_approval')
      return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Chờ phê duyệt</span>;
    if (ts === 'colleague_accepted')
      return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">Đồng nghiệp đã nhận</span>;
    if (ts === 'approved') {
      if (booking.transferType === 'to_another_day') {
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Đã chuyển lịch</span>;
      }
      const recipientName = booking.transferToTrainerId?.fullName || 'HLV';
      const isRecipient = booking.trainerId?._id === user?.id;
      if (isRecipient) return null;
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Đã chuyển cho {recipientName}</span>;
    }
    if (ts === 'rejected')
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Từ chối</span>;
    return null;
  };

  const isColleaguePending = (booking: Booking) =>
    booking.transferStatus === 'pending_colleague' &&
    (booking.pendingColleagueIds || []).some(p => {
      const id = typeof p === 'string' ? p : (p as any)._id;
      return id === user?.id;
    });

  const canApprove = (booking: Booking) =>
    (booking.transferStatus === 'pending_approval' || booking.transferStatus === 'pending_colleague') && isAdminOrManager;

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
    return ['none', 'pending_colleague', 'rejected'].includes(booking.transferStatus) &&
      (booking.trainerId?._id === user?.id || isAdminOrManager);
  };

  const groupedByDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
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
          <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
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

          <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left">
            <Clock className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-bold text-slate-900">Xem lịch tháng</h3>
            <p className="text-sm text-slate-600 mt-1">Xem toàn bộ lịch trong tháng</p>
          </button>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Lịch dạy tuần</h2>
            <div className="flex items-center gap-4">
              <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold">{weekRangeText}</span>
              <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            <div className="grid grid-cols-8 gap-px bg-slate-200 rounded-lg">
              <div className="bg-slate-50 p-2 text-center text-sm font-medium">Giờ</div>
              {getWeekDays.map((date, idx) => (
                <div key={idx} className="bg-slate-50 p-2 text-center text-sm font-medium">
                  {weekDays[idx]} {date.getDate()}/{date.getMonth() + 1}
                </div>
              ))}

              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="bg-white p-2 text-sm text-center border-t border-slate-100">{hour}</div>
                  {getWeekDays.map((date, dayIdx) => {
                    const hourBookings = getBookingsForHour(date, hour);
                    return (
                      <div key={dayIdx} className="bg-white p-1 min-h-[50px] border-t border-slate-100 relative">
                        {hourBookings.map((b) => (
                          <div
                            key={b._id}
                            onClick={() => navigate(`/admin/schedule-confirmations`, { state: { bookingId: b._id } })}
                            className={`text-xs p-1 rounded mb-0.5 cursor-pointer hover:opacity-80 transition-opacity ${b.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            <div className="font-semibold">{b.customerId?.fullName || 'Khách'}</div>
                            <div>{b.time}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Chuyển lịch cho đồng nghiệp</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chọn lịch cần chuyển</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>05/06/2026 - 08:00-09:00 - Nguyễn Văn A</option>
                    <option>05/06/2026 - 10:00-11:00 - Trần Thị B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chọn đồng nghiệp</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>HLV Nguyễn Văn D</option>
                    <option>HLV Trần Thị E</option>
                    <option>HLV Lê Văn F</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lý do chuyển lịch</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="Nhập lý do..."
                  />
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <span className="font-semibold">Lưu ý:</span> Hội viên sẽ nhận được thông báo về việc thay đổi huấn luyện viên và cần xác nhận.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                  Gửi yêu cầu chuyển lịch
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
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
      </div>
    </AdminLayout>
  );
}
