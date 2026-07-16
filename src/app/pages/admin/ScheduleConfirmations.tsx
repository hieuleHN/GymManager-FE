import { useState, useEffect } from "react";
import { CheckCircle, Calendar, Clock, User, Check, X, Info, Loader2 } from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router";

interface Booking {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string; email: string };
  trainerId: { _id: string; fullName: string };
  locationId?: { _id: string; title: string };
  date: string;
  time: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  note?: string;
  rejectionReason?: string;
  disciplineId?: { _id: string; name: string } | null;
  disciplineName?: string;
  createdAt: string;
}

export function ScheduleConfirmations() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingIdFromNav = (location.state as any)?.bookingId;
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings?page=${p}&limit=20`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const list = data?.data || [];
      setBookings(list);
      setTotalPages(data.totalPages || 1);

      if (bookingIdFromNav) {
        const found = list.find((b: Booking) => b._id === bookingIdFromNav);
        if (found) {
          setSelectedBooking(found);
          setShowDetailModal(true);
        }
      }
    } catch {
      toast.error("Lỗi tải danh sách lịch đặt!");
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(1); }, []);

  const handleConfirm = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${id}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success("Đã xác nhận lịch tập!");
        setShowDetailModal(false);
        fetchBookings(page);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Xác nhận thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectTargetId || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${rejectTargetId}/reject`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason })
      });
      if (res.ok) {
        toast.success('Đã từ chối lịch tập!');
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason('');
        setRejectTargetId(null);
        fetchBookings(page);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Từ chối thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    setActionLoading(false);
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "confirmed": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "cancelled": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xác nhận";
      case "confirmed": return "Đã xác nhận";
      case "rejected": return "Đã từ chối";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Xác nhận lịch tập</h1>
          <p className="text-slate-600 mt-2">Xác nhận yêu cầu đặt lịch từ hội viên</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <button onClick={() => setStatusFilter('all')}
            className={`rounded-2xl p-6 text-left transition-all ${statusFilter === 'all' ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white' : 'bg-white border border-slate-200 hover:border-slate-400'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Info className={`w-6 h-6 ${statusFilter === 'all' ? 'text-white' : 'text-slate-600'}`} />
              <h3 className={`font-semibold ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>Tất cả</h3>
            </div>
            <p className={`text-4xl font-bold ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>{bookings.length}</p>
          </button>
          <button onClick={() => setStatusFilter('pending')}
            className={`rounded-2xl p-6 text-left transition-all ${statusFilter === 'pending' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' : 'bg-white border border-slate-200 hover:border-yellow-400'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className={`w-6 h-6 ${statusFilter === 'pending' ? 'text-white' : 'text-yellow-600'}`} />
              <h3 className={`font-semibold ${statusFilter === 'pending' ? 'text-white' : 'text-slate-900'}`}>Chờ xác nhận</h3>
            </div>
            <p className={`text-4xl font-bold ${statusFilter === 'pending' ? 'text-white' : 'text-slate-900'}`}>{pendingCount}</p>
          </button>
          <button onClick={() => setStatusFilter('confirmed')}
            className={`rounded-2xl p-6 text-left transition-all ${statusFilter === 'confirmed' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-white border border-slate-200 hover:border-green-400'}`}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className={`w-6 h-6 ${statusFilter === 'confirmed' ? 'text-white' : 'text-green-600'}`} />
              <h3 className={`font-semibold ${statusFilter === 'confirmed' ? 'text-white' : 'text-slate-900'}`}>Đã xác nhận</h3>
            </div>
            <p className={`text-4xl font-bold ${statusFilter === 'confirmed' ? 'text-white' : 'text-slate-900'}`}>{confirmedCount}</p>
          </button>
          <button onClick={() => setStatusFilter('rejected')}
            className={`rounded-2xl p-6 text-left transition-all ${statusFilter === 'rejected' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white border border-slate-200 hover:border-red-400'}`}>
            <div className="flex items-center gap-3 mb-2">
              <X className={`w-6 h-6 ${statusFilter === 'rejected' ? 'text-white' : 'text-red-600'}`} />
              <h3 className={`font-semibold ${statusFilter === 'rejected' ? 'text-white' : 'text-slate-900'}`}>Đã từ chối</h3>
            </div>
            <p className={`text-4xl font-bold ${statusFilter === 'rejected' ? 'text-white' : 'text-slate-900'}`}>{rejectedCount}</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách yêu cầu</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Chưa có yêu cầu đặt lịch nào</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-200">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-slate-200">
                        <span className="text-xl font-bold text-indigo-600">
                          {booking.customerId?.fullName?.charAt(0) || '?'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {booking.customerId?.fullName || 'Khách hàng'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            Ngày: <span className="font-semibold text-slate-900">
                              {new Date(booking.date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            Giờ: <span className="font-semibold text-slate-900">{booking.time}</span>
                          </div>
                          <div className="text-sm text-slate-600">
                            HLV: <span className="font-semibold text-slate-900">{booking.trainerId?.fullName || 'Chưa có'}</span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Yêu cầu lúc: {new Date(booking.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>

                        {booking.note && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                            <span className="font-semibold text-blue-900">Ghi chú:</span>
                            <span className="text-blue-800 ml-2">{booking.note}</span>
                          </div>
                        )}
                        {booking.rejectionReason && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm mt-2">
                            <span className="font-semibold text-red-900">Lý do từ chối:</span>
                            <span className="text-red-800 ml-2">{booking.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-2">
                          <Info className="w-4 h-4" /> Chi tiết
                        </button>

                        {booking.status === "pending" && (
                          <>
                            <button onClick={() => handleConfirm(booking._id)} disabled={actionLoading}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                              <Check className="w-4 h-4" /> Xác nhận
                            </button>
                            <button onClick={() => { setRejectTargetId(booking._id); setShowRejectModal(true); }} disabled={actionLoading}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                              <X className="w-4 h-4" /> Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { setPage(p); fetchBookings(p); }}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold ${page === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Chi tiết yêu cầu</h3>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-slate-200">
                    <span className="text-2xl font-bold text-indigo-600">
                      {selectedBooking.customerId?.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedBooking.customerId?.fullName}</h4>
                    <p className="text-slate-600">SĐT: {selectedBooking.customerId?.phone}</p>
                    <p className="text-slate-600">Email: {selectedBooking.customerId?.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">Ngày đặt lịch</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {new Date(selectedBooking.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">Khung giờ</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{selectedBooking.time}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">Huấn luyện viên</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{selectedBooking.trainerId?.fullName || 'Chưa có'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">Bộ môn</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {selectedBooking.disciplineId?.name || selectedBooking.disciplineName || 'Chưa có'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusText(selectedBooking.status)}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedBooking.note && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <label className="text-sm font-medium text-blue-900">Ghi chú của hội viên</label>
                    <p className="text-blue-800 mt-1">{selectedBooking.note}</p>
                  </div>
                )}
                {selectedBooking.rejectionReason && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <label className="text-sm font-medium text-red-900">Lý do từ chối</label>
                    <p className="text-red-800 mt-1">{selectedBooking.rejectionReason}</p>
                  </div>
                )}

                {selectedBooking.status === "pending" && (
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => handleConfirm(selectedBooking._id)} disabled={actionLoading}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50">
                      {actionLoading ? 'Đang xử lý...' : 'Xác nhận lịch tập'}
                    </button>
                    <button onClick={() => { setRejectTargetId(selectedBooking._id); setShowRejectModal(true); }} disabled={actionLoading}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50">
                      {actionLoading ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Từ chối lịch tập</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý do từ chối</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập lý do từ chối..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectTargetId(null); }}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
                  Hủy
                </button>
                <button onClick={handleReject} disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50">
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
