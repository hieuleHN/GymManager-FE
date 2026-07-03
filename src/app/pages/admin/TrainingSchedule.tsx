import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, AlertCircle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useNavigate } from "react-router";
import { getAuthHeaders } from "../../context/AuthContext";

interface Booking {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string };
  trainerId: { _id: string; fullName: string };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  locationId?: { _id: string; title: string };
  note?: string;
}

export function TrainingSchedule() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  });

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const hours = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/bookings?limit=100', { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

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

  const weekRangeText = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
  }, [currentWeekStart]);

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'transfer-requested':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusText = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'transfer-requested':
        return 'Yêu cầu chuyển';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lịch tập</h1>
          <p className="text-slate-600 mt-2">Quản lý lịch tập của huấn luyện viên</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
            <Calendar className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-bold text-slate-900">Đặt lịch mới</h3>
            <p className="text-sm text-slate-600 mt-1">Tạo lịch tập cho hội viên</p>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
          >
            <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-bold text-slate-900">Chuyển lịch</h3>
            <p className="text-sm text-slate-600 mt-1">Chuyển cho đồng nghiệp khi bận</p>
          </button>

          <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left">
            <Clock className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-bold text-slate-900">Xem lịch tháng</h3>
            <p className="text-sm text-slate-600 mt-1">Xem toàn bộ lịch trong tháng</p>
          </button>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Lịch dạy tuần</h2>
            <div className="flex items-center gap-4">
              <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold">{weekRangeText}</span>
              <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            <div className="grid grid-cols-8 gap-px bg-slate-200 rounded-lg">
              <div className="bg-slate-50 p-2 text-center text-sm font-medium">Giờ</div>
              {getWeekDays.map((date, idx) => (
                <div key={idx} className="bg-slate-50 p-2 text-center text-sm font-medium">
                  {weekDays[idx]} {date.getDate()}/{date.getMonth() + 1}
                </div>
              ))}

              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="bg-white p-2 text-sm text-center border-t border-slate-100">{hour}</div>
                  {getWeekDays.map((date, dayIdx) => {
                    const hourBookings = getBookingsForHour(date, hour);
                    return (
                      <div key={dayIdx} className="bg-white p-1 min-h-[50px] border-t border-slate-100 relative">
                        {hourBookings.map((b) => (
                          <div
                            key={b._id}
                            onClick={() => navigate(`/admin/schedule-confirmations`, { state: { bookingId: b._id } })}
                            className={`text-xs p-1 rounded mb-0.5 cursor-pointer hover:opacity-80 transition-opacity ${b.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            <div className="font-semibold">{b.customerId?.fullName || 'Khách'}</div>
                            <div>{b.time}</div>
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

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Chuyển lịch cho đồng nghiệp</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chọn lịch cần chuyển</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>05/06/2026 - 08:00-09:00 - Nguyễn Văn A</option>
                    <option>05/06/2026 - 10:00-11:00 - Trần Thị B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chọn đồng nghiệp</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>HLV Nguyễn Văn D</option>
                    <option>HLV Trần Thị E</option>
                    <option>HLV Lê Văn F</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lý do chuyển lịch</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="Nhập lý do..."
                  />
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <span className="font-semibold">Lưu ý:</span> Hội viên sẽ nhận được thông báo về việc thay đổi huấn luyện viên và cần xác nhận.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                  Gửi yêu cầu chuyển lịch
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Legend */}
<div className="mt-4 pt-4 border-t border-slate-200">
  <div className="flex flex-wrap gap-4 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded bg-amber-400"></div>
      <span className="text-slate-600">Đang chờ xác nhận</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded bg-green-500"></div>
      <span className="text-slate-600">Xác nhận lịch tập thành công</span>
    </div>
  </div>
</div>
      </div>
    </AdminLayout>
  );
}
