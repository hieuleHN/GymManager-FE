import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight, CreditCard, ArrowLeft, User, MapPin, Phone, Mail, X, Trash2, Loader2 } from 'lucide-react';
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
  disciplineId?: { _id: string; name: string } | null;
  specialties?: string[];
}

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

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateKey(key: string): { day: number; month: number; year: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { day: d, month: m - 1, year: y };
}

export function BookTrainer() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selections, setSelections] = useState<Record<string, { start: string; end: string }>>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);
  const [trainerShifts, setTrainerShifts] = useState<Record<string, string[]>>({});
  const [loadingShifts, setLoadingShifts] = useState(false);
  const activeDateRef = useRef(activeDate);
  useEffect(() => { activeDateRef.current = activeDate; }, [activeDate]);

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

  const fetchTrainerShiftsForMonth = async (year: number, month: number) => {
    setLoadingShifts(true);
    try {
      const start = formatDateKey(new Date(year, month, 1));
      const end = formatDateKey(new Date(year, month + 1, 0));
      const res = await fetch(`${getApiUrl()}/api/staff-shifts/by-range?startDate=${start}&endDate=${end}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const shifts: Record<string, string[]> = {};
        (data.data || []).forEach((a: any) => {
          if (a.staffId?._id === trainerId) {
            const d = a.date ? a.date.split('T')[0] : '';
            if (!shifts[d]) shifts[d] = [];
            if (!shifts[d].includes(a.shift)) shifts[d].push(a.shift);
          }
        });
        setTrainerShifts(shifts);
      }
    } catch {} finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    if (trainerId) {
      fetchTrainerShiftsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    }
  }, [currentMonth, trainerId]);

  useEffect(() => {
    if (!activeDate || !trainerId) {
      setBookedTimes(new Set());
      return;
    }
    fetchBookingsForDate(activeDate);
  }, [activeDate, trainerId]);

  const fetchBookingsForDate = async (dateStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/bookings/trainer/${trainerId}?date=${dateStr}`,
        { headers: getAuthHeaders() }
      );
      if (activeDateRef.current !== dateStr) return;
      if (res.ok) {
        const data = await res.json();
        const times = new Set<string>();
        if (Array.isArray(data)) {
          data.forEach((b: any) => { if (b.time) times.add(b.time); });
        }
        setBookedTimes(times);
      }
    } catch {} finally {
      if (activeDateRef.current === dateStr) setLoadingSlots(false);
    }
  };

  const getDateShifts = (dateStr: string): string[] => trainerShifts[dateStr] || [];

  const hasAnyShift = (dateStr: string): boolean => getDateShifts(dateStr).length > 0;

  const isSlotDisabled = (slot: { start: string; end: string }): boolean => {
    if (!activeDate) return true;
    if (selections[activeDate]?.start === slot.start) return false;
    for (const t of bookedTimes) {
      if (t >= slot.start && t < slot.end) return true;
    }
    const shifts = getDateShifts(activeDate);
    if (shifts.length === 0) return true;
    const slotIndex = timeSlots.findIndex(s => s.start === slot.start);
    const isMorning = slotIndex >= 0 && slotIndex < 5;
    if (isMorning && !shifts.includes('morning-noon')) return true;
    if (!isMorning && !shifts.includes('afternoon-evening')) return true;
    return false;
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

    const dateKey = formatDateKey(clickedDate);

    if (activeDate === dateKey) {
      setActiveDate(null);
      return;
    }

    setActiveDate(dateKey);
  };

  const handleTimeSelect = (slot: { start: string; end: string }) => {
    if (!activeDate) return;
    if (isSlotDisabled(slot)) return;

    setSelections(prev => ({
      ...prev,
      [activeDate]: slot
    }));
    setActiveDate(null);
  };

  const handleRemoveDate = (dateKey: string) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
    if (activeDate === dateKey) {
      setActiveDate(null);
    }
  };

  const handlePayment = async () => {
    if (!selectedDisciplineId) {
      toast.error('Vui lòng chọn bộ môn tập!');
      return;
    }
    const slotCount = Object.keys(selections).length;
    if (slotCount === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày và giờ!');
      return;
    }
    if (!trainer) return;

    setCheckingConflict(true);
    try {
      const locId = trainer.locationId?._id || user?.locationId || null;
      const price = trainer.pricePerSession || 500000;

      const slots = Object.entries(selections).map(([date, time]) => ({
        date,
        time: time.start,
        startTime: time.start,
        endTime: time.end
      }));

      const bookingRes = await fetch(`${getApiUrl()}/api/bookings/bulk`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: trainer._id,
          disciplineId: selectedDisciplineId,
          slots,
          locationId: locId,
          price
        })
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || 'Đặt lịch thất bại');

      const allBookings = bookingData.bookings || (bookingData.booking ? [bookingData.booking] : []);
      const batchId = allBookings[0]?.batchId || '';
      const totalPrice = price * (allBookings.length || 1);

      navigate('/payment', {
        state: {
          type: 'trainer_booking',
          bookings: allBookings,
          batchId,
          trainer,
          totalPrice,
          package: { name: `PT ${allBookings.length} buổi với ${trainer.fullName}`, price: totalPrice }
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối server!');
    } finally {
      setCheckingConflict(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const price = trainer?.pricePerSession || 500000;
  const selectionCount = Object.keys(selections).length;

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
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{trainer.fullName}</h3>
              <p className="text-sm text-slate-500">{trainer.job?.name || 'HLV'}</p>
              {(trainer.disciplineId || (trainer.specialties && trainer.specialties.length > 0)) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {trainer.disciplineId && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                      {trainer.disciplineId.name}
                    </span>
                  )}
                  {trainer.specialties?.map(s => (
                    <span key={s} className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {trainer.locationId && (
              <div className="ml-auto flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                {trainer.locationId.title}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Chọn bộ môn tập</h3>
          {(() => {
            const items: { id: string; name: string; isMain: boolean }[] = [];
            if (trainer.disciplineId) items.push({ id: trainer.disciplineId._id, name: trainer.disciplineId.name, isMain: true });
            trainer.specialties?.forEach(s => {
              if (!items.find(i => i.name === s)) items.push({ id: s, name: s, isMain: false });
            });
            return items.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {items.map(item => (
                  <button key={item.id} onClick={() => setSelectedDisciplineId(item.id)}
                    className={`px-5 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                      selectedDisciplineId === item.id
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}>
                    {item.name}
                    {item.isMain && <span className="ml-1.5 text-[10px] opacity-70">(Chính)</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">HLV chưa có bộ môn nào</p>
            );
          })()}
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
                const dateObj = isValid ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                const dateKey = dateObj ? formatDateKey(dateObj) : '';
                const isToday = isValid &&
                  day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear();
                const isBooked = isValid && !!selections[dateKey];
                const isActive = isValid && activeDate === dateKey;
                const isPast = isValid && dateObj! < new Date(new Date().setHours(0, 0, 0, 0));
                const isDisabled = !isValid || isPast || (!loadingShifts && isValid && !hasAnyShift(dateKey));

                return (
                  <button key={i} onClick={() => isValid && handleDateClick(day)}
                    disabled={isDisabled}
                    className={`aspect-square rounded-xl border-2 font-semibold transition-all ${
                      isPast
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed text-slate-300'
                        : !isValid
                        ? 'border-transparent cursor-default'
                        : !loadingShifts && !hasAnyShift(dateKey)
                        ? 'bg-orange-50 border-orange-200 cursor-not-allowed text-orange-300'
                        : isBooked
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : isActive
                        ? 'border-indigo-400 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                        : isToday
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}>
                    {isValid && day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border-2 border-indigo-600 bg-indigo-600" />
                Đã chọn giờ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border-2 border-indigo-400 bg-indigo-100" />
                Đang chọn giờ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border-2 border-green-400 bg-green-50" />
                Hôm nay
              </span>
              {!loadingShifts && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border-2 border-orange-200 bg-orange-50" />
                  HLV không có ca
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {activeDate
                ? `Chọn giờ cho ngày ${activeDate.split('-')[2]}/${activeDate.split('-')[1]}`
                : selectionCount > 0
                ? `Đã chọn ${selectionCount} buổi`
                : 'Chọn ngày trước'}
            </h3>

            {activeDate ? (
              <>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {timeSlots.map((slot) => {
                      const disabled = isSlotDisabled(slot);
                      const isSelected = selections[activeDate]?.start === slot.start;
                      return (
                        <button key={slot.start} onClick={() => handleTimeSelect(slot)} disabled={disabled}
                          className={`relative px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                            disabled
                              ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                              : isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}>
                          {slot.start} - {slot.end}
                          {disabled && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {(() => {
                                const shifts = getDateShifts(activeDate);
                                const slotIndex = timeSlots.findIndex(s => s.start === slot.start);
                                const isMorning = slotIndex >= 0 && slotIndex < 5;
                                if (shifts.length > 0 && isMorning && !shifts.includes('morning-noon')) return 'HLV không làm ca sáng';
                                if (shifts.length > 0 && !isMorning && !shifts.includes('afternoon-evening')) return 'HLV không làm ca chiều';
                                return 'HLV đã có lịch';
                              })()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selections[activeDate] && (
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => handleRemoveDate(activeDate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" /> Xoá buổi này
                    </button>
                  </div>
                )}
              </>
            ) : selectionCount > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(selections).map(([dateKey, time]) => (
                  <div key={dateKey}
                    className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50">
                    <div>
                      <span className="font-semibold text-indigo-900">
                        {dateKey.split('-')[2]}/{dateKey.split('-')[1]}/{dateKey.split('-')[0]}
                      </span>
                      <span className="ml-3 text-sm text-indigo-600">
                        {time.start} - {time.end}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveDate(dateKey)}
                      className="p-1.5 hover:bg-indigo-200 rounded-lg transition-colors text-indigo-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-sm text-slate-500 pt-1">
                  Click vào ngày trên lịch để thêm buổi tập mới
                </p>
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

        {selectionCount > 0 && (() => {
          return (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
              <h4 className="font-semibold text-indigo-900 mb-2">Thông tin đặt lịch:</h4>
              <p className="text-indigo-700 mb-3">
                Tổng số buổi: <span className="font-bold">{selectionCount}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(selections).map(([dateKey, time]) => {
                  const { day, month, year } = parseDateKey(dateKey);
                  return (
                    <span key={dateKey} className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      {day}/{month + 1}: {time.start}-{time.end}
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-indigo-200">
                <span className="text-indigo-800 font-medium">Tổng phí HLV ({selectionCount} buổi):</span>
                <span className="text-xl font-bold text-indigo-900">{(price * selectionCount).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          );
        })()}

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
            disabled={selectionCount === 0 || checkingConflict}
            startIcon={<CreditCard className="w-5 h-5" />}
            sx={{ flex: 2, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
              fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
            {checkingConflict ? 'Đang kiểm tra...' : `Thanh toán`}
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
