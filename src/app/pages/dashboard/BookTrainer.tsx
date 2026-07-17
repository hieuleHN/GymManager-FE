import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

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

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert('Vui lòng chọn ngày và giờ');
      return;
    }
    navigate(`/dashboard/trainers/${trainerId}/confirm`, {
      state: { date: selectedDate, time: selectedTime }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chọn thời gian</h1>
          <p className="text-slate-600">Chọn ngày và giờ phù hợp với lịch của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Tháng 6/2024</h2>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                  {day}
                </div>
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
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {day >= 1 && day <= 30 && day}
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

          {/* Time Slots */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {selectedDate ? `Chọn giờ cho ngày ${selectedDate}/06` : 'Chọn ngày trước'}
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

        {/* Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
            <h4 className="font-semibold text-indigo-900 mb-2">Thông tin đặt lịch:</h4>
            <p className="text-indigo-700">
              Ngày: <span className="font-bold">{selectedDate}/06/2024</span> - Giờ: <span className="font-bold">{selectedTime}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ flex: 1, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem' }}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            endIcon={<ArrowRight />}
            sx={{
              flex: 2,
              height: 56,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' }
            }}
          >
            Tiếp tục xác nhận
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
