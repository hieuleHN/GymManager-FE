import { DashboardLayout } from '../../components/DashboardLayout';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@mui/material';
import { Calendar, Clock, Check, MapPin, XCircle, AlertCircle, Loader2, Eye, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface BookingDetail {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string; email: string };
  trainerId: { _id: string; fullName: string; phone?: string } | null;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  locationId?: { _id: string; title: string; address?: string };
  disciplineId?: { _id: string; name: string } | null;
  disciplineName?: string;
  createdAt: string;
  batchId?: string;
}

export function BookingStatus() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const batchIdParam = searchParams.get('batchId');

  const fetchByBatch = useRef(false);

  useEffect(() => {
    const showSuccess = searchParams.get('success') === 'true';
    if (showSuccess) {
      toast.success('Đặt lịch thành công!');
    }
  }, []);

  useEffect(() => {
    if (!batchIdParam) { setLoading(false); return; }
    fetchByBatch.current = true;
    fetchBatchBookings();
    const interval = setInterval(fetchBatchBookings, 15000);
    return () => { fetchByBatch.current = false; clearInterval(interval); };
  }, [batchIdParam]);

  const fetchBatchBookings = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/my?batchId=${batchIdParam}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBookings(data);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchIdParam || fetchByBatch.current) return;
    if (!bookingId) { setLoading(false); return; }
    fetchSingleBooking();
    const interval = setInterval(fetchSingleBooking, 15000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchSingleBooking = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBookings([data]);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string, isPersonal: boolean) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />,
          title: 'Chờ xác nhận',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          label: 'Chờ duyệt'
        };
      case 'confirmed':
        return {
          icon: <Check className="w-5 h-5 text-green-500" />,
          title: isPersonal ? 'Lịch cá nhân' : 'Đã xác nhận',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          label: 'Đã xác nhận'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          title: 'Bị từ chối',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          label: 'Từ chối'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-5 h-5 text-slate-500" />,
          title: 'Đã hủy',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-800',
          label: 'Đã hủy'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-slate-500" />,
          title: 'Không xác định',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-800',
          label: 'Không xác định'
        };
    }
  };

  const allPending = bookings.every(b => b.status === 'pending');
  const allConfirmed = bookings.every(b => b.status === 'confirmed');
  const anyRejected = bookings.some(b => b.status === 'rejected' || b.status === 'cancelled');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (bookings.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết đặt lịch</h1>
            <p className="text-slate-600">Thông tin chi tiết về lịch tập của bạn</p>
          </div>
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy lịch đặt</h2>
            <p className="text-slate-500 mb-6">Lịch đặt không tồn tại hoặc đã bị xóa.</p>
            <Button variant="contained" onClick={() => navigate('/dashboard/trainers')}
              sx={{ textTransform: 'none', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
              Đặt lịch mới
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstBooking = bookings[0];
  const isPersonal = !firstBooking.trainerId;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết đặt lịch</h1>
          <p className="text-slate-600">
            Đã đặt <strong>{bookings.length}</strong> buổi tập với huấn luyện viên
          </p>
        </div>

        <div className={`rounded-2xl p-6 ${
          allConfirmed ? 'bg-green-50 border border-green-200' :
          anyRejected ? 'bg-red-50 border border-red-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-4">
            {allConfirmed ? (
              <Check className="w-10 h-10 text-green-500" />
            ) : anyRejected ? (
              <XCircle className="w-10 h-10 text-red-500" />
            ) : (
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            )}
            <div>
              <h2 className={`text-xl font-bold ${
                allConfirmed ? 'text-green-800' :
                anyRejected ? 'text-red-800' :
                'text-amber-800'
              }`}>
                {allConfirmed ? 'Tất cả lịch đã được xác nhận!' :
                 anyRejected ? 'Có lịch bị từ chối' :
                 'Đang chờ xác nhận'}
              </h2>
              <p className={`${
                allConfirmed ? 'text-green-700' :
                anyRejected ? 'text-red-700' :
                'text-amber-700'
              }`}>
                {allConfirmed ? 'HLV đã xác nhận tất cả các buổi tập. Vui lòng đến đúng giờ.' :
                 anyRejected ? 'Một số buổi tập đã bị từ chối. Vui lòng kiểm tra chi tiết bên dưới.' :
                 `Yêu cầu đặt ${bookings.length} buổi đã được gửi. HLV sẽ xác nhận sớm nhất.`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {isPersonal ? 'Thông tin tập luyện' : 'Thông tin Huấn luyện viên'}
            </h2>

            {isPersonal ? (
              <div className="flex gap-6 mb-6">
                <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Tập luyện cá nhân</h3>
                  <p className="text-blue-600 font-medium mb-2">Tự do chọn thời gian</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 mb-6">
                <div className="w-32 h-32 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl font-bold text-indigo-600">
                    {firstBooking.trainerId?.fullName?.charAt(0) || 'H'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{firstBooking.trainerId?.fullName || 'N/A'}</h3>
                  <p className="text-indigo-600 font-medium mb-2">Huấn luyện viên</p>
                  {firstBooking.trainerId?.phone && (
                    <p className="text-sm text-slate-600">SĐT: {firstBooking.trainerId.phone}</p>
                  )}
                </div>
              </div>
            )}

            {firstBooking.locationId && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{firstBooking.locationId.title}</span>
                  {firstBooking.locationId.address && (
                    <span className="text-sm text-slate-400">- {firstBooking.locationId.address}</span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Danh sách buổi tập ({bookings.length})</h3>
              <div className="space-y-3">
                {bookings.map((b, idx) => {
                  const sc = getStatusConfig(b.status, !b.trainerId);
                  return (
                    <div key={b._id} className={`rounded-xl border p-4 ${sc.bgColor} ${sc.borderColor}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {new Date(b.date).toLocaleDateString('vi-VN', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-slate-600">
                              {b.startTime ? `${b.startTime} - ${b.endTime}` : b.time}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bgColor} ${sc.textColor} border ${sc.borderColor}`}>
                          {sc.label}
                        </span>
                      </div>
                      {(b.status === 'rejected' || b.status === 'cancelled') && b.rejectionReason && (
                        <p className="mt-2 text-sm text-red-600 ml-9">Lý do: {b.rejectionReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Chi tiết đặt lịch</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày tạo</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(firstBooking.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {(firstBooking.disciplineId || firstBooking.disciplineName) && (
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="w-5 h-5 text-purple-600 flex items-center justify-center font-bold text-sm">M</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bộ môn</p>
                    <p className="font-semibold text-slate-900">{firstBooking.disciplineId?.name || firstBooking.disciplineName}</p>
                  </div>
                </div>
              )}

              {bookings.length > 1 && (
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <span className="w-5 h-5 text-amber-600 flex items-center justify-center font-bold text-sm">#</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tổng số buổi</p>
                    <p className="font-semibold text-slate-900">{bookings.length} buổi</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {allConfirmed && (
                <Button fullWidth variant="contained"
                  startIcon={<Eye className="w-4 h-4" />}
                  onClick={() => navigate('/dashboard/schedule')}
                  sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                    fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                  Xem lịch tập
                </Button>
              )}
              {anyRejected && !isPersonal && (
                <Button fullWidth variant="contained"
                  onClick={() => navigate('/dashboard/trainers')}
                  sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                    fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                  Đặt lịch mới
                </Button>
              )}
              {allPending && (
                <Button fullWidth variant="outlined"
                  onClick={() => navigate('/dashboard/trainers')}
                  sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem', fontWeight: 700 }}>
                  Quay lại danh sách HLV
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
