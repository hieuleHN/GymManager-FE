import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Booking {
  _id: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  rejectionReason?: string;
  disciplineId?: { _id: string; name: string } | null;
  trainerId?: { fullName: string; _id: string; specialties?: string[]; disciplineId?: { _id: string; name: string } | string } | null;
  customerId: { fullName: string };
  locationId: { title: string };
}

interface Discipline {
  _id: string;
  name: string;
}

export function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'week' | 'month'>(() => {
    return (localStorage.getItem('schedule_view_mode') as 'week' | 'month') || 'week';
  });

  const handleSetViewMode = (mode: 'week' | 'month') => {
    setViewMode(mode);
    localStorage.setItem('schedule_view_mode', mode);
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [dayDetail, setDayDetail] = useState<{ date: string; bookings: Booking[] } | null>(null);

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

  useEffect(() => {
    fetch(`${getApiUrl()}/api/disciplines?locationId=${user?.locationId || ''}`)
      .then(r => r.json())
      .then(d => { if (d?.data && Array.isArray(d.data)) setDisciplines(d.data); })
      .catch(() => {});
  }, [user]);

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

  const matchesDiscipline = (b: Booking): boolean => {
    if (selectedDiscipline === 'all') return true;
    const discId = b.disciplineId?._id || (typeof b.trainerId?.disciplineId === 'object'
      ? b.trainerId.disciplineId?._id
      : b.trainerId?.disciplineId) || '';
    if (discId === selectedDiscipline) return true;
    const discName = disciplines.find(d => d._id === selectedDiscipline)?.name?.toLowerCase();
    return discName ? b.trainerId?.specialties?.some(s => s.toLowerCase() === discName) : false;
  };

  const bookingFitsHour = (b: Booking, hour: string): boolean => {
    if (b.time) return b.time === hour;
    if (b.startTime) {
      const bkStart = b.startTime.slice(0, 5);
      const bkEnd = b.endTime?.slice(0, 5) || '';
      const hourStart = hour;
      const [h, m] = hour.split(':').map(Number);
      const nextHour = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return bkStart < nextHour && (bkEnd > hourStart || bkEnd === '');
    }
    return false;
  };

  const getAllBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && matchesDiscipline(b);
    });
  };

  const getAllBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && matchesDiscipline(b);
    });
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && (b.status === 'confirmed' || b.status === 'pending') && matchesDiscipline(b);
    });
    const seenKeys = new Set<string>();
    return dayBookings.filter(b => {
      const key = b.time || b.startTime || '';
      if (!b.trainerId) return !seenKeys.has(key);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
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

  const getColorForBooking = (booking: Booking) => {
    if (booking.status === 'rejected') return 'bg-red-50 text-red-600 border-red-300';
    if (!booking.trainerId) {
      if (booking.status === 'confirmed') return 'text-cyan-600 border-cyan-200';
      return 'text-slate-500 border-slate-200';
    }
    if (booking.status === 'confirmed') return 'bg-green-100 text-green-700 border-green-300';
    if (booking.status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => {
      const bDate = new Date(b.date).toISOString().split('T')[0];
      return bDate === dateStr && (b.status === 'confirmed' || b.status === 'pending' || b.status === 'rejected') && matchesDiscipline(b);
    });
    // Nếu có cả lịch HLV và lịch cá nhân trùng giờ, ưu tiên hiển thị lịch HLV
    const seenTimes = new Set<string>();
    return dayBookings.filter(b => {
      if (!b.trainerId) return !seenTimes.has(b.time);
      if (seenTimes.has(b.time)) return false;
      seenTimes.add(b.time);
      return true;
    });
  };

  const formatDateStr = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatTimeRange = (time?: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const endMin = m + 30;
    const endH = h + Math.floor(endMin / 60);
    const endM = endMin % 60;
    return `${time} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
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

        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setSelectedDiscipline('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedDiscipline === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Tất cả
          </button>
          {disciplines.map(disc => (
            <button key={disc._id} onClick={() => setSelectedDiscipline(disc._id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedDiscipline === disc._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {disc.name}
            </button>
          ))}
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
              <button onClick={() => handleSetViewMode('week')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Tuần
              </button>
              <button onClick={() => handleSetViewMode('month')}
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
                      <div key={idx} className="text-center cursor-pointer hover:bg-slate-50 rounded-lg py-1" onClick={() => setDayDetail({ date: formatDateStr(date), bookings: getAllBookingsForDay(date) })}>
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
                            const dayBookings = getBookingsForDay(date).filter(b => bookingFitsHour(b, hour));
                            return (
                              <div key={dayIdx} className="bg-white p-0.5 relative min-h-[40px]">
                                  {dayBookings.map(b => (
                                  <div key={b._id} onClick={() => setDayDetail({ date: formatDateStr(date), bookings: getAllBookingsForDay(date) })}
                                    className={`absolute inset-0.5 rounded-lg border p-1 ${getColorForBooking(b)} overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}>
                                    <p className="font-bold text-xs leading-tight truncate">{b.startTime ? `${b.startTime}-${b.endTime}` : formatTimeRange(b.time)}</p>
                                    {b.trainerId ? (
                                      <>
                                        <p className="text-[10px] opacity-75 truncate">HLV: {b.trainerId.fullName}</p>
                                        {b.disciplineId && (
                                          <p className="text-[10px] opacity-75 truncate">{b.disciplineId.name}</p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-[10px] opacity-75 truncate">Tập cá nhân</p>
                                    )}
                                    <p className="text-[10px] opacity-75 truncate">{b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}</p>
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
                        const dateObj = isValid ? new Date(year, month, day) : null;
                        const isToday = isValid && dateObj!.toDateString() === new Date().toDateString();
                        const isPast = isValid && dateObj! < new Date(new Date().setHours(0, 0, 0, 0));
                        return (
                          <div key={i}
                            onClick={() => isValid && setDayDetail({ date: `${day}/${month + 1}/${year}`, bookings: getAllBookingsForDate(day) })}
                            className={`rounded-xl border-2 p-1 transition-all ${!isValid ? 'bg-slate-50 border-slate-100' : isPast ? 'bg-slate-50 border-slate-200 opacity-50' : dayBookings.length > 0 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'} ${isValid ? 'cursor-pointer' : ''}`}>
                            {isValid && (
                              <div className="h-full flex flex-col">
                                <div className={`flex items-center gap-1 ${isToday ? 'font-bold text-indigo-600' : 'font-semibold text-slate-900'}`}>
                                  <span>{day}</span>
                                  {isToday && <span className="text-[10px] text-indigo-400 font-normal">Hôm nay</span>}
                                </div>
                                {dayBookings.slice(0, 2).map(b => {
                                  const colorClass = b.status === 'rejected'
                                    ? 'bg-red-50 text-red-600'
                                    : !b.trainerId
                                    ? (b.status === 'confirmed' ? 'text-cyan-600' : 'text-slate-500')
                                    : (b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700');
                                  return (
                                    <div key={b._id} className={`text-xs px-1 py-0.5 rounded mb-0.5 ${colorClass}`}>
                                      <div className="truncate">{b.startTime ? `${b.startTime}-${b.endTime}` : formatTimeRange(b.time)}</div>
                                      <div className="truncate">{b.trainerId ? `HLV: ${b.trainerId.fullName}` : 'Tập cá nhân'}</div>
                                      {b.disciplineId && (
                                        <div className="truncate">{b.disciplineId.name}</div>
                                      )}
                                    </div>
                                  );
                                })}
                                {dayBookings.length > 2 && (
                                  <div className="text-xs text-slate-400 px-1">+{dayBookings.length - 2} nữa</div>
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
                <span className="text-slate-600">HLV - Đã xác nhận</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-slate-600">HLV - Chờ duyệt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-slate-600">HLV - Từ chối</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-400"></div>
                <span className="text-slate-600">Tập cá nhân</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dayDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDayDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Lịch tập ngày {dayDetail.date}</h3>
              <button onClick={() => setDayDetail(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            {dayDetail.bookings.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Không có lịch tập nào</p>
            ) : (
              <div className="space-y-3">
                {dayDetail.bookings.map(b => (
                  <div key={b._id} className={`rounded-xl border p-4 ${getColorForBooking(b)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{b.startTime ? `${b.startTime}-${b.endTime}` : formatTimeRange(b.time)}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-200 text-green-800' : b.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                        {b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <p className="text-sm">{b.trainerId ? `HLV: ${b.trainerId.fullName}` : 'Tập cá nhân'}</p>
                    {b.disciplineId && (
                      <p className="text-xs text-slate-500 mt-0.5">Bộ môn: {b.disciplineId.name}</p>
                    )}
                    {b.rejectionReason && (
                      <p className="text-sm mt-1 italic">Lý do: {b.rejectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}