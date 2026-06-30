import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Booking {
  _id: string;
  date: string;
  time: string;
  status: string;
  trainerId: { fullName: string; _id: string };
  customerId: { fullName: string };
  locationId: { title: string };
}

export function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/bookings/my`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && (b.status === 'confirmed' || b.status === 'pending');
    });
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const getColorForStatus = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-700 border-green-300';
    if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && (b.status === 'confirmed' || b.status === 'pending');
    });
  };

  const formatDateStr = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Lịch tập</h1>
            <p className="text-slate-600">Xem và quản lý lịch tập luyện</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/trainers">
              <Button
                variant="outlined"
                startIcon={<CalendarDays className="w-5 h-5" />}
                sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem', fontWeight: 700 }}
              >
                Đặt lịch HLV
              </Button>
            </Link>
            <Link to="/dashboard/schedule/book">
              <Button
                variant="contained"
                startIcon={<Plus className="w-5 h-5" />}
                sx={{ height: 48, borderRadius: 3, textTransform: 'none', fontSize: '1rem', fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
              >
                Đặt lịch mới
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={prevPeriod} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">
                {viewMode === 'week'
                  ? `Tuần ${formatDateStr(weekDates[0])} - ${formatDateStr(weekDates[6])}`
                  : `Tháng ${month + 1}/${year}`}
              </h2>
              <button onClick={nextPeriod} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('week')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Tuần
              </button>
              <button onClick={() => setViewMode('month')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Tháng
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              {viewMode === 'week' ? (
                <div className="h-full flex flex-col">
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="text-sm text-slate-600 font-medium"></div>
                    {weekDates.map((date, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-sm text-slate-600 mb-1">{weekDays[idx]}</div>
                        <div className={`font-bold ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="h-full grid grid-rows-[repeat(15,1fr)] gap-px bg-slate-200">
                      {hours.map((hour, hourIdx) => (
                        <div key={hour} className="grid grid-cols-8 gap-px">
                          <div className="bg-white p-2 text-sm text-slate-600 font-medium flex items-center justify-center text-center">
                            {hour}
                          </div>
                          {weekDates.map((date, dayIdx) => {
                            const dayBookings = getBookingsForDay(date).filter(b => b.time === hour);
                            return (
                              <div key={dayIdx} className="bg-white p-0.5 relative min-h-[40px]">
                                {dayBookings.map(b => (
                                  <div key={b._id} className={`absolute inset-0.5 rounded-lg border p-1 ${getColorForStatus(b.status)} overflow-hidden`}>
                                    <p className="font-bold text-xs leading-tight truncate">{b.trainerId?.fullName || 'Tập cá nhân'}</p>
                                    <p className="text-xs opacity-75 truncate">{b.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ duyệt'}</p>
                                  </div>
                                ))}
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
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                      <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">{day}</div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-7 grid-rows-5 gap-2 h-full">
                      {Array.from({ length: 42 }, (_, i) => {
                        const day = i - firstDayOfMonth + 1;
                        const isValid = day >= 1 && day <= daysInMonth;
                        const dayBookings = isValid ? getBookingsForDate(day) : [];
                        const isToday = isValid && new Date(year, month, day).toDateString() === new Date().toDateString();
                        return (
                          <div key={i} className={`rounded-xl border-2 p-1 ${!isValid ? 'bg-slate-50 border-slate-100' : dayBookings.length > 0 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                            {isValid && (
                              <div className="h-full flex flex-col">
                                <div className={`font-bold text-sm mb-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>{day}</div>
                                {dayBookings.slice(0, 3).map(b => (
                                  <div key={b._id} className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {b.time} {b.trainerId?.fullName || 'Tập'}
                                  </div>
                                ))}
                                {dayBookings.length > 3 && (
                                  <div className="text-xs text-slate-400 px-1">+{dayBookings.length - 3} nữa</div>
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
          )}

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-slate-600">Đã xác nhận</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-slate-600">Chờ duyệt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
