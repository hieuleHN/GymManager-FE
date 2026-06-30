import { DashboardLayout } from '../../components/DashboardLayout';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import { Calendar, Clock, Star, Check, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

export function ConfirmTrainerBooking() {
  const { trainerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { date, time, month, year } = location.state || {};
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  useEffect(() => {
    if (!trainerId) return;
    const fetchData = async () => {
      try {
        const [trainerRes, infoRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/staff/${trainerId}`, { headers: getAuthHeaders() }),
          fetch(`${getApiUrl()}/api/customers/my-info`, { headers: getAuthHeaders() })
        ]);
        const trainerData = await trainerRes.json();
        const infoData = await infoRes.json();
        setTrainer(trainerData);
        setCustomerInfo(infoData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [trainerId]);

  const handlePayment = async () => {
    if (!trainer || !date || !time) return;
    setSubmitting(true);
    try {
      const bookingRes = await fetch(`${getApiUrl()}/api/bookings`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: trainer._id,
          date: `${year || new Date().getFullYear()}-${String((month || new Date().getMonth() + 1)).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
          time,
          locationId: trainer.locationId?._id || user?.locationId,
          price: trainer.pricePerSession || 500000
        })
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error);

      setConfirmed(true);
      setTimeout(() => {
        navigate('/payment', {
          state: {
            type: 'trainer_booking',
            package: { name: `PT 1 buổi với ${trainer.fullName}`, price: trainer.pricePerSession || 500000 },
            booking: bookingData.booking,
            trainer,
            totalPrice: trainer.pricePerSession || 500000,
            customer: customerInfo
          }
        });
      }, 1500);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500">Không tìm thấy HLV</div>
      </DashboardLayout>
    );
  }

  if (confirmed) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Đặt lịch thành công!</h2>
            <p className="text-slate-600 mb-6">
              Đang chuyển đến trang thanh toán...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const price = trainer.pricePerSession || 500000;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Xác nhận đặt lịch</h1>
          <p className="text-slate-600">Kiểm tra thông tin trước khi thanh toán</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin Huấn luyện viên</h2>
            <div className="flex gap-6 mb-6">
              <img
                src={trainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=200'}
                alt={trainer.fullName}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{trainer.fullName}</h3>
                <p className="text-indigo-600 font-medium mb-2">{trainer.disciplineId?.name || trainer.job?.name || 'HLV'}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-slate-900">{trainer.rating || 0}</span>
                  <span className="text-slate-500">({trainer.totalReviews || 0} đánh giá)</span>
                </div>
                {trainer.experience && <p className="text-sm text-slate-600">{trainer.experience}</p>}
              </div>
            </div>

            {trainer.certifications && trainer.certifications.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-slate-900">Chứng chỉ:</h4>
                {trainer.certifications.map((cert: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-slate-600">{cert}</span>
                  </div>
                ))}
              </div>
            )}

            {trainer.locationId && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{trainer.locationId.title}</span>
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
                  <p className="font-semibold text-slate-900">{date}/{month || new Date().getMonth() + 1}/{year || new Date().getFullYear()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Giờ tập</p>
                  <p className="font-semibold text-slate-900">{time}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">Phí HLV:</span>
                <span className="font-semibold text-slate-900">{price.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="font-semibold text-slate-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-indigo-600">{price.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={handlePayment}
              disabled={submitting}
              sx={{
                height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }
              }}
            >
              {submitting ? 'Đang xử lý...' : 'Thanh toán'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
