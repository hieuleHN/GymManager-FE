import { DashboardLayout } from '../../components/DashboardLayout';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import { Calendar, Clock, Star, Check, MapPin } from 'lucide-react';
import { useState } from 'react';

const trainers = [
  {
    id: '1',
    name: 'Nguyễn Thùy Anh',
    specialty: 'Yoga & GroupX',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400',
    experience: '8 năm kinh nghiệm',
    certifications: ['Yoga Alliance RYT-500', 'ISSA Certified', 'Nutrition Specialist'],
    price: 500000,
    club: 'ZenFitness Quận 1'
  }
];

export function ConfirmTrainerBooking() {
  const { trainerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { date, time } = location.state || {};
  const [confirmed, setConfirmed] = useState(false);

  const trainer = trainers.find(t => t.id === trainerId) || trainers[0];

  const handlePayment = () => {
    setConfirmed(true);
    setTimeout(() => {
      navigate('/payment', {
        state: {
          package: { name: `PT với ${trainer.name}`, price: trainer.price },
          club: { name: trainer.club },
          durationType: 'session',
          totalPrice: trainer.price
        }
      });
    }, 1500);
  };

  if (confirmed) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">HLV đã xác nhận!</h2>
            <p className="text-slate-600 mb-6">
              Huấn luyện viên đã xác nhận lịch tập. Đang chuyển đến trang thanh toán...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Xác nhận đặt lịch</h1>
          <p className="text-slate-600">Kiểm tra thông tin trước khi thanh toán</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trainer Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin Huấn luyện viên</h2>

            <div className="flex gap-6 mb-6">
              <img
                src={trainer.image}
                alt={trainer.name}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{trainer.name}</h3>
                <p className="text-indigo-600 font-medium mb-2">{trainer.specialty}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-slate-900">{trainer.rating}</span>
                  <span className="text-slate-500">({trainer.reviews} đánh giá)</span>
                </div>
                <p className="text-sm text-slate-600">{trainer.experience}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Chứng chỉ:</h4>
                <div className="space-y-2">
                  {trainer.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{trainer.club}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Vui lòng đến đúng giờ. Nếu cần hủy lịch, vui lòng thông báo trước 24 giờ.
              </p>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Chi tiết đặt lịch</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày tập</p>
                  <p className="font-semibold text-slate-900">{date}/06/2024</p>
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
                <span className="font-semibold text-slate-900">
                  {trainer.price.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="font-semibold text-slate-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {trainer.price.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={handlePayment}
              sx={{
                height: 56,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' }
              }}
            >
              Thanh toán
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
