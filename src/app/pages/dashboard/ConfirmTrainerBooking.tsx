import { DashboardLayout } from '../../components/DashboardLayout';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import { Calendar, Clock, Star, Check, MapPin, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface BookingDetail {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string; email: string };
  trainerId: { _id: string; fullName: string; phone?: string };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  locationId?: { _id: string; title: string; address?: string };
  disciplineId?: { _id: string; name: string } | null;
  disciplineName?: string;
  createdAt: string;
}

export function ConfirmTrainerBooking() {
  const { trainerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.bookingId) {
      fetchBooking(location.state.bookingId);
    } else {
      setLoading(false);
    }
  }, [location.state]);

  const fetchBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } catch {
      toast.error('Lỗi tải thông tin lịch đặt!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <AlertCircle className="w-10 h-10 text-amber-500" />,
          title: 'Đang chờ xác nhận',
          description: 'Yêu cầu đặt lịch đã được gửi. HLV hoặc Admin sẽ xác nhận sớm nhất.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'confirmed':
        return {
          icon: <Check className="w-10 h-10 text-green-500" />,
          title: 'Lịch tập đã được xác nhận!',
          description: 'HLV đã xác nhận lịch tập. Vui lòng đến đúng giờ.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          title: 'Lịch tập bị từ chối',
          description: 'Yêu cầu đặt lịch đã bị từ chối. Vui lòng chọn thời gian khác.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: <AlertCircle className="w-10 h-10 text-slate-500" />,
          title: 'Không xác định',
          description: '',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-800'
        };
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy lịch đặt</h2>
            <p className="text-slate-500 mb-6">Lịch đặt không tồn tại hoặc đã bị xóa.</p>
            <Button variant="contained" onClick={() => navigate('/dashboard/schedule/book')}
              sx={{ textTransform: 'none', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
              Quay lại lịch tập
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết đặt lịch</h1>
          <p className="text-slate-600">Thông tin chi tiết về lịch tập của bạn</p>
        </div>

        <div className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-2xl p-6`}>
          <div className="flex items-center gap-4">
            {statusConfig.icon}
            <div>
              <h2 className={`text-xl font-bold ${statusConfig.textColor}`}>{statusConfig.title}</h2>
              <p className={statusConfig.textColor}>{statusConfig.description}</p>
            </div>
          </div>
          {booking.status === 'rejected' && booking.rejectionReason && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-red-100">
              <p className="text-sm font-semibold text-red-700 mb-1">Lý do từ chối:</p>
              <p className="text-sm text-red-600">{booking.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin Huấn luyện viên</h2>

            <div className="flex gap-6 mb-6">
              <div className="w-32 h-32 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <span className="text-4xl font-bold text-indigo-600">
                  {booking.trainerId?.fullName?.charAt(0) || 'H'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{booking.trainerId?.fullName || 'N/A'}</h3>
                <p className="text-indigo-600 font-medium mb-2">Huấn luyện viên</p>
                {booking.trainerId?.phone && (
                  <p className="text-sm text-slate-600">SĐT: {booking.trainerId.phone}</p>
                )}
              </div>
            </div>

            {booking.locationId && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.locationId.title}</span>
                  {booking.locationId.address && (
                    <span className="text-sm text-slate-400">- {booking.locationId.address}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Chi tiết đặt lịch</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày tập</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(booking.date).toLocaleDateString('vi-VN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Giờ tập</p>
                  <p className="font-semibold text-slate-900">{booking.time}</p>
                </div>
              </div>

              {(booking.disciplineId || booking.disciplineName) && (
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="w-5 h-5 text-purple-600 flex items-center justify-center font-bold text-sm">M</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bộ môn</p>
                    <p className="font-semibold text-slate-900">{booking.disciplineId?.name || booking.disciplineName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mb-6">
              <div className="text-sm text-slate-500">
                Ngày đặt: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="space-y-3">
              <Button fullWidth variant="contained" onClick={() => navigate('/dashboard/schedule')}
                sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                  fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                Quay lại lịch tập
              </Button>
              {booking.status === 'rejected' && (
                <Button fullWidth variant="outlined" onClick={() => navigate('/dashboard/schedule/book')}
                  sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem', fontWeight: 700 }}>
                  Đặt lịch mới
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
