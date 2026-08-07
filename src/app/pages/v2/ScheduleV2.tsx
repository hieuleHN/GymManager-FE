import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, ChevronLeft, ChevronRight, CalendarDays, Dumbbell, Clock,
    AlertTriangle, CalendarCheck2, UserCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleBooking {
    _id: string;
    bookingCode: string;
    customerName: string;
    customerPhone: string;
    trainerName: string;
    trainerId: { _id: string; fullName: string } | string | null;
    sessionType: string;
    disciplineName: string;
    startTime: string;
    endTime: string;
    timeLabel: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    statusLabel?: string;
}

interface DayData {
    date: string;
    label: string;
    dayName: string;
    isToday: boolean;
    records: ScheduleBooking[];
}

const STATUS_DOT: Record<string, string> = {
    PENDING: 'bg-amber-500',
    CONFIRMED: 'bg-sky-500',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-slate-300',
    REJECTED: 'bg-red-500'
};

const STATUS_SHORT: Record<string, string> = {
    PENDING: 'Chờ',
    CONFIRMED: 'Đã XN',
    COMPLETED: 'Xong',
    CANCELLED: 'Hủy',
    REJECTED: 'Từ chối'
};

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

const DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const startOfWeek = (d: Date) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    return copy;
};

export function ScheduleV2() {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [days, setDays] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [todayCount, setTodayCount] = useState(0);

    const buildWeek = (start: Date) => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const now = new Date();
            return {
                date: toInputDate(d),
                label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                dayName: DAY_NAMES[d.getDay()],
                isToday: toInputDate(d) === toInputDate(now),
                records: [] as ScheduleBooking[]
            };
        });
    };

    const fetchWeek = async (start: Date) => {
        setLoading(true);
        setError('');
        const week = buildWeek(start);
        try {
            const results = await Promise.all(
                week.map(async (day) => {
                    const res = await fetch(`${getApiUrl()}/api/v2/bookings/today?date=${day.date}`, { headers: getAuthHeaders() });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch tập');
                    return { day, records: data.data?.records || [] };
                })
            );
            results.forEach(item => {
                const target = week.find(d => d.date === item.day.date);
                if (target) target.records = item.records;
            });
            setDays(week);
            const now = toInputDate(new Date());
            const today = week.find(d => d.date === now);
            setTodayCount(today ? today.records.length : 0);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeek(weekStart);
    }, [weekStart]);

    const moveWeek = (dir: number) => {
        setWeekStart(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + dir * 7));
    };

    const goToday = () => setWeekStart(startOfWeek(new Date()));

    const weekLabel = `${days[0]?.label || ''} - ${days[6]?.label || ''}`;

    const totalBookings = days.reduce((sum, d) => sum + d.records.length, 0);
    const confirmedCount = days.reduce(
        (sum, d) => sum + d.records.filter(r => r.status === 'CONFIRMED').length,
        0
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lịch tập tuần V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Xem toàn bộ buổi tập của tuần theo từng ngày</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => moveWeek(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Tuần trước">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goToday}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700"
                        >
                            <CalendarDays className="w-4 h-4" /> Hôm nay
                        </button>
                        <button onClick={() => moveWeek(1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Tuần sau">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tuần hiện tại</p>
                        <p className="text-xl font-black text-slate-900">{weekLabel || '—'}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng buổi trong tuần</p>
                        <p className="text-3xl font-black text-indigo-600">{totalBookings}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã xác nhận</p>
                        <p className="text-3xl font-black text-sky-600">{confirmedCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Buổi hôm nay</p>
                        <p className="text-3xl font-black text-emerald-600">{todayCount}</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <CalendarCheck2 className="w-4 h-4 text-indigo-500" /> Lịch tập từng ngày
                        </h2>
                        <button onClick={() => fetchWeek(weekStart)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Đang tải lịch tập...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {days.map(day => (
                                <div key={day.date} className={`flex flex-col min-h-[300px] ${day.isToday ? 'bg-indigo-50/40' : 'bg-white'}`}>
                                    <div className={`p-3 border-b border-slate-100 ${day.isToday ? 'bg-indigo-600' : 'bg-slate-50'}`}>
                                        <p className={`text-xs font-bold uppercase ${day.isToday ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {day.dayName}
                                        </p>
                                        <p className={`text-sm font-black ${day.isToday ? 'text-white' : 'text-slate-800'}`}>
                                            {day.label}
                                        </p>
                                        {day.isToday && (
                                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold text-white">
                                                Hôm nay
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 p-2 space-y-2">
                                        {day.records.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-300 py-6">
                                                Không có buổi tập
                                            </div>
                                        ) : (
                                            day.records.map(r => (
                                                <div key={r._id} className={`rounded-xl border p-2.5 ${r.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-black text-slate-800">{r.timeLabel}</span>
                                                        <span className={`ml-auto w-2 h-2 rounded-full ${STATUS_DOT[r.status] || 'bg-slate-300'}`} title={r.status} />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-800 mt-1.5 truncate">{r.customerName}</p>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                                        <Dumbbell className="w-3 h-3" /> {r.trainerName || 'Chưa chọn PT'}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        <span className="text-[10px] text-slate-400 truncate">{r.bookingCode}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                            r.status === 'COMPLETED'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : r.status === 'CONFIRMED'
                                                                ? 'bg-sky-100 text-sky-700'
                                                                : r.status === 'PENDING'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {r.statusLabel || STATUS_SHORT[r.status] || r.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 bg-white border border-slate-100 rounded-2xl px-4 py-3">
                    <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-sky-500" /> Đã xác nhận</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Chờ xác nhận</span>
                    <span className="flex items-center gap-1.5"><CalendarCheck2 className="w-4 h-4 text-emerald-500" /> Hoàn thành</span>
                    <span className="ml-auto text-slate-400">Dữ liệu lấy từ API /api/v2/bookings/today theo từng ngày</span>
                </div>
            </div>
        </AdminLayout>
    );
}
