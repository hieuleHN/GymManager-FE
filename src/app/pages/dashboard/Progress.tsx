import { DashboardLayout } from '../../components/DashboardLayout';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  Award,
  Clock,
  User,
  RotateCcw,
  TrendingUp,
  Flame,
  Dumbbell,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '../../context/AuthContext'; // Điều chỉnh import cho đúng cấp thư mục

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

interface AttendanceSession {
  date: string;
  time: string;
  status: 'attended' | 'cancelled';
  packageName: string;
  trainerName?: string;
  duration: string;
  caloriesBurned: number;
  focusZone: string;
  exercises: WorkoutExercise[];
  trainerNotes?: string;
}

export function Progress() {
  const totalSessions = 30;

  // Quản lý trạng thái giao diện
  const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'cancelled'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [sessions, setSessions] = useState<AttendanceSession[]>([
    {
      date: '06/07/2026',
      time: '14:15:22',
      status: 'attended',
      packageName: 'Gói Thể Hình VIP PT 1:1',
      trainerName: 'Nguyễn Văn Hùng',
      duration: '60 phút',
      caloriesBurned: 520,
      focusZone: 'Cơ Ngực & Tay Sau (Chest & Triceps)',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '10-12 reps' },
        { name: 'Incline Dumbbell Fly', sets: 3, reps: '12 reps' },
        { name: 'Triceps Rope Pushdown', sets: 4, reps: '15 reps' }
      ],
      trainerNotes: 'Thể trạng tốt, nâng tạ đúng form. Cần chú ý siết cơ bụng hơn khi đẩy tạ nặng.'
    },
    {
      date: '04/07/2026',
      time: '18:30:12',
      status: 'attended',
      packageName: 'Gói Thể Hình VIP PT 1:1',
      trainerName: 'Nguyễn Văn Hùng',
      duration: '60 phút',
      caloriesBurned: 450,
      focusZone: 'Cơ Lưng & Tay Trước (Back & Biceps)',
      exercises: [
        { name: 'Lat Pulldown', sets: 4, reps: '12 reps' },
        { name: 'Seated Cable Row', sets: 3, reps: '12 reps' }
      ],
      trainerNotes: 'Lực kéo tốt, cơ bắp đáp ứng cường độ cao. Khuyến nghị bổ sung thêm protein sau tập.'
    },
    {
      date: '02/07/2026',
      time: '--:--:--',
      status: 'cancelled',
      packageName: 'Gói Thể Hình VIP PT 1:1',
      trainerName: 'Nguyễn Văn Hùng',
      duration: '0 phút',
      caloriesBurned: 0,
      focusZone: 'Nghỉ ngơi phục hồi (Rest Day)',
      exercises: [],
      trainerNotes: 'Hội viên chủ động hủy lịch quét cửa để chuyển sang ngày khác.'
    },
    {
      date: '30/06/2026',
      time: '19:00:03',
      status: 'attended',
      packageName: 'Gói Thể Hình VIP PT 1:1',
      trainerName: 'Nguyễn Văn Hùng',
      duration: '75 phút',
      caloriesBurned: 580,
      focusZone: 'Cơ Đùi & Mông (Leg Day)',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: '8-10 reps' }
      ],
      trainerNotes: 'Buổi tập chân cường độ cao rất tốt. Khớp gối ổn định.'
    }
  ]);

  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);

  const fetchAttendanceProgress = async () => {
    setLoading(true);
    try {
      const authUserData = localStorage.getItem('auth_user');
      let userToken = '';
      if (authUserData) userToken = JSON.parse(authUserData).token || '';

      if (userToken) {
        const response = await axios.get(`${getApiUrl()}/api/progress/member-history`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        if (response.data && response.data.sessions) {
          setSessions(response.data.sessions);
          if (response.data.sessions.length > 0) setSelectedSession(response.data.sessions[0]);
        }
      }
    } catch (err) {
      console.log("Chạy Mock Data nội bộ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceProgress();
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, []);

  const attendedCount = sessions.filter(s => s.status === 'attended').length;
  const progressPercentage = Math.round((attendedCount / totalSessions) * 100);
  const totalCalories = sessions.reduce((acc, curr) => acc + curr.caloriesBurned, 0);

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const handleToggleStatus = async (dateStr: string) => {
    setLoading(true);
    try {
      const authUserData = localStorage.getItem('auth_user');
      let userToken = '';
      if (authUserData) userToken = JSON.parse(authUserData).token || '';

      await axios.put(`${getApiUrl()}/api/progress/toggle-session`,
        { date: dateStr },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (e) {
      console.log("Đang cập nhật State Frontend.");
    }

    setSessions(prev => prev.map(s => {
      if (s.date === dateStr) {
        const isAttended = s.status === 'attended';
        const updated: AttendanceSession = {
          ...s,
          status: isAttended ? 'cancelled' : 'attended',
          time: isAttended ? '--:--:--' : new Date().toLocaleTimeString('vi-VN'),
          caloriesBurned: isAttended ? 0 : 500,
          focusZone: isAttended ? 'Nghỉ ngơi (Hủy lịch tập)' : 'Cơ bụng & Cardio nhẹ',
          exercises: isAttended ? [] : [{ name: 'Cardio Machine', sets: 1, reps: '30 phút' }]
        };
        if (selectedSession && selectedSession.date === dateStr) setSelectedSession(updated);
        return updated;
      }
      return s;
    }));
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900">

        {/* Header tiêu đề chữ đen */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <Activity className="w-7 h-7 text-indigo-600" />
              Theo dõi tiến độ tập luyện
            </h1>
            <p className="text-xs text-slate-600 font-bold">
              Đồng bộ và xác nhận ngày tập dựa trên lịch sử check-in QR Code tại cửa ra vào
            </p>
          </div>
          <button
            onClick={fetchAttendanceProgress}
            className="p-2 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 text-slate-900 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Hộp chỉ số màu xám điểm nhấn, chữ đen đậm tương phản cao */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Tỷ lệ hoàn thành
              </span>
              <div className="text-3xl font-black text-slate-900 pt-1.5">
                {attendedCount} <span className="text-lg text-slate-400 font-bold">/ {totalSessions} buổi</span>
              </div>
            </div>
            <div className="mt-3 w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
            </div>
            <span className="text-[11px] text-slate-950 font-black mt-2">Đã hoàn thành {progressPercentage}% lộ trình</span>
          </div>

          <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider">Năng lượng tiêu hao</span>
              <div className="text-2xl font-black text-slate-900">{totalCalories} <span className="text-sm text-slate-400 font-bold">kcal</span></div>
              <p className="text-[11px] text-slate-950 font-bold">Tính toán dựa trên số buổi điểm danh thực tế</p>
            </div>
          </div>

          <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider">Huy hiệu đạt được</span>
              <div className="text-base font-black text-slate-900">Chiến binh kỷ luật</div>
              <p className="text-[11px] text-emerald-700 font-extrabold">Đi tập đúng lịch trình tuần này</p>
            </div>
          </div>
        </div>

        {/* Hai cột chức năng chính */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Cột trái: Nhật ký Check-in và Tabs lọc */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Nhật ký điểm danh hội viên
              </h3>
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 items-center text-xs font-bold text-slate-950">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-white shadow-sm text-indigo-600 font-extrabold' : 'hover:bg-slate-200/60'}`}>Tất cả</button>
                <button onClick={() => setFilterStatus('attended')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'attended' ? 'bg-white shadow-sm text-emerald-700 font-extrabold' : 'hover:bg-slate-200/60'}`}>Đã tập</button>
                <button onClick={() => setFilterStatus('cancelled')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'cancelled' ? 'bg-white shadow-sm text-red-700 font-extrabold' : 'hover:bg-slate-200/60'}`}>Đã hủy</button>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 max-h-[440px] flex-1">
              {filteredSessions.map((session) => (
                <div
                  key={session.date}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs shadow-sm ${selectedSession?.date === session.date ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/50'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {session.status === 'attended' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-900 text-sm">{session.date}</div>
                      <div className="font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.status === 'attended' ? `Check-in hợp lệ: ${session.time}` : 'Vắng mặt / Chủ động hủy lịch'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${session.status === 'attended' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{session.status === 'attended' ? 'Đã tập' : 'Đã hủy'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(session.date); }} className="p-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-950 shadow-sm transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Chi tiết giáo án và Nhận xét PT */}
          <div className="lg:col-span-5 flex flex-col w-full">
            {selectedSession ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2"><Dumbbell className="w-4 h-4 text-indigo-600" /> Hoạt động ngày {selectedSession.date}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-100/90 border border-slate-200 p-3 rounded-xl text-center">
                      <div className="text-[10px] font-black text-slate-500 uppercase">Thời lượng</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">{selectedSession.duration}</div>
                    </div>
                    <div className="bg-slate-100/90 border border-slate-200 p-3 rounded-xl text-center">
                      <div className="text-[10px] font-black text-slate-500 uppercase">Năng lượng đốt</div>
                      <div className="text-sm font-black text-indigo-600 mt-0.5">~{selectedSession.caloriesBurned} kcal</div>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-900 font-bold">
                    <div className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-normal">Gói đăng ký:</span><span>{selectedSession.packageName}</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-normal">Huấn luyện viên:</span><span className="text-indigo-600 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedSession.trainerName || 'Tự luyện tập'}</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-normal">Nhóm cơ chính:</span><span>{selectedSession.focusZone}</span></div>
                    <div className="flex justify-between pt-0.5"><span className="text-slate-500 font-normal">Giờ quét QR:</span><span className="font-mono">{selectedSession.time}</span></div>
                  </div>

                  {selectedSession.exercises.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black text-slate-950 uppercase tracking-wide">Giáo án huấn luyện:</div>
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-xs font-bold text-slate-900">
                        {selectedSession.exercises.map((ex, i) => (
                          <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                            <span>{ex.name}</span>
                            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-black">{ex.sets} Sets × {ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSession.trainerNotes && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-black text-slate-950 uppercase tracking-wide">Đánh giá từ PT:</div>
                      <p className="bg-amber-50/50 border border-amber-200 text-slate-950 p-3 rounded-xl text-xs font-bold leading-relaxed italic">"{selectedSession.trainerNotes}"</p>
                    </div>
                  )}
                </div>

                <button onClick={() => handleToggleStatus(selectedSession.date)} className={`w-full py-3 rounded-xl font-black text-xs tracking-wide text-white transition-all shadow-sm mt-4 ${selectedSession.status === 'attended' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {selectedSession.status === 'attended' ? 'Yêu cầu hủy ghi nhận ngày tập' : 'Xác nhận khôi phục ngày tập này'}
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 italic flex items-center justify-center h-full">Vui lòng chọn một ngày bên trái để kiểm tra chi tiết.</div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}