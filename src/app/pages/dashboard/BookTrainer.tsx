import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight, CreditCard, ArrowLeft, User, MapPin, Phone, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Trainer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  job?: { name: string };
  locationId?: { _id: string; title: string };
  avatar?: string;
  experience?: string;
  pricePerSession?: number;
}

export function BookTrainer() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  useEffect(() => {
    fetchTrainer();
  }, [trainerId]);

  const fetchTrainer = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${trainerId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTrainer(data);
      }
    } catch {
      toast.error('Lỗi tải thông tin HLV!');
    } finally {
      setLoading(false);
    }
  };

  const isTimeDisabled = (time: string): boolean => {
    if (!selectedDate) return true;
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = time.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    return selectedDateTime <= now;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate < today) return;
    setSelectedDate(clickedDate);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    if (isTimeDisabled(time)) return;
    setSelectedTime(time);
  };

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime || !trainer) {
      toast.error('Vui lòng chọn ngày và giờ!');
      return;
    }

    setCheckingConflict(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const conflictRes = await fetch(
        `${getApiUrl()}/api/bookings/check-conflict?trainerId=${trainer._id}&date=${dateStr}&time=${selectedTime}`,
        { headers: getAuthHeaders() }
      );
      const conflictData = await conflictRes.json();

      if (conflictData.hasConflict) {
        toast.error('HLV đã có lịch vào thời gian này! Vui lòng chọn thời gian khác.');
        setCheckingConflict(false);
        return;
      }

      const locId = trainer.locationId?._id || user?.locationId || null;
      const price = trainer.pricePerSession || 500000;

      const bookingRes = await fetch(`${getApiUrl()}/api/bookings`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: trainer._id,
          date: dateStr,
          time: selectedTime,
          locationId: locId,
          price
        })
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || 'Đặt lịch thất bại');

      toast.success('Đặt lịch thành công!');
      setTimeout(() => {
        navigate('/payment', {
          state: {
            type: 'trainer_booking',
            booking: bookingData.booking || bookingData,
            trainer,
            totalPrice: price,
            package: { name: `PT 1 buổi với ${trainer.fullName}`, price }
          }
        });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối server!');
    } finally {
      setCheckingConflict(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const price = trainer?.pricePerSession || 500000;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <p className="text-slate-500">Không tìm thấy HLV</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/trainers')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Chọn thời gian</h1>
            <p className="text-slate-600">Đặt lịch tập với huấn luyện viên</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{trainer.fullName}</h3>
              <p className="text-sm text-slate-500">{trainer.job?.name || 'HLV'}</p>
            </div>
            {trainer.locationId && (
              <div className="ml-auto flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                {trainer.locationId.title}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">
                Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
              </h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }, (_, i) => {
                const day = i - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = isValid &&
                  day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear();
                const isSelected = isValid && selectedDate &&
                  day === selectedDate.getDate() &&
                  currentMonth.getMonth() === selectedDate.getMonth() &&
                  currentMonth.getFullYear() === selectedDate.getFullYear();
                const isPast = isValid && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button key={i} onClick={() => isValid && handleDateClick(day)}
                    disabled={!isValid || isPast}
                    className={`aspect-square rounded-xl border-2 font-semibold transition-all ${
                      !isValid || isPast
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed text-slate-300'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : isToday
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}>
                    {isValid && day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {selectedDate
                ? `Chọn giờ cho ngày ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`
                : 'Chọn ngày trước'}
            </h3>

            {selectedDate ? (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {timeSlots.map((time) => {
                  const disabled = isTimeDisabled(time);
                  return (
                    <button key={time} onClick={() => handleTimeSelect(time)} disabled={disabled}
                      className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                        disabled
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : selectedTime === time
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}>
                      {time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChevronLeft className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Vui lòng chọn ngày để xem giờ có sẵn</p>
              </div>
            )}
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
            <h4 className="font-semibold text-indigo-900 mb-2">Thông tin đặt lịch:</h4>
            <p className="text-indigo-700 mb-2">
              Ngày: <span className="font-bold">{selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</span> - Giờ: <span className="font-bold">{selectedTime}</span>
            </p>
            <div className="flex justify-between items-center pt-3 border-t border-indigo-200">
              <span className="text-indigo-800 font-medium">Phí HLV:</span>
              <span className="text-xl font-bold text-indigo-900">{price.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="outlined" onClick={() => navigate(-1)}
            sx={{ flex: 1, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem' }}>
            Quay lại
          </Button>
          <Button variant="outlined" onClick={() => setShowContact(true)} startIcon={<Phone className="w-5 h-5" />}
            sx={{ flex: 1, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem', borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' } }}>
            Liên hệ HLV
          </Button>
          <Button variant="contained" onClick={handlePayment}
            disabled={!selectedDate || !selectedTime || checkingConflict}
            startIcon={<CreditCard className="w-5 h-5" />}
            sx={{ flex: 2, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
              fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
            {checkingConflict ? 'Đang kiểm tra...' : 'Thanh toán'}
          </Button>
        </div>
      </div>

      {showContact && trainer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Liên hệ HLV</h3>
              <button onClick={() => setShowContact(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <img src={trainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=100'} alt={trainer.fullName}
                className="w-16 h-16 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{trainer.fullName}</h4>
                <p className="text-sm text-slate-500">{trainer.job?.name || 'HLV'}</p>
              </div>
            </div>
            <div className="space-y-4">
              {trainer.phone && (
                <a href={`tel:${trainer.phone}`} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <Phone className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">{trainer.phone}</span>
                </a>
              )}
              {trainer.email && (
                <a href={`mailto:${trainer.email}`} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">{trainer.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
