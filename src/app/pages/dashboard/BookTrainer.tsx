import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight, CreditCard, Loader2, Phone, Mail, X, Check } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

export function BookTrainer() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showContact, setShowContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  useEffect(() => {
    if (!trainerId) return;
    const fetchTrainer = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/staff/${trainerId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        setTrainer(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchTrainer();
  }, [trainerId]);

  useEffect(() => {
    if (!selectedDate || !trainerId) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/bookings/check-conflict?trainerId=${trainerId}&date=${dateStr}&time=all`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookedSlots(data.map((b: any) => b.time));
        } else {
          setBookedSlots([]);
        }
      } catch (e) {
        setBookedSlots([]);
      }
    };
    fetchBookings();
  }, [selectedDate, trainerId, currentMonth, currentYear]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime || !trainer) return;
    setSubmitting(true);
    try {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const locId = trainer.locationId?._id || trainer.locationId || user?.locationId || null;
      const res = await fetch(`${getApiUrl()}/api/bookings`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: trainer._id,
          date: dateStr,
          time: selectedTime,
          locationId: locId,
          price: trainer.pricePerSession || 500000
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đặt lịch thất bại');
      setConfirmed(true);
      setTimeout(() => {
        navigate('/payment', {
          state: {
            type: 'trainer_booking',
            booking: data.booking,
            trainer,
            totalPrice: trainer.pricePerSession || 500000,
            package: { name: `PT 1 buổi với ${trainer.fullName}`, price: trainer.pricePerSession || 500000 }
          }
        });
      }, 1500);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
    setSubmitting(false);
  };

  const monthNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chọn thời gian</h1>
          <p className="text-slate-600">
            {trainer ? `Đặt lịch với ${trainer.fullName}` : 'Chọn ngày và giờ phù hợp'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Tháng {monthNames[currentMonth]} / {currentYear}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                  <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7 }, (_, i) => {
                  const day = i - firstDayOfMonth + 1;
                  const isSelected = selectedDate === day;
                  const isValid = day >= 1 && day <= daysInMonth;
                  const isPast = isValid && new Date(currentYear, currentMonth, day) < new Date(new Date().toDateString());
                  return (
                    <button
                      key={i}
                      onClick={() => isValid && !isPast && setSelectedDate(day)}
                      disabled={!isValid || isPast}
                      className={`aspect-square rounded-xl border-2 font-semibold transition-all ${
                        !isValid ? 'bg-slate-50 border-slate-100 cursor-not-allowed' :
                        isPast ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' :
                        'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      {isValid && day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">
                {selectedDate ? `Chọn giờ cho ngày ${selectedDate}/${monthNames[currentMonth]}` : 'Chọn ngày trước'}
              </h3>

              {selectedDate ? (
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                          isBooked
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                            : selectedTime === time
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
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
        )}

        {confirmed ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">Đặt lịch thành công!</h3>
            <p className="text-green-700">Đang chuyển đến trang thanh toán...</p>
          </div>
        ) : (
          <>
            {selectedDate && selectedTime && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                <h4 className="font-semibold text-indigo-900 mb-2">Thông tin đặt lịch:</h4>
                <p className="text-indigo-700 mb-2">
                  Ngày: <span className="font-bold">{selectedDate}/{monthNames[currentMonth]}/{currentYear}</span> - Giờ: <span className="font-bold">{selectedTime}</span>
                </p>
                {trainer && (
                  <div className="flex justify-between items-center pt-3 border-t border-indigo-200">
                    <span className="text-indigo-800 font-medium">Phí HLV:</span>
                    <span className="text-xl font-bold text-indigo-900">{(trainer.pricePerSession || 500000).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outlined" onClick={() => navigate(-1)}
                sx={{ height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem', minWidth: 120 }}>
                Quay lại
              </Button>
              <Button variant="outlined" onClick={() => setShowContact(true)} startIcon={<Phone className="w-5 h-5" />}
                sx={{ height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem', minWidth: 140, borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' } }}>
                Liên hệ HLV
              </Button>
              <Button variant="contained" onClick={handlePayment} disabled={!selectedDate || !selectedTime || submitting}
                startIcon={<CreditCard className="w-5 h-5" />}
                sx={{ flex: 2, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                  fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                {submitting ? 'Đang xử lý...' : 'Thanh toán'}
              </Button>
            </div>
          </>
        )}
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
                <p className="text-sm text-slate-500">{trainer.disciplineId?.name || trainer.job?.name || 'HLV'}</p>
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
