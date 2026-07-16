import { AdminLayout } from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Award, BarChart3, RefreshCw, Activity, AlertCircle } from 'lucide-react';
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

    // KHỞI TẠO STATE TRỐNG - ĐỢI DỮ LIỆU THẬT TỪ DATABASE
    const [bookingStats, setBookingStats] = useState<BookingStats>({ today: 0, month: 0, year: 0 });
    const [customerGrowth, setCustomerGrowth] = useState<GrowthItem[]>([]);
    const [sportDistribution, setSportDistribution] = useState<SportDistribution[]>([]);
    const [checkInOfWeek, setCheckInOfWeek] = useState<CheckInOfWeek[]>([]);
    const [trainerPerformance, setTrainerPerformance] = useState<TrainerPerformance[]>([]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const authUserData = localStorage.getItem('auth_user');
            let userToken = '';
            if (authUserData) {
                userToken = JSON.parse(authUserData).token || '';
            }

            if (!userToken) {
                setError("Không tìm thấy mã xác thực (Token). Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            // GỌI API THẬT TỪ DATABASE
            const response = await axios.get(`${getApiUrl()}/api/dashboard/admin-stats`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            if (response.data) {
                const data = response.data;
                // ĐỒNG BỘ 100% VỚI DATABASE TRẢ VỀ
                setBookingStats(data.bookingStats || { today: 0, month: 0, year: 0 });
                setCustomerGrowth(data.customerGrowth || []);
                setSportDistribution(data.sportDistribution || []);
                setCheckInOfWeek(data.checkInOfWeek || []);
                setTrainerPerformance(data.trainerPerformance || []);
            }
        } catch (err: any) {
            console.error("Lỗi kết nối API:", err);
            setError("Không thể đồng bộ dữ liệu từ hệ thống. Hãy chắc chắn rằng Backend và Database đang hoạt động.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const maxGrowth = customerGrowth.length > 0 ? Math.max(...customerGrowth.map(d => d.count), 1) : 1;
    const maxCheckIn = checkInOfWeek.length > 0 ? Math.max(...checkInOfWeek.map(d => d.count), 1) : 1;
    const totalActiveMembers = sportDistribution.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Tiêu đề */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Phân tích & Báo cáo</h1>
                        <p className="text-slate-500 text-sm mt-1">Dữ liệu liên kết trực tiếp từ hệ thống quản lý phòng tập thời gian thực</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Thông báo lỗi kết nối nếu có */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* 1. THỐNG KÊ ĐẶT LỊCH HLV */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-sm">
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest">Buổi Đặt Lịch Hôm Nay</p>
                        <h3 className="text-5xl font-black mt-4">{bookingStats.today}</h3>
                        <p className="text-indigo-200 text-xs mt-3">Truy vấn từ bảng Bookings</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-sm">
                        <p className="text-purple-100 text-xs font-black uppercase tracking-widest">Buổi Đặt Lịch Tháng Này</p>
                        <h3 className="text-5xl font-black mt-4">{bookingStats.month}</h3>
                        <p className="text-purple-200 text-xs mt-3">Tích lũy tháng hiện tại</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-sm">
                        <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">Buổi Đặt Lịch Trong Năm</p>
                        <h3 className="text-5xl font-black mt-4">{bookingStats.year}</h3>
                        <p className="text-emerald-200 text-xs mt-3">Tích lũy năm hiện tại</p>
                    </div>
                </div>

                {/* Biểu đồ Hàng 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. BIỂU ĐỒ HỘI VIÊN ĐĂNG KÝ (TĂNG TRƯỞNG) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Tốc độ Tăng trưởng Hội viên mới
                        </h3>
                        {customerGrowth.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Không có dữ liệu tăng trưởng hội viên trong database
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

                    {/* 3. BIỂU ĐỒ HỘI VIÊN ĐANG HOẠT ĐỘNG THEO MÔN */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Activity className="w-5 h-5 text-emerald-500" /> Phân bổ Hội viên theo Gói môn tập
                        </h3>
                        {sportDistribution.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Chưa có dữ liệu phân bổ lớp học trong database
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
                    {/* 4. BIỂU ĐỒ ĐIỂM DANH THEO NGÀY TRONG TUẦN */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-purple-500" /> Tần suất Điểm danh theo ngày trong Tuần
                        </h3>
                        {checkInOfWeek.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Chưa có dữ liệu điểm danh tuần này trong database
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

                    {/* 5. HIỆU SUẤT HLV TRUNG BÌNH */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Award className="w-5 h-5 text-amber-500" /> Xếp hạng Hiệu suất Huấn luyện viên (PT)
                        </h3>
                        {trainerPerformance.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                Chưa xếp hạng vì HLV chưa có lịch dạy trong database
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trainerPerformance.map((trainer, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-xs">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-800">{trainer.name}</h4>
                                            <p className="text-[11px] text-slate-400 font-bold">Huấn luyện viên của trung tâm</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                                {trainer.sessions} Ca dạy
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}