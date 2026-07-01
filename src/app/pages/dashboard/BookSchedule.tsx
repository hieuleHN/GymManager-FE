import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect, useMemo } from 'react';
import { Button, Chip } from '@mui/material';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { getAuthHeaders } from '../../context/AuthContext';

interface Booking {
  _id: string;
  trainerId: { _id: string; fullName: string };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  locationId?: { _id: string; title: string };
  note?: string;
}

export function BookSchedule() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/bookings/my', { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  const getWeekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const getMonthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth, startOffset, year, month };
  }, [currentMonth]);

  const getBookingsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && b.status !== 'rejected' && b.status !== 'cancelled';
    });
  };

  const getBookingsForHour = (date: Date, hour: string) => {
    const dayBookings = getBookingsForDate(date);
    return dayBookings.filter(b => b.time === hour);
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'warning' as const, text: 'Chờ xác nhận', bg: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 'confirmed':
        return { color: 'success' as const, text: 'Đã xác nhận', bg: 'bg-green-100 text-green-700 border-green-300' };
      default:
        return { color: 'default' as const, text: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSameDate = (a: Date, b: Date) => {
    return a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();
  };

  const weekRangeText = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const startStr = `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1}/${currentWeekStart.getFullYear()}`;
    const endStr = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    return `Tuần ${startStr} - ${endStr}`;
  }, [currentWeekStart]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Lịch tập</h1>
            <p className="text-slate-600">Xem và quản lý lịch tập luyện</p>
          </div>
          <Link to="/dashboard/schedule/book">
            <Button
              variant="contained"
              startIcon={<Plus className="w-5 h-5" />}
              sx={{
                height: 48,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' }
              }}
            >
              Đặt lịch mới
            </Button>
          </Link>
        </div>

        {/* Calendar Card */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          {/* View Toggle & Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={viewMode === 'week' ? handlePrevWeek : handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">
                {viewMode === 'week' ? weekRangeText : `Tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`}
              </h2>
              <button
                onClick={viewMode === 'week' ? handleNextWeek : handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tháng
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'week' ? (
              <div className="h-full flex flex-col">
                {/* Week Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-sm text-slate-600 font-medium"></div>
                  {getWeekDays.map((date, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm text-slate-600 mb-1">{weekDays[idx]}</div>
                      <div className={`font-bold ${isToday(date) ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Grid */}
                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="h-full grid grid-rows-8 gap-px bg-slate-200">
                    {hours.map((hour, hourIdx) => (
                      <div key={hour} className="grid grid-cols-8 gap-px">
                        <div className="bg-white p-2 text-sm text-slate-600 font-medium flex items-center justify-center">
                          {hour}
                        </div>
                        {getWeekDays.map((date, dayIdx) => {
                          const hourBookings = getBookingsForHour(date, hour);
                          return (
                            <div key={dayIdx} className="bg-white p-1 relative min-h-[60px]">
                              {hourBookings.map((booking) => {
                                const statusConfig = getStatusConfig(booking.status);
                                return (
                                  <div
                                    key={booking._id}
                                    onClick={() => navigate(`/dashboard/trainers/${booking.trainerId._id}/confirm`, { state: { bookingId: booking._id } })}
                                    className={`absolute inset-1 rounded-lg border-2 p-1.5 cursor-pointer hover:opacity-80 transition-opacity ${statusConfig.bg}`}
                                  >
                                    <p className="font-bold text-xs leading-tight">{booking.trainerId?.fullName || 'HLV'}</p>
                                    <p className="text-xs opacity-75">{booking.time}</p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Month Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                    <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Month Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-7 grid-rows-5 gap-2 h-full">
                    {Array.from({ length: 35 }, (_, i) => {
                      const dayNum = i - getMonthDays.startOffset + 1;
                      const isValid = dayNum >= 1 && dayNum <= getMonthDays.daysInMonth;
                      const cellDate = new Date(getMonthDays.year, getMonthDays.month, dayNum);
                      const dayBookings = isValid ? getBookingsForDate(cellDate) : [];
                      const todayFlag = isValid && isToday(cellDate);

                      return (
                        <div
                          key={i}
                          className={`rounded-xl border-2 p-2 transition-all ${
                            !isValid
                              ? 'bg-slate-50 border-slate-100'
                              : dayBookings.length > 0
                              ? 'border-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100'
                              : todayFlag
                              ? 'border-green-300 bg-green-50'
                              : 'border-slate-200 hover:border-slate-300 cursor-pointer bg-white'
                          }`}
                        >
                          {isValid && (
                            <div className="h-full flex flex-col">
                              <div className={`font-bold text-sm mb-1 ${todayFlag ? 'text-green-600' : 'text-slate-900'}`}>
                                {dayNum}
                              </div>
                              {dayBookings.slice(0, 2).map((booking) => {
                                const statusConfig = getStatusConfig(booking.status);
                                return (
                                  <div
                                    key={booking._id}
                                    onClick={() => navigate(`/dashboard/trainers/${booking.trainerId._id}/confirm`, { state: { bookingId: booking._id } })}
                                    className={`text-xs px-1.5 py-0.5 rounded mb-1 cursor-pointer hover:opacity-80 ${statusConfig.bg}`}
                                  >
                                    <div className="font-semibold truncate">{booking.time}</div>
                                    <div className="truncate">{booking.trainerId?.fullName || 'HLV'}</div>
                                  </div>
                                );
                              })}
                              {dayBookings.length > 2 && (
                                <div className="text-xs text-indigo-600 font-medium">+{dayBookings.length - 2} nữa</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-400"></div>
                <span className="text-slate-600">Chờ xác nhận</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-slate-600">Đã xác nhận</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-400"></div>
                <span className="text-slate-600">Hôm nay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}