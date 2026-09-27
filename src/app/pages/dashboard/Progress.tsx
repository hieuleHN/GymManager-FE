import { DashboardLayout } from '../../components/DashboardLayout';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User, Dumbbell, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../context/AuthContext';

// Cấu trúc dữ liệu check-in thô nhận về trực tiếp từ API Backend
interface RawCheckIn {
  _id?: string;
  checkInTime: string;   // Giờ check-in định dạng "HH:mm:ss"
  checkInDate?: string;  // Chuỗi ngày tĩnh "YYYY-MM-DD" chuẩn GMT+7 từ Backend
  dateStr?: string;      // Định dạng ngày "DD/MM/YYYY" để so khớp ở Frontend
  createdAt?: string;    // Thời gian tạo bản ghi
  packageName?: string;
  trainerName?: string;
  duration?: string;
  caloriesBurned?: number;
  focusZone?: string;
  exercises?: { name: string; sets: number; reps: string }[];
  trainerNotes?: string;
}

// Cấu trúc một ô ngày hoàn chỉnh trong Ma trận Lịch sử hiển thị ở giao diện
interface CheckedInDay {
  dateStr: string;      // Định dạng 'DD/MM/YYYY' để so khớp
  dayOfWeek: string;    // T2, T3...
  weekLabel: string;    // Tuần 1, Tuần 2...
  isPast: boolean;      // Ngày này đã qua hoặc là ngày hôm nay chưa
  checkInTime?: string; // Giờ quét cửa thực tế lấy từ Database
  packageName?: string;
  trainerName?: string;
  duration?: string;
  caloriesBurned?: number;
  focusZone?: string;
  exercises?: { name: string; sets: number; reps: string }[];
  trainerNotes?: string;
}

interface WeekRow {
  week: string;
  days: (CheckedInDay | null)[];
}

export function Progress() {
  const [loading, setLoading] = useState<boolean>(false);
  const [checkInList, setCheckInList] = useState<RawCheckIn[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<WeekRow[]>([]);
  const [selectedSession, setSelectedSession] = useState<CheckedInDay | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. GỌI API LẤY LỊCH SỬ CHECK-IN THỰC TẾ TỪ DATABASE BACKEND
  const fetchProgressData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const authUserData = localStorage.getItem('auth_user');
      let userToken = '';
      if (authUserData) {
        try {
          userToken = JSON.parse(authUserData).token || '';
        } catch (e) {
          console.error("Lỗi đọc token từ localStorage:", e);
        }
      }

      if (!userToken) {
        setErrorMsg('Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem tiến độ!');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${getApiUrl()}/api/checkin/history`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (response.data) {
        const rawHistory = Array.isArray(response.data) ? response.data : (response.data.history || []);

        // Tiến hành chuẩn hóa dữ liệu ngày tháng từ DB trả về
        const formattedHistory: RawCheckIn[] = rawHistory.map((item: any) => {
          let calculatedDateStr = '';
          let calculatedTimeStr = '';

          // Ưu tiên lấy checkInDate tĩnh dạng "YYYY-MM-DD", chuyển trực tiếp sang "DD/MM/YYYY"
          if (item.checkInDate && /^\d{4}-\d{2}-\d{2}$/.test(item.checkInDate)) {
            const [year, month, day] = item.checkInDate.split('-');
            calculatedDateStr = `${day}/${month}/${year}`;
          }

          const timeValue = item.checkInTime || item.createdAt;
          if (timeValue) {
            const d = new Date(timeValue);

            if (!calculatedDateStr) {
              const dd = String(d.getDate()).padStart(2, '0');
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              calculatedDateStr = `${dd}/${mm}/${yyyy}`;
            }

            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            calculatedTimeStr = `${hours}:${minutes}:${seconds}`;
          }

          return {
            ...item,
            dateStr: calculatedDateStr,
            checkInTime: calculatedTimeStr || item.checkInTime || 'Đã ghi nhận',
            packageName: item.packageName || 'Gói Thẻ Hội Viên Tiêu Chuẩn',
            trainerName: item.trainerName || 'Hệ thống tự động ghi nhận',
            duration: item.duration || '60 phút',
            focusZone: item.focusZone || 'Tập luyện độc lập',
            exercises: item.exercises || [],
            trainerNotes: item.trainerNotes || 'Ghi nhận quét mã thành công tại cửa ra vào.'
          };
        });

        setCheckInList(formattedHistory);
      }
    } catch (err: any) {
      console.error("Lỗi kết nối API:", err);
      setErrorMsg(err.response?.data?.message || 'Không thể đồng bộ dữ liệu check-in từ máy chủ phòng gym.');
    } finally {
      setLoading(false);
    }
  };

  // 2. TỰ ĐỘNG XÂY DỰNG MA TRẬN 5 TUẦN THEO THỜI GIAN THỰC
  const buildTrainingMatrix = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const tempWeeks: WeekRow[] = [];
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    let latestSession: CheckedInDay | null = null;

    for (let w = 0; w < 5; w++) {
      const daysInWeek: (CheckedInDay | null)[] = [];

      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7 + d));

        const dd = String(currentDate.getDate()).padStart(2, '0');
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const yyyy = currentDate.getFullYear();
        const dateStr = `${dd}/${mm}/${yyyy}`;

        const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const cleanCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const isPast = cleanCurrent <= cleanToday;

        const matchedCheckIn = checkInList.find(c => c.dateStr === dateStr);

        const dayObj: CheckedInDay = {
          dateStr,
          dayOfWeek: dayLabels[d],
          weekLabel: `Tuần ${w + 1}`,
          isPast,
          ...(matchedCheckIn || {})
        };

        daysInWeek.push(dayObj);

        if (matchedCheckIn) {
          latestSession = dayObj;
        }
      }

      tempWeeks.push({
        week: `Tuần ${w + 1}`,
        days: daysInWeek
      });
    }

    setTrainingHistory(tempWeeks);

    if (latestSession && !selectedSession) {
      setSelectedSession(latestSession);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  useEffect(() => {
    buildTrainingMatrix();
  }, [checkInList]);

  // 3. TỰ ĐỘNG TÍNH TOÁN CÁC CHỈ SỐ THỐNG KÊ REAL-TIME
  let attendedCount = 0;
  let missedCount = 0;

  trainingHistory.forEach(week => {
    week.days.forEach(day => {
      if (day) {
        if (day.checkInTime) {
          attendedCount++;
        } else if (day.isPast) {
          missedCount++;
        }
      }
    });
  });

  const totalDaysElapsed = attendedCount + missedCount;
  const progressPercentage = totalDaysElapsed > 0 ? Math.round((attendedCount / totalDaysElapsed) * 100) : 0;

  const stats = [
    { label: 'Buổi đã tập', value: attendedCount.toString(), color: 'text-green-600' },
    { label: 'Buổi bỏ lỡ', value: missedCount.toString(), color: 'text-red-600' },
    { label: 'Tỷ lệ hoàn thành', value: `${progressPercentage}%`, color: 'text-blue-600' }
  ];

  const weeks = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tiêu đề & Nút làm mới */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Theo dõi tiến độ</h1>
            <p className="text-slate-600">Hệ thống tự động đồng bộ thông tin chi tiết dựa trên số lần quét QR Code check-in tại cửa</p>
          </div>
          <button
            onClick={fetchProgressData}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm transition-all"
            title="Nhấn để đồng bộ dữ liệu mới nhất"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg} (Hệ thống đang hiển thị lịch trình dựa trên thời gian thực tế)</span>
          </div>
        )}

        {/* Thống kê động */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Ma trận Lịch sử tập luyện thực tế */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Lịch sử tập luyện thực tế
          </h3>

          <div className="space-y-3">
            {/* Header Thứ */}
            <div className="grid grid-cols-8 gap-2 text-center text-sm font-semibold text-slate-600 mb-2">
              <div></div>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => <div key={idx}>{day}</div>)}
            </div>

            {/* Các hàng tuần */}
            {weeks.map((weekLabel, idx) => {
              const weekDays = trainingHistory.find(w => w.week === weekLabel)?.days || Array(7).fill(null);

              return (
                <div key={idx} className="grid grid-cols-8 gap-2">
                  <div className="text-sm text-slate-600 font-medium flex items-center">{weekLabel}</div>
                  {weekDays.map((day, dayIdx) => {
                    if (!day) return <div key={dayIdx} className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-50"></div>;

                    const hasCheckIn = !!day.checkInTime;
                    const isPastDay = day.isPast;

                    return (
                      <div key={dayIdx} className="flex items-center justify-center">
                        {hasCheckIn ? (
                          /* 🟢 ĐÃ CHECK-IN THÀNH CÔNG: Tích xanh lá */
                          <button
                            onClick={() => setSelectedSession(day)}
                            className={`w-8 h-8 rounded-full bg-green-500 flex items-center justify-center hover:scale-105 transition-transform ${selectedSession?.dateStr === day.dateStr ? 'ring-2 ring-offset-2 ring-indigo-600' : ''
                              }`}
                            title={`Click xem dữ liệu ngày check-in: ${day.dateStr}`}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        ) : isPastDay ? (
                          /* 🔴 BỎ LỠ: Tích đỏ */
                          <div
                            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center cursor-not-allowed opacity-80"
                            title={`Ngày ${day.dateStr} vắng mặt, không ghi nhận dữ liệu check-in.`}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : (
                          /* ⚪ SẮP TỚI: Ngày trong tương lai chưa đến */
                          <div
                            className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-50"
                            title={`Ngày ${day.dateStr} (Chưa tới)`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Chú thích */}
            <div className="flex gap-6 text-sm pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span className="text-slate-600">Đã tập (Click xem dữ liệu)</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-slate-600">Bỏ lỡ (Không có dữ liệu)</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-50"></div><span className="text-slate-600">Sắp tới</span></div>
            </div>
          </div>
        </div>

        {/* Box hiển thị chi tiết giáo án huấn luyện */}
        {selectedSession && selectedSession.checkInTime ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 animate-[fadeIn_0.15s_ease-out]">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-indigo-600" /> Thông tin dữ liệu buổi check-in ngày {selectedSession.dateStr}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột thông tin trái */}
              <div className="space-y-3 text-sm font-semibold text-slate-900">
                <div className="flex justify-between border-b pb-2 border-slate-100">
                  <span className="text-slate-500 font-normal">Mốc giờ quét QR Code cửa:</span>
                  <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Check-in thành công: {selectedSession.checkInTime}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-slate-100">
                  <span className="text-slate-500 font-normal">Gói tập kích hoạt:</span>
                  <span>{selectedSession.packageName}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-slate-100">
                  <span className="text-slate-500 font-normal">Huấn luyện viên phụ trách:</span>
                  <span className="text-indigo-600 flex items-center gap-1">
                    <User className="w-4 h-4" /> {selectedSession.trainerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Nhóm cơ vận động chính:</span>
                  <span>{selectedSession.focusZone}</span>
                </div>
              </div>

              {/* Cột giáo án bài tập bên phải */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Giáo án tập luyện chi tiết của buổi:
                </p>
                {selectedSession.exercises && selectedSession.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSession.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg text-xs font-bold shadow-sm">
                        <span>{ex.name}</span>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-black">
                          {ex.sets} Sets × {ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-xs py-2 text-center">Chưa ghi nhận bài tập chi tiết từ HLV cho buổi tập này.</div>
                )}
              </div>
            </div>

            {/* Đánh giá từ PT */}
            {selectedSession.trainerNotes && (
              <div className="bg-amber-50/50 border border-amber-200 text-slate-900 p-3 rounded-xl text-xs font-bold leading-relaxed italic flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Nhận xét chuyên môn của PT: "{selectedSession.trainerNotes}"</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-sm font-semibold text-slate-400 italic">
            💡 Vui lòng bấm vào một ô tròn có dấu [ Tích xanh ] ở bảng lịch sử để xem dữ liệu check-in chi tiết và giáo án huấn luyện của ngày đó.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}