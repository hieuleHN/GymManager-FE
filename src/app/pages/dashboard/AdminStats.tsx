import { AdminLayout } from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Award, BarChart3, RefreshCw, Activity, AlertCircle, Calendar } from 'lucide-react';
import { getApiUrl } from '../../context/AuthContext';

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
}

export function AdminStats() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // BẮT BUỘC KHỞI TẠO RỖNG - ĐỢI 100% DỮ LIỆU TỪ DATABASE
    const [bookingStats, setBookingStats] = useState<BookingStats>({ today: 0, month: 0, year: 0 });
    const [customerGrowth, setCustomerGrowth] = useState<GrowthItem[]>([]);
    const [sportDistribution, setSportDistribution] = useState<SportDistribution[]>([]);
    const [checkInOfWeek, setCheckInOfWeek] = useState<CheckInOfWeek[]>([]);
    const [trainerPerformance, setTrainerPerformance] = useState<TrainerPerformance[]>([]);

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

            // GỌI API TRUY VẤN TỪ DATABASE
            const response = await axios.get(`${getApiUrl()}/api/dashboard/admin-stats`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            if (response.data) {
                const data = response.data;
                // CẬP NHẬT TRỰC TIẾP TỪ DB
                setBookingStats(data.bookingStats || { today: 0, month: 0, year: 0 });
                setCustomerGrowth(data.customerGrowth || []);
                setSportDistribution(data.sportDistribution || []);
                setCheckInOfWeek(data.checkInOfWeek || []);
                setTrainerPerformance(data.trainerPerformance || []);
            }
        } catch (err: any) {
            console.error("Lỗi kết nối API Thống kê DB:", err);
            setError("Không thể kết nối đến Backend hoặc Database đang gặp sự cố.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatsFromDB();
    }, []);

    const maxGrowth = customerGrowth.length > 0 ? Math.max(...customerGrowth.map(d => d.count), 1) : 1;
    const maxCheckIn = checkInOfWeek.length > 0 ? Math.max(...checkInOfWeek.map(d => d.count), 1) : 1;
    const totalActiveMembers = sportDistribution.reduce((acc, curr) => acc + curr.value, 0);

    // Dữ liệu và tính toán chiều cao cột cho Biểu đồ Thống kê Đặt lịch HLV
    const bookingChartData = [
        { label: 'Buổi hôm nay', count: bookingStats.today, color: 'bg-indigo-500 hover:bg-indigo-600' },
        { label: 'Buổi tháng này', count: bookingStats.month, color: 'bg-purple-500 hover:bg-purple-600' },
        { label: 'Buổi trong năm', count: bookingStats.year, color: 'bg-emerald-500 hover:bg-emerald-600' }
    ];
    const maxBooking = Math.max(bookingStats.today, bookingStats.month, bookingStats.year, 1);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Phân tích & Báo cáo</h1>
                        <p className="text-slate-500 text-sm mt-1">Dữ liệu liên kết trực tiếp từ Database thời gian thực</p>
                    </div>
                    <button
                        onClick={fetchStatsFromDB}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm transition-all disabled:opacity-50"
                        title="Đồng bộ dữ liệu DB"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Thông báo lỗi kết nối */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* 1. BIỂU ĐỒ THỐNG KÊ ĐẶT LỊCH HLV */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Biểu đồ So sánh Lượng Đặt lịch HLV (PT) theo Mốc thời gian
                        </h3>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 self-start sm:self-auto">
                            Dữ liệu thực tế từ DB
                        </span>
                    </div>

                    <div className="h-64 flex items-end justify-around gap-6 px-8 pt-8 border-b border-slate-100 pb-2">
                        {bookingChartData.map((item, idx) => {
                            const heightVal = Math.max(Math.round((item.count / maxBooking) * 180), 12);
                            return (
                                <div key={idx} className="flex-1 max-w-[140px] flex flex-col items-center group relative">
                                    {/* Tooltip khi hover */}
                                    <div className="absolute -top-10 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                                        {item.count} Buổi đặt
                                    </div>

                                    {/* Cột biểu đồ */}
                                    <div
                                        style={{ height: `${heightVal}px` }}
                                        className={`w-full ${item.color} rounded-t-2xl transition-all duration-500 shadow-sm flex items-center justify-center`}
                                    >
                                        <span className="text-white text-xs font-black drop-shadow">
                                            {item.count}
                                        </span>
                                    </div>

                                    {/* Nhãn dưới chân cột */}
                                    <span className="text-xs text-slate-600 font-black mt-3 text-center">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Biểu đồ Hàng 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. BIỂU ĐỒ TĂNG TRƯỜNG HỘI VIÊN */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Tốc độ Tăng trưởng Hội viên mới
                        </h3>
                        {customerGrowth.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Chưa có bản ghi tăng trưởng trong Database
                            </div>
                        ) : (
                            <div className="h-64 flex items-end justify-between gap-2 px-2 pt-6">
                                {customerGrowth.map((item, idx) => {
                                    const heightVal = Math.max(Math.round((item.count / maxGrowth) * 200), 5);
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                            <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                {item.count} HV
                                            </div>
                                            <div
                                                style={{ height: `${heightVal}px` }}
                                                className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all duration-500 shadow-sm"
                                            ></div>
                                            <span className="text-[11px] text-slate-400 font-bold mt-2">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 3. BIỂU ĐỒ PHÂN BỐ THEO MÔN */}
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
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-black">
                                                <span className="text-slate-700">{sport.name}</span>
                                                <span className="text-slate-500">{sport.value} Hội viên ({percent}%)</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${percent}%` }}
                                                    className={`h-full ${colors[idx % colors.length]} transition-all duration-700`}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Biểu đồ Hàng 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 4. ĐIỂM DANH THEO NGÀY TRONG TUẦN */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-purple-500" /> Tần suất Điểm danh theo ngày trong Tuần
                        </h3>
                        {checkInOfWeek.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Chưa có bản ghi điểm danh tuần này trong Database
                            </div>
                        ) : (
                            <div className="h-64 flex items-end justify-between gap-6 px-4 pt-6">
                                {checkInOfWeek.map((item, idx) => {
                                    const heightVal = Math.max(Math.round((item.count / maxCheckIn) * 200), 5);
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                            <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                {item.count} Lượt
                                            </div>
                                            <div
                                                style={{ height: `${heightVal}px` }}
                                                className="w-full bg-purple-500 hover:bg-purple-600 rounded-t-md transition-all duration-500"
                                            ></div>
                                            <span className="text-xs text-slate-500 font-black mt-2">{item.day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 5. BIỂU ĐỒ HIỆU SUẤT HLV (ĐÃ CHUYỂN THÀNH CỘT NẰM NGANG + CHỈ SỐ TRUNG BÌNH) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-500" /> Biểu đồ Hiệu suất Huấn luyện viên (PT)
                            </h3>

                            {/* Thẻ hiển thị Hiệu suất Trung bình số ca/HLV tính từ DB */}
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
                                        const percentOfMax = Math.round((trainer.sessions / maxSession) * 100);
                                        const isAboveAvg = trainer.sessions >= avgSessions;

                                        return (
                                            <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-full font-black flex items-center justify-center text-xs ${idx === 0 ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                                                        }`}>
                                                        #{idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-black text-slate-800 truncate">{trainer.name}</h4>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isAboveAvg ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                                }`}>
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

                                                {/* Thanh Biểu đồ ngang thể hiện tương quan số ca dạy */}
                                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${percentOfMax}%` }}
                                                        className={`h-full transition-all duration-700 ${idx === 0 ? 'bg-amber-500' : 'bg-indigo-500'
                                                            }`}
                                                    ></div>
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
        </AdminLayout>
    );
}