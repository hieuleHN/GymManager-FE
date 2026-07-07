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
          <h1 className="text-3xl font-bold text-slate-900">Lịch tập của Huấn luyện viên</h1>
          <p className="text-slate-600 mt-2">Quản lý lịch tập và yêu cầu chuyển lịch</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Từ ngày:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Đến ngày:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">
            Lọc
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700">{error}</div>
        ) : bookings.length === 0 ? (
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
                            <div className="flex items-center gap-1.5">
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
                                {booking.transferType === 'to_colleague' ? (
                                  booking.transferStatus === 'approved' ? (
                                    booking.trainerId?._id === user?.id ? (
                                      <>Đã nhận lịch từ HLV <strong>{booking.transferredFromTrainerId?.fullName || 'HLV'}</strong></>
                                    ) : (
                                      <>Đã chuyển cho HLV <strong>{booking.transferToTrainerId?.fullName || 'đồng nghiệp'}</strong> do HLV {booking.transferredFromTrainerId?.fullName || 'HLV'} chuyển</>
                                    )
                                  ) : booking.transferStatus === 'rejected' ? (
                                    <>Đã bị từ chối bởi: {(booking.rejectedColleagueIds || []).map(p => typeof p === 'string' ? p : (p as any).fullName).join(', ')}</>
                                  ) : (
                                    <>
                                      <div>Đã gửi yêu cầu: {(booking.pendingColleagueIds || []).map(p => typeof p === 'string' ? p : (p as any).fullName).join(', ')}</div>
                                      {(booking.rejectedColleagueIds || []).length > 0 && (
                                        <div className="text-red-600">Đã từ chối: {(booking.rejectedColleagueIds || []).map(p => typeof p === 'string' ? p : (p as any).fullName).join(', ')}</div>
                                      )}
                                    </>
                                  )
                                ) : (
                                  <>Chuyển sang ngày {booking.transferNewDate ? new Date(booking.transferNewDate).toLocaleDateString('vi-VN') : ''} lúc {booking.transferNewTime || ''}</>
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
                          {isColleaguePending(booking) && (
                            <div className="flex gap-1">
                              <button onClick={() => handleColleagueConfirm(booking._id, true)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" title="Nhận lịch">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleColleagueConfirm(booking._id, false)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" title="Từ chối">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {canApprove(booking) && !isColleaguePending(booking) && (
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
      </div>

      {showTransferModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowTransferModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Chuyển lịch tập</h3>
              <p className="text-sm text-slate-600 mt-1">
                Hội viên: <strong>{selectedBooking.customerId?.fullName}</strong> -{' '}
                {new Date(selectedBooking.date).toLocaleDateString('vi-VN')} lúc{' '}
{`${selectedBooking.startTime || selectedBooking.time} - ${selectedBooking.endTime}`}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setTransferTab('colleague')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${transferTab === 'colleague' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <UserPlus className="w-4 h-4" />
                  Chuyển cho đồng nghiệp
                </button>
                <button onClick={() => setTransferTab('date')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${transferTab === 'date' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <CalendarDays className="w-4 h-4" />
                  Chuyển sang ngày khác
                </button>
              </div>

              {transferTab === 'colleague' ? (
                <>
                  {successMsg && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-900 flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      {successMsg}
                    </div>
                  )}
                  {(sentColleagues.length > 0 || (selectedBooking.pendingColleagueIds || []).length > 0) && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-900 font-semibold">Đã gửi yêu cầu:</p>
                      <ul className="text-sm text-purple-800 mt-1 space-y-1">
                        {trainers.filter(t =>
                          sentColleagues.includes(t._id) ||
                          (selectedBooking.pendingColleagueIds || []).some(p => {
                            const id = typeof p === 'string' ? p : (p as any)._id;
                            return id === t._id;
                          })
                        ).map(t => (
                          <li key={t._id} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            {t.fullName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Chọn đồng nghiệp</label>
                    <select value={selectedColleague} onChange={e => setSelectedColleague(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">-- Chọn HLV --</option>
                      {trainers.map(t => {
                        const alreadySent = sentColleagues.includes(t._id) ||
                          (selectedBooking.pendingColleagueIds || []).some(p => {
                            const id = typeof p === 'string' ? p : (p as any)._id;
                            return id === t._id;
                          });
                        return (
                          <option key={t._id} value={t._id} disabled={alreadySent}>
                            {t.fullName} {t.job?.name ? `(${t.job.name})` : ''}{alreadySent ? ' (Đã gửi)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lý do chuyển lịch</label>
                    <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={2} placeholder="Nhập lý do (vd: HLV bận việc gia đình...)" />
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900">
                      <span className="font-semibold">Quy trình:</span> Đồng nghiệp xác nhận là thành công ngay. Có thể gửi yêu cầu cho nhiều đồng nghiệp. Đồng nghiệp nào xác nhận trước thì lịch sẽ chuyển cho người đó.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Chọn ngày mới</label>
                    <input type="date" value={transferNewDate} onChange={e => setTransferNewDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    {selectedBooking && (
                      <p className="text-sm text-slate-500 mt-2">
                        Giữ nguyên khung giờ: <strong>{`${selectedBooking.startTime || selectedBooking.time} - ${selectedBooking.endTime}`}</strong>
                      </p>
                    )}
                    {conflictError && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {conflictError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lý do chuyển lịch</label>
                    <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={2} placeholder="Nhập lý do..." />
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">
                      <span className="font-semibold">Lưu ý:</span> Giữ nguyên khung giờ cũ, chỉ thay đổi ngày tập. Lịch sẽ được cập nhật ngay, hội viên sẽ nhận được thông báo.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={handleTransfer} disabled={submitting}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {transferTab === 'colleague' ? 'Gửi yêu cầu' : 'Xác nhận chuyển'}
              </button>
              <button onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
                {transferTab === 'colleague' && (sentColleagues.length > 0) ? 'Đóng' : 'Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
