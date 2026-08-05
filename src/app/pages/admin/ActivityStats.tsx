import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Award, BarChart3, RefreshCw, Activity, AlertCircle, Calendar, X, Users, DollarSign, Clock, Loader2, CalendarCheck, Download } from 'lucide-react';
import { getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { Pagination } from '../../components/Pagination';
import { exportActivityExcel } from '../../../lib/exportExcelWithChart';
import { generateActivityChartImages } from '../../../lib/ChartCapture';

interface BookingStats {
    today: number;
    month: number;
    year: number;
}

interface GrowthItem {
    month: string;
    count: number;
}

interface SportDistribution {
    name: string;
    value: number;
}

interface CheckInOfWeek {
    day: string;
    count: number;
}

interface TrainerPerformance {
    name: string;
    sessions: number;
    rejected: number;
    cancelled: number;
}

const PERIODS = [
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm nay' },
];

const PERIOD_LABELS: Record<string, string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

const PAGE_SIZE = 10;

const ACTIVITY_METRIC_CLASSES: Record<string, { iconBg: string; iconText: string; formulaBg: string; formulaBorder: string; formulaText: string; dot: string }> = {
  totalBookings: { iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', formulaBg: 'bg-indigo-50', formulaBorder: 'border-indigo-200', formulaText: 'text-indigo-800', dot: 'bg-indigo-400' },
  totalNewCustomers: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', formulaBg: 'bg-emerald-50', formulaBorder: 'border-emerald-200', formulaText: 'text-emerald-800', dot: 'bg-emerald-400' },
  totalCheckins: { iconBg: 'bg-purple-100', iconText: 'text-purple-600', formulaBg: 'bg-purple-50', formulaBorder: 'border-purple-200', formulaText: 'text-purple-800', dot: 'bg-purple-400' },
  totalTrainerSessions: { iconBg: 'bg-amber-100', iconText: 'text-amber-600', formulaBg: 'bg-amber-50', formulaBorder: 'border-amber-200', formulaText: 'text-amber-800', dot: 'bg-amber-400' },
};

const ACTIVITY_METRIC_INFO: Record<string, { title: string; icon: any; color: string; formula: string; description: string; details: string[] }> = {
  totalBookings: {
    title: 'Lượng Đặt lịch HLV',
    icon: CalendarCheck,
    color: 'indigo',
    formula: 'Lượng đặt lịch HLV = Tổng số booking có ngày đặt trong kỳ',
    description: 'Tổng số lần khách hàng đặt lịch tập với Huấn luyện viên trong khoảng thời gian đã chọn.',
    details: [
      'Nguồn dữ liệu: Bảng Booking (lịch đặt)',
      'Chỉ tính các booking có ngày đặt nằm trong kỳ được chọn',
      'Mỗi booking tương ứng với một buổi tập của khách với HLV',
      'Phản ánh mức độ tương tác giữa hội viên và đội ngũ HLV',
    ],
  },
  totalNewCustomers: {
    title: 'Hội viên mới',
    icon: Users,
    color: 'emerald',
    formula: 'Hội viên mới = Tổng số khách hàng đăng ký trong kỳ',
    description: 'Số lượng hội viên mới đăng ký tham gia phòng tập trong khoảng thời gian đã chọn.',
    details: [
      'Nguồn dữ liệu: Bảng Customer (khách hàng)',
      'Tính theo ngày tạo tài khoản của khách hàng',
      'Chỉ tính khách hàng mới, không bao gồm khách cũ gia hạn',
      'Chỉ số quan trọng để đánh giá tốc độ tăng trưởng phòng tập',
    ],
  },
  totalCheckins: {
    title: 'Lượt điểm danh',
    icon: Clock,
    color: 'purple',
    formula: 'Lượt điểm danh = Tổng số lần check-in của hội viên trong kỳ',
    description: 'Tổng số lượt hội viên đến phòng tập và điểm danh trong khoảng thời gian đã chọn.',
    details: [
      'Nguồn dữ liệu: Bảng CheckIn (điểm danh)',
      'Mỗi lần hội viên đến tập và check-in được tính 1 lượt',
      'Phản ánh mức độ chăm chỉ và tần suất tập luyện của hội viên',
      'Lượt điểm danh cao → hội viên duy trì thói quen tập tốt',
    ],
  },
  totalTrainerSessions: {
    title: 'Ca dạy HLV',
    icon: Award,
    color: 'amber',
    formula: 'Ca dạy HLV = Tổng số buổi dạy của tất cả HLV trong kỳ',
    description: 'Tổng số ca dạy mà đội ngũ Huấn luyện viên đã thực hiện trong khoảng thời gian đã chọn.',
    details: [
      'Nguồn dữ liệu: Bảng Booking (lịch đặt) liên kết với Staff (nhân viên)',
      'Chỉ tính các booking có HLV được phân công và ngày đặt trong kỳ',
      'Tổng hợp từ tất cả HLV trong trung tâm',
      'Phản ánh khối lượng công việc và hiệu suất của đội ngũ HLV',
    ],
  },
};

interface MonthlyDetail {
    month: number;
    year: number;
    total: number;
    byGender: { name: string; count: number }[];
    byPackage: { name: string; count: number }[];
    totalRevenue: number;
    customers: {
        _id: string;
        fullName: string;
        phone: string;
        email: string;
        gender: string;
        package: string;
        totalPrice: number;
        createdAt: string;
    }[];
}

export function ActivityStats() {
    const { selectedClub } = useClub();
    const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [period, setPeriod] = useState('week');
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [dateError, setDateError] = useState('');
    const [bookingStats, setBookingStats] = useState<BookingStats>({ today: 0, month: 0, year: 0 });
    const [customerGrowth, setCustomerGrowth] = useState<GrowthItem[]>([]);
    const [sportDistribution, setSportDistribution] = useState<SportDistribution[]>([]);
    const [checkInOfWeek, setCheckInOfWeek] = useState<CheckInOfWeek[]>([]);
    const [trainerPerformance, setTrainerPerformance] = useState<TrainerPerformance[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<MonthlyDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [selectedCheckin, setSelectedCheckin] = useState<any>(null);
    const [loadingCheckinDetail, setLoadingCheckinDetail] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [periodData, setPeriodData] = useState<Record<string, any>>({});
    const [loadingPeriodData, setLoadingPeriodData] = useState(false);
    const [selectedSport, setSelectedSport] = useState<any>(null);
    const [loadingSportDetail, setLoadingSportDetail] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
    const [loadingTrainerDetail, setLoadingTrainerDetail] = useState(false);
    const [selectedMonthPage, setSelectedMonthPage] = useState(1);
    const [selectedCheckinPage, setSelectedCheckinPage] = useState(1);
    const [selectedSportPage, setSelectedSportPage] = useState(1);
    const [selectedTrainerPage, setSelectedTrainerPage] = useState(1);

    const validateCustomDate = (from: string, to: string) => {
        if (!from || !to) { setDateError('Vui lòng chọn cả ngày bắt đầu và kết thúc'); return false; }
        const f = new Date(from + 'T00:00:00');
        const t = new Date(to + 'T00:00:00');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (t < f) { setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu'); return false; }
        if (t > today) { setDateError('Ngày kết thúc không được lớn hơn hôm nay'); return false; }
        const diffMonths = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
        if (diffMonths > 24) { setDateError('Khoảng thời gian tối đa 2 năm'); return false; }
        setDateError('');
        return true;
    };

    const fetchMonthlyDetail = async (monthIndex: number) => {
        setSelectedMonth(null);
        setLoadingDetail(true);
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) return;
            const res = await axios.get(`${getApiUrl()}/api/dashboard/admin-stats/monthly-detail?month=${monthIndex}${locParam}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setSelectedMonth(res.data);
            setSelectedMonthPage(1);
        } catch (err) {
            console.error("Lỗi lấy chi tiết tháng:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const fetchCheckinDetail = async (dayName?: string, weekOffset?: number, clickedMonth?: number) => {
        setLoadingCheckinDetail(true);
        // Show modal immediately with placeholder
        setSelectedCheckin({ day: dayName || `Tuần ${(weekOffset||0)+1}` || `T${clickedMonth}`, total: 0, customers: [], hourly: [] });
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) return;
            let url = `${getApiUrl()}/api/dashboard/admin-stats/checkin-detail?period=${period}${locParam}`;
            if (dayName) url += `&day=${dayName}`;
            if (weekOffset !== undefined) url += `&weekOffset=${weekOffset}`;
            if (clickedMonth !== undefined) url += `&clickedMonth=${clickedMonth}`;
            if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
            console.log("Fetching checkin detail:", url);
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log("Checkin detail response:", res.data);
            setSelectedCheckin(res.data);
            setSelectedCheckinPage(1);
        } catch (err: any) {
            console.error("Lỗi lấy chi tiết điểm danh:", err);
            console.error("Response data:", err.response?.data);
            setError(err.response?.data?.error || err.message || "Lỗi kết nối");
        } finally {
            setLoadingCheckinDetail(false);
        }
    };

    const fetchSportDetail = async (sportName: string) => {
        setLoadingSportDetail(true);
        setSelectedSport({ sportName, total: 0, members: [] });
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) return;
            const url = `${getApiUrl()}/api/dashboard/admin-stats/sport-detail?name=${encodeURIComponent(sportName)}&period=${period}${locParam}`;
            if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setSelectedSport(res.data);
            setSelectedSportPage(1);
        } catch (err: any) {
            console.error("Lỗi lấy chi tiết môn tập:", err);
            setError(err.response?.data?.error || err.message || "Lỗi kết nối");
        } finally {
            setLoadingSportDetail(false);
        }
    };

    const fetchTrainerDetail = async (trainerName: string) => {
        setLoadingTrainerDetail(true);
        setSelectedTrainer({ trainerName, totalSessions: 0, sessions: [] });
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) return;
            let url = `${getApiUrl()}/api/dashboard/admin-stats/trainer-detail?name=${encodeURIComponent(trainerName)}&period=${period}${locParam}`;
            if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setSelectedTrainer(res.data);
            setSelectedTrainerPage(1);
        } catch (err: any) {
            console.error("Lỗi lấy chi tiết HLV:", err);
            setError(err.response?.data?.error || err.message || "Lỗi kết nối");
        } finally {
            setLoadingTrainerDetail(false);
        }
    };

    const fetchStatsFromDB = async () => {
        setLoading(true);
        setError(null);
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) {
                userToken = JSON.parse(authUserData).token || '';
            }

            if (!userToken) {
                setError("Không tìm thấy Token đăng nhập. Vui lòng đăng nhập lại!");
                setLoading(false);
                return;
            }

            let url = `${getApiUrl()}/api/dashboard/admin-stats?period=${period}${locParam}`;
            if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            if (response.data) {
                const data = response.data;
                setBookingStats(data.bookingStats || { today: 0, month: 0, year: 0 });
                setCustomerGrowth(data.customerGrowth || []);
                setSportDistribution(data.sportDistribution || []);
                setCheckInOfWeek(data.checkInOfWeek || []);
                setTrainerPerformance(data.trainerPerformance || []);
                setSummary(data.summary || null);
            }
        } catch (err: any) {
            console.error("Lỗi kết nối API Thống kê DB:", err);
            setError("Không thể kết nối đến Backend hoặc Database đang gặp sự cố.");
        } finally {
            setLoading(false);
        }
    };

    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) { setError('Không tìm thấy Token đăng nhập. Vui lòng đăng nhập lại!'); setExporting(false); return; }
            const headers = { Authorization: `Bearer ${userToken}` };

            const [monthlyDetails, checkinDetails, sportDetails, trainerDetails, periodData] = await Promise.all([
                Promise.all(customerGrowth.map(async (g: any) => {
                    if (!g.month.startsWith('T')) return null;
                    try {
                        const res = await axios.get(`${getApiUrl()}/api/dashboard/admin-stats/monthly-detail?month=${parseInt(g.month.replace('T', ''))}${locParam}`, { headers });
                        return res.data;
                    } catch { return null; }
                })),
                Promise.all(checkInOfWeek.map(async (c: any, idx: number) => {
                    try {
                        let url = `${getApiUrl()}/api/dashboard/admin-stats/checkin-detail?period=${period}${locParam}`;
                        if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
                        const isYearView = period === 'year' || showCustomDate;
                        const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];
                        if (isYearView && c.day.startsWith('T')) url += `&clickedMonth=${parseInt(c.day.replace('T', ''))}`;
                        else if (c.day.startsWith('Tuần')) url += `&weekOffset=${idx}`;
                        else if (dayNames.includes(c.day)) url += `&day=${c.day}`;
                        else url += `&day=${c.day}`;
                        const res = await axios.get(url, { headers });
                        return res.data;
                    } catch { return null; }
                })),
                Promise.all(sportDistribution.map(async (sp: any) => {
                    try {
                        let url = `${getApiUrl()}/api/dashboard/admin-stats/sport-detail?name=${encodeURIComponent(sp.name)}&period=${period}${locParam}`;
                        if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
                        const res = await axios.get(url, { headers });
                        return res.data;
                    } catch { return null; }
                })),
                Promise.all(trainerPerformance.map(async (t: any) => {
                    try {
                        let url = `${getApiUrl()}/api/dashboard/admin-stats/trainer-detail?name=${encodeURIComponent(t.name)}&period=${period}${locParam}`;
                        if (customFrom && customTo) url += `&startDate=${customFrom}&endDate=${customTo}`;
                        const res = await axios.get(url, { headers });
                        return res.data;
                    } catch { return null; }
                })),
                (async () => {
                    const results: Record<string, any> = {};
                    await Promise.all(['week', 'month', 'quarter', 'year'].map(async (p) => {
                        try {
                            const res = await axios.get(`${getApiUrl()}/api/dashboard/admin-stats?period=${p}${locParam}`, { headers });
                            results[p] = res.data?.summary || null;
                        } catch { results[p] = null; }
                    }));
                    return results;
                })(),
            ]);

            const data = {
                summary,
                bookingStats,
                customerGrowth,
                sportDistribution,
                checkInOfWeek,
                trainerPerformance,
            };

            const periodLabel = customFrom && customTo ? `${customFrom} → ${customTo}` : (PERIOD_LABELS[period] || period);
            const chartImages = generateActivityChartImages(data);
            await exportActivityExcel(
                data,
                periodLabel,
                `BaoCaoHoatDong_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
                {
                    monthly: monthlyDetails.filter(Boolean),
                    checkin: checkinDetails.filter(Boolean),
                    sports: sportDetails.filter(Boolean),
                    trainers: trainerDetails.filter(Boolean),
                    periodData,
                },
                chartImages.length > 0 ? chartImages : undefined
            );
        } catch (err: any) {
            console.error("Lỗi xuất Excel:", err);
            setError("Không thể xuất Excel: " + (err.message || "Lỗi không xác định"));
        } finally {
            setExporting(false);
        }
    };

    const handleStatClick = async (metric: string) => {
        setSelectedMetric(metric);
        setLoadingPeriodData(true);
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) userToken = JSON.parse(authUserData).token || '';
            if (!userToken) return;
            const results: Record<string, any> = {};
            const periods = ['week', 'month', 'quarter', 'year'];
            await Promise.all(periods.map(async (p) => {
                try {
                    const url = `${getApiUrl()}/api/dashboard/admin-stats?period=${p}${locParam}`;
                    const res = await axios.get(url, { headers: { Authorization: `Bearer ${userToken}` } });
                    results[p] = res.data?.summary || null;
                } catch { results[p] = null; }
            }));
            setPeriodData(results);
        } catch { /* ignore */ }
        setLoadingPeriodData(false);
    };

    useEffect(() => {
        if (showCustomDate && (!customFrom || !customTo || !!dateError)) return;
        fetchStatsFromDB();
    }, [period, showCustomDate, customFrom, customTo, dateError, selectedClub]);

    const maxGrowth = customerGrowth.length > 0 ? Math.max(...customerGrowth.map(d => d.count), 1) : 1;
    const maxCheckIn = checkInOfWeek.length > 0 ? Math.max(...checkInOfWeek.map(d => d.count), 1) : 1;
    const totalActiveMembers = sportDistribution.reduce((acc, curr) => acc + curr.value, 0);

    const s = summary || {};
    const fmtNum = (v: number) => v.toLocaleString('vi-VN');

    const metricCards = [
        { key: 'totalBookings', label: 'Lượng Đặt lịch HLV', value: fmtNum(s.totalBookings ?? 0), icon: CalendarCheck, color: 'bg-indigo-500' },
        { key: 'totalNewCustomers', label: 'Hội viên mới', value: fmtNum(s.totalNewCustomers ?? 0), icon: Users, color: 'bg-emerald-500' },
        { key: 'totalCheckins', label: 'Lượt điểm danh', value: fmtNum(s.totalCheckins ?? 0), icon: Clock, color: 'bg-purple-500' },
        { key: 'totalTrainerSessions', label: 'Ca dạy HLV', value: fmtNum(s.totalTrainerSessions ?? 0), icon: Award, color: 'bg-amber-500' },
    ];

    return (
        <><div className="space-y-6">
            {/* Header + Period selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
                        {PERIODS.map(p => (
                            <button key={p.key} onClick={() => { setPeriod(p.key); setShowCustomDate(false); setCustomFrom(''); setCustomTo(''); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key && !showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                {p.label}
                            </button>
                        ))}
                        <button onClick={() => setShowCustomDate(!showCustomDate)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showCustomDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Tùy chỉnh
                        </button>
                    </div>
                    {showCustomDate && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2">
                                <span className="text-xs text-slate-500">Từ</span>
                                <input type="date" value={customFrom}
                                    onChange={e => { const v = e.target.value; setCustomFrom(v); if (customTo) validateCustomDate(v, customTo); }}
                                    className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customFrom ? 'border-red-300' : 'border-slate-200'}`} />
                                <span className="text-xs text-slate-500">Đến</span>
                                <input type="date" value={customTo}
                                    onChange={e => { const v = e.target.value; setCustomTo(v); if (customFrom) validateCustomDate(customFrom, v); }}
                                    className={`px-2 py-1.5 border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dateError && !customTo ? 'border-red-300' : 'border-slate-200'}`} />
                            </div>
                            {dateError && <span className="text-xs text-red-500 ml-2">{dateError}</span>}
                        </div>
                    )}
                </div>
                {loading && <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />}
            </div>

            <div className="flex justify-end">
                <button onClick={handleExport} disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} onClick={() => handleStatClick(card.key)}
                            className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`${card.color} p-2.5 rounded-xl`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                            <p className="text-xl font-bold text-slate-900">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Hàng 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tăng trưởng hội viên */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-indigo-500" /> Tốc độ Tăng trưởng Hội viên mới
                    </h3>
                    {customerGrowth.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                            Chưa có bản ghi tăng trưởng trong Database
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="h-64 flex items-end justify-between gap-2 px-2 pt-6" style={{ minWidth: `${Math.max(customerGrowth.length * 48, 100)}px` }}>
                            {customerGrowth.map((item, idx) => {
                                const heightVal = Math.max(Math.round((item.count / maxGrowth) * 200), 5);
                                return (
                                    <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center group relative">
                                        <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                            {item.count} HV
                                        </div>
                                        <div
                                            style={{ height: `${heightVal}px` }}
                                            onClick={() => item.month.startsWith('T') && fetchMonthlyDetail(parseInt(item.month.replace('T', '')) || idx)}
                                            className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all duration-500 shadow-sm cursor-pointer"
                                        ></div>
                                        <span className="text-[11px] text-slate-400 font-bold mt-2">{item.month}</span>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phân bổ theo môn */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-emerald-500" /> Phân bổ Hội viên theo Gói môn tập
                    </h3>
                    {sportDistribution.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                            Chưa có thông tin môn tập trong Database
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {sportDistribution.map((sport, idx) => {
                                const percent = totalActiveMembers > 0 ? Math.round((sport.value / totalActiveMembers) * 100) : 0;
                                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];
                                return (
                                    <div key={idx} onClick={() => fetchSportDetail(sport.name)} className="space-y-1 cursor-pointer group">
                                        <div className="flex justify-between text-xs font-black">
                                            <span className="text-slate-700 group-hover:text-indigo-600 transition-colors">{sport.name}</span>
                                            <span className="text-slate-500">{sport.value} Hội viên ({percent}%)</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${percent}%` }} className={`h-full ${colors[idx % colors.length]} transition-all duration-700 group-hover:opacity-80`}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Hàng 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Điểm danh theo ngày */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-purple-500" /> Tần suất Điểm danh theo ngày trong Tuần
                    </h3>
                    {checkInOfWeek.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                            Chưa có bản ghi điểm danh tuần này trong Database
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="h-64 flex items-end justify-between gap-2 px-4 pt-6" style={{ minWidth: `${Math.max(checkInOfWeek.length * 48, 100)}px` }}>
                            {checkInOfWeek.map((item, idx) => {
                                const heightVal = Math.max(Math.round((item.count / maxCheckIn) * 200), 5);
                                return (
                                    <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center group relative">
                                        <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                            {item.count} Lượt
                                        </div>
                                        <div
                                            style={{ height: `${heightVal}px` }}
                                            onClick={() => {
                                                const isYearView = period === 'year' || showCustomDate;
                                                const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];
                                                if (isYearView && item.day.startsWith('T')) fetchCheckinDetail(undefined, undefined, parseInt(item.day.replace('T', '')));
                                                else if (item.day.startsWith('Tuần')) fetchCheckinDetail(undefined, idx);
                                                else if (dayNames.includes(item.day)) fetchCheckinDetail(item.day);
                                                else fetchCheckinDetail(item.day);
                                            }}
                                            className="w-full bg-purple-500 hover:bg-purple-600 rounded-t-md transition-all duration-500 cursor-pointer"
                                        ></div>
                                        <span className="text-xs text-slate-500 font-black mt-2">{item.day}</span>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hiệu suất HLV */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" /> Biểu đồ Hiệu suất Huấn luyện viên (PT)
                        </h3>
                        {trainerPerformance.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 rounded-xl text-xs font-black self-start sm:self-auto shadow-xs">
                                Trung bình: {(trainerPerformance.reduce((acc, curr) => acc + curr.sessions, 0) / trainerPerformance.length).toFixed(1)} Ca / HLV
                            </div>
                        )}
                    </div>

                    {trainerPerformance.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                            Chưa có lịch dạy HLV hoàn thành trong Database
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {(() => {
                                const totalSessions = trainerPerformance.reduce((acc, curr) => acc + curr.sessions, 0);
                                const avgSessions = totalSessions / trainerPerformance.length;
                                const maxSession = Math.max(...trainerPerformance.map(t => t.sessions), 1);

                                return trainerPerformance.map((trainer, idx) => {
                                    const allStats = [trainer.sessions, trainer.rejected, trainer.cancelled];
                                    const maxAll = Math.max(...allStats, 1);
                                    const pctConfirmed = Math.round((trainer.sessions / maxAll) * 100);
                                    const pctRejected = Math.round((trainer.rejected / maxAll) * 100);
                                    const pctCancelled = Math.round((trainer.cancelled / maxAll) * 100);
                                    const isAboveAvg = trainer.sessions >= avgSessions;

                                    return (
                                        <div key={idx} onClick={() => fetchTrainerDetail(trainer.name)} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-full font-black flex items-center justify-center text-xs ${idx === 0 ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}>
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-black text-slate-800 truncate">{trainer.name}</h4>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isAboveAvg ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                            {isAboveAvg ? 'Trên TB' : 'Dưới TB'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-bold">Huấn luyện viên trung tâm</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                                        {trainer.sessions} Ca dạy
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-semibold mb-0.5">
                                                        <span className="text-indigo-600">Đã xác nhận</span>
                                                        <span className="text-slate-500">{trainer.sessions}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div style={{ width: `${pctConfirmed}%` }} className={`h-full transition-all duration-700 ${idx === 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-semibold mb-0.5">
                                                        <span className="text-red-500">Từ chối</span>
                                                        <span className="text-slate-500">{trainer.rejected}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div style={{ width: `${pctRejected}%` }} className="h-full bg-red-400 transition-all duration-700"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-semibold mb-0.5">
                                                        <span className="text-orange-500">Đã hủy</span>
                                                        <span className="text-slate-500">{trainer.cancelled}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div style={{ width: `${pctCancelled}%` }} className="h-full bg-orange-400 transition-all duration-700"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* ── MODAL CHI TIẾT HỘI VIÊN THEO THÁNG ── */}
            {selectedMonth && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMonth(null)}>
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                    Chi tiết hội viên tháng {selectedMonth.month}/{selectedMonth.year}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Tổng số hội viên mới: <span className="font-bold text-indigo-600">{selectedMonth.total} HV</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedMonth(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {loadingDetail ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                                    <span className="ml-3 text-slate-500">Đang tải dữ liệu...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-indigo-50 rounded-2xl p-5 text-center">
                                            <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-indigo-600">{selectedMonth.total}</p>
                                            <p className="text-xs text-slate-600 font-semibold">HV mới</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-5 text-center">
                                            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-blue-600">
                                                {selectedMonth.byGender.find(g => g.name === 'Nam')?.count || 0} Nam
                                            </p>
                                            <p className="text-xs text-slate-600 font-semibold">
                                                {selectedMonth.byGender.find(g => g.name === 'Nữ')?.count || 0} Nữ
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-2xl p-5 text-center">
                                            <BarChart3 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                                            <p className="text-lg font-bold text-emerald-600">{selectedMonth.byPackage.length}</p>
                                            <p className="text-xs text-slate-600 font-semibold">Loại gói</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-2xl p-5 text-center">
                                            <DollarSign className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                                            <p className="text-lg font-bold text-amber-600">{selectedMonth.totalRevenue.toLocaleString('vi-VN')}đ</p>
                                            <p className="text-xs text-slate-600 font-semibold">Doanh thu</p>
                                        </div>
                                    </div>
                                    {selectedMonth.byGender.length > 0 && (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5">
                                            <h4 className="font-bold text-slate-800 mb-4">Phân bổ theo giới tính</h4>
                                            <div className="flex gap-4">
                                                {selectedMonth.byGender.map((g, i) => (
                                                    <div key={i} className="flex-1 bg-slate-50 rounded-xl p-4 text-center">
                                                        <div className={`text-2xl font-bold ${g.name === 'Nam' ? 'text-blue-600' : g.name === 'Nữ' ? 'text-pink-600' : 'text-slate-600'}`}>
                                                            {g.count}
                                                        </div>
                                                        <div className="text-sm text-slate-600 font-semibold mt-1">{g.name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedMonth.byPackage.length > 0 && (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5">
                                            <h4 className="font-bold text-slate-800 mb-4">Phân bổ theo gói tập</h4>
                                            <div className="space-y-3">
                                                {selectedMonth.byPackage.map((p, i) => {
                                                    const pct = Math.round((p.count / selectedMonth.total) * 100);
                                                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
                                                    return (
                                                        <div key={i}>
                                                            <div className="flex justify-between text-sm font-semibold mb-1">
                                                                <span className="text-slate-700">{p.name}</span>
                                                                <span className="text-slate-500">{p.count} HV ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                                <div style={{ width: `${pct}%` }} className={`h-full ${colors[i % colors.length]} transition-all duration-700 rounded-full`}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-5">
                                        <h4 className="font-bold text-slate-800 mb-4">Danh sách hội viên ({selectedMonth.customers.length})</h4>
                                        {selectedMonth.customers.length === 0 ? (
                                            <p className="text-slate-400 text-sm text-center py-8">Không có dữ liệu</p>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-100">
                                                                 <th className="text-left py-3 px-2 text-slate-500 font-semibold">Họ tên</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">Giới tính</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">SĐT</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">Số lượng gói tập</th>
                                                                <th className="text-right py-3 px-2 text-slate-500 font-semibold">Số tiền</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedMonth.customers.slice((selectedMonthPage - 1) * PAGE_SIZE, selectedMonthPage * PAGE_SIZE).map((c) => (
                                                                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50">
                                                                    <td className="py-3 px-2 font-medium text-slate-900">{c.fullName}</td>
                                                                    <td className="py-3 px-2 text-slate-600">{c.gender}</td>
                                                                    <td className="py-3 px-2 text-slate-600">{c.phone || '-'}</td>
                                                                    <td className="py-3 px-2 text-slate-600">{c.packageCount ?? 0}</td>
                                                                    <td className="py-3 px-2 text-right font-semibold text-slate-900">
                                                                        {c.totalPrice > 0 ? `${c.totalPrice.toLocaleString('vi-VN')}đ` : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <Pagination
                                                    page={selectedMonthPage}
                                                    totalPages={Math.ceil(selectedMonth.customers.length / PAGE_SIZE)}
                                                    total={selectedMonth.customers.length}
                                                    limit={PAGE_SIZE}
                                                    onPageChange={setSelectedMonthPage}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CHI TIẾT ĐIỂM DANH THEO NGÀY ── */}
            {selectedCheckin && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCheckin(null)}>
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-purple-600" />
                                    Chi tiết điểm danh - {selectedCheckin.day}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Tổng lượt điểm danh: <span className="font-bold text-purple-600">{selectedCheckin.total} lượt</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedCheckin(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {loadingCheckinDetail ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                                    <span className="ml-3 text-slate-500">Đang tải dữ liệu...</span>
                                </div>
                            ) : (
                                <>
                                    {selectedCheckin.hourly && (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5">
                                            <h4 className="font-bold text-slate-800 mb-4">Phân bổ theo giờ trong ngày</h4>
                                            <div className="h-40 flex items-end justify-between gap-1.5">
                                                {selectedCheckin.hourly.map((h: any, idx: number) => {
                                                    const maxH = Math.max(...selectedCheckin.hourly.map((x: any) => x.count), 1);
                                                    const hVal = Math.max(Math.round((h.count / maxH) * 100), 3);
                                                    return (
                                                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                                            <div className="absolute -top-6 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                                {h.count} lượt
                                                            </div>
                                                            <div style={{ height: `${hVal}px` }} className="w-full bg-purple-500 rounded-t transition-all duration-300"></div>
                                                            <span className="text-[9px] text-slate-400 mt-1">{h.hour}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-5">
                                        <h4 className="font-bold text-slate-800 mb-4">Danh sách điểm danh ({selectedCheckin.customers?.length || 0})</h4>
                                        {(!selectedCheckin.customers || selectedCheckin.customers.length === 0) ? (
                                            <p className="text-slate-400 text-sm text-center py-8">Không có dữ liệu</p>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-100">
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">Họ tên</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">Giới tính</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">SĐT</th>
                                                                <th className="text-left py-3 px-2 text-slate-500 font-semibold">Giờ điểm danh</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedCheckin.customers.slice((selectedCheckinPage - 1) * PAGE_SIZE, selectedCheckinPage * PAGE_SIZE).map((c: any, idx: number) => (
                                                                <tr key={c._id || idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                                    <td className="py-3 px-2 font-medium text-slate-900">{c.fullName}</td>
                                                                    <td className="py-3 px-2 text-slate-600">{c.gender || '-'}</td>
                                                                    <td className="py-3 px-2 text-slate-600">{c.phone || '-'}</td>
                                                                    <td className="py-3 px-2 text-slate-600">
                                                                        {new Date(c.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <Pagination
                                                    page={selectedCheckinPage}
                                                    totalPages={Math.ceil(selectedCheckin.customers.length / PAGE_SIZE)}
                                                    total={selectedCheckin.customers.length}
                                                    limit={PAGE_SIZE}
                                                    onPageChange={setSelectedCheckinPage}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CHI TIẾT CHỈ SỐ ── */}
            {selectedMetric && ACTIVITY_METRIC_INFO[selectedMetric] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedMetric(null); setPeriodData({}); }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                            <div className={`${ACTIVITY_METRIC_CLASSES[selectedMetric].iconBg} p-3 rounded-xl`}>
                                {React.createElement(ACTIVITY_METRIC_INFO[selectedMetric].icon, { className: `w-6 h-6 ${ACTIVITY_METRIC_CLASSES[selectedMetric].iconText}` })}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">{ACTIVITY_METRIC_INFO[selectedMetric].title}</h3>
                                <p className="text-sm text-slate-500">Công thức & cách tính</p>
                            </div>
                            <button onClick={() => { setSelectedMetric(null); setPeriodData({}); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 pt-5">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs text-slate-500 mb-1">Giá trị kỳ hiện tại</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {summary ? (summary[selectedMetric] ?? 0).toLocaleString('vi-VN') : '—'}
                                </p>
                            </div>
                        </div>

                        <div className="px-6 pt-5">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Công thức tính</h4>
                            <div className={`${ACTIVITY_METRIC_CLASSES[selectedMetric].formulaBg} border ${ACTIVITY_METRIC_CLASSES[selectedMetric].formulaBorder} rounded-xl p-4`}>
                                <p className={`text-sm font-mono font-medium ${ACTIVITY_METRIC_CLASSES[selectedMetric].formulaText}`}>
                                    {ACTIVITY_METRIC_INFO[selectedMetric].formula}
                                </p>
                            </div>
                        </div>

                        <div className="px-6 pt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Giải thích</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{ACTIVITY_METRIC_INFO[selectedMetric].description}</p>
                        </div>

                        <div className="px-6 pt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Chi tiết cách tính</h4>
                            <ul className="space-y-2">
                                {ACTIVITY_METRIC_INFO[selectedMetric].details.map((d, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${ACTIVITY_METRIC_CLASSES[selectedMetric].dot} shrink-0`} />
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="px-6 pt-5 pb-6">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">So sánh theo khoảng thời gian</h4>
                            {loadingPeriodData ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                    <span className="text-sm text-slate-500 ml-2">Đang tải...</span>
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left py-2.5 px-4 text-slate-600 font-medium">Khoảng thời gian</th>
                                                <th className="text-right py-2.5 px-4 text-slate-600 font-medium">Giá trị</th>
                                                <th className="text-right py-2.5 px-4 text-slate-600 font-medium">Thay đổi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['week', 'month', 'quarter', 'year'].map((p, i, arr) => {
                                                const ps = periodData[p];
                                                const val = ps ? ps[selectedMetric] : null;
                                                const prev = i > 0 && arr[i - 1] ? periodData[arr[i - 1]]?.[selectedMetric] : null;
                                                const change = val && prev ? ((val - prev) / (prev || 1)) * 100 : null;
                                                return (
                                                    <tr key={p} className={`border-b border-slate-50 ${p === period ? 'bg-indigo-50' : ''}`}>
                                                        <td className="py-2.5 px-4 text-slate-700 font-medium">
                                                            {PERIOD_LABELS[p]}
                                                            {p === period && <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">hiện tại</span>}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                                                            {val != null ? val.toLocaleString('vi-VN') : <span className="text-slate-400">—</span>}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right">
                                                            {change != null ? (
                                                                <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6">
                            <button onClick={() => { setSelectedMetric(null); setPeriodData({}); }}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CHI TIẾT MÔN TẬP ── */}
            {selectedSport && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSport(null)}>
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Activity className="w-6 h-6 text-emerald-600" />
                                    Chi tiết môn tập - {selectedSport.sportName}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Tổng số hội viên: <span className="font-bold text-emerald-600">{selectedSport.total} hội viên</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedSport(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingSportDetail ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                                    <span className="ml-3 text-slate-500">Đang tải dữ liệu...</span>
                                </div>
                            ) : (
                                <>
                                    {selectedSport.members?.length === 0 ? (
                                        <p className="text-slate-400 text-sm text-center py-8">Không có dữ liệu</p>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Họ tên</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Giới tính</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">SĐT</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Gói tập</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Ngày đăng ký</th>
                                                            <th className="text-right py-3 px-2 text-slate-500 font-semibold">Số tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedSport.members.slice((selectedSportPage - 1) * PAGE_SIZE, selectedSportPage * PAGE_SIZE).map((m: any, idx: number) => (
                                                            <tr key={m._id || idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 px-2 font-medium text-slate-900">{m.fullName}</td>
                                                                <td className="py-3 px-2 text-slate-600">{m.gender || '-'}</td>
                                                                <td className="py-3 px-2 text-slate-600">{m.phone || '-'}</td>
                                                                <td className="py-3 px-2 text-slate-600">{m.packageName}</td>
                                                                <td className="py-3 px-2 text-slate-600">
                                                                    {new Date(m.registeredAt).toLocaleDateString('vi-VN')}
                                                                </td>
                                                                <td className="py-3 px-2 text-right font-semibold text-slate-900">
                                                                    {m.totalPrice > 0 ? `${m.totalPrice.toLocaleString('vi-VN')}đ` : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <Pagination
                                                page={selectedSportPage}
                                                totalPages={Math.ceil(selectedSport.members.length / PAGE_SIZE)}
                                                total={selectedSport.members.length}
                                                limit={PAGE_SIZE}
                                                onPageChange={setSelectedSportPage}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="px-6 pb-6">
                            <button onClick={() => setSelectedSport(null)}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CHI TIẾT HLV ── */}
            {selectedTrainer && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTrainer(null)}>
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Award className="w-6 h-6 text-amber-600" />
                                    Chi tiết hiệu suất - {selectedTrainer.trainerName}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1 flex gap-4">
                                    <span>Tổng số ca: <span className="font-bold text-amber-600">{selectedTrainer.totalSessions} ca</span></span>
                                    <span>Hội viên: <span className="font-bold text-amber-600">{selectedTrainer.uniqueCustomers} HV</span></span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedTrainer(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingTrainerDetail ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                                    <span className="ml-3 text-slate-500">Đang tải dữ liệu...</span>
                                </div>
                            ) : (
                                <>
                                    {selectedTrainer.sessions?.length === 0 ? (
                                        <p className="text-slate-400 text-sm text-center py-8">Không có dữ liệu</p>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Học viên</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">SĐT</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Ngày</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Giờ</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Môn</th>
                                                            <th className="text-left py-3 px-2 text-slate-500 font-semibold">Trạng thái</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedTrainer.sessions.slice((selectedTrainerPage - 1) * PAGE_SIZE, selectedTrainerPage * PAGE_SIZE).map((s: any, idx: number) => (
                                                            <tr key={s._id || idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 px-2 font-medium text-slate-900">{s.customerName}</td>
                                                                <td className="py-3 px-2 text-slate-600">{s.customerPhone || '-'}</td>
                                                                <td className="py-3 px-2 text-slate-600">
                                                                    {new Date(s.date).toLocaleDateString('vi-VN')}
                                                                </td>
                                                                <td className="py-3 px-2 text-slate-600">{s.time || '-'}</td>
                                                                <td className="py-3 px-2 text-slate-600">{s.discipline || '-'}</td>
                                                                <td className="py-3 px-2">
                                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                                        s.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                        s.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                        s.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                        {s.status === 'confirmed' ? 'Đã xác nhận' :
                                                                         s.status === 'pending' ? 'Chờ xác nhận' :
                                                                         s.status === 'cancelled' ? 'Đã hủy' : s.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <Pagination
                                                page={selectedTrainerPage}
                                                totalPages={Math.ceil(selectedTrainer.sessions.length / PAGE_SIZE)}
                                                total={selectedTrainer.sessions.length}
                                                limit={PAGE_SIZE}
                                                onPageChange={setSelectedTrainerPage}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="px-6 pb-6">
                            <button onClick={() => setSelectedTrainer(null)}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </>);
}
