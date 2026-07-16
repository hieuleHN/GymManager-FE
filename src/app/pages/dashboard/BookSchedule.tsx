import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function BookSchedule() {
  const navigate = useNavigate();
  const [currentMonth] = useState(new Date(2024, 5, 1)); // June 2024
  const [selectedDates, setSelectedDates] = useState<{[key: number]: string}>({});
  const [activeDate, setActiveDate] = useState<number | null>(null);

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const handleDateClick = (day: number) => {
    if (day < 1 || day > 30) return;
    setActiveDate(day);
  };

  const handleTimeSelect = (time: string) => {
    if (activeDate === null) return;
    setSelectedDates(prev => ({
      ...prev,
      [activeDate]: time
    }));
    toast.success(`Đã chọn ${time} cho ngày ${activeDate}/06/2024`);
    setActiveDate(null);
  };

  const handleSave = () => {
    const count = Object.keys(selectedDates).length;
    if (count === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày tập');
      return;
    }
    toast.success(`Đã lưu ${count} lịch tập thành công!`);
    setTimeout(() => {
      navigate('/dashboard/schedule');
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/schedule')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Đặt lịch tập mới</h1>
              <p className="text-slate-600">Chọn ngày và giờ tập luyện</p>
            </div>
          </div>
          <Button
            variant="contained"
            startIcon={<Save className="w-5 h-5" />}
            onClick={handleSave}
            sx={{
              height: 48,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Lưu thay đổi
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Tháng 6/2024</h2>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Month View */}
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                  <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-7 grid-rows-5 gap-2 h-full">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 5; // Tháng 6/2024 bắt đầu từ thứ 7
                    const hasTime = selectedDates[day];
                    const isActive = activeDate === day;
                    return (
                      <div
                        key={i}
                        onClick={() => handleDateClick(day)}
                        className={`rounded-xl border-2 p-2 cursor-pointer transition-all ${
                          day < 1 || day > 30
                            ? 'bg-slate-50 border-slate-100 cursor-default'
                            : isActive
                            ? 'border-indigo-600 bg-indigo-100 shadow-md'
                            : hasTime
                            ? 'border-green-400 bg-green-50 hover:bg-green-100'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        {day >= 1 && day <= 30 && (
                          <div className="h-full flex flex-col">
                            <div className={`font-bold text-sm mb-1 ${isActive ? 'text-indigo-700' : hasTime ? 'text-green-700' : 'text-slate-900'}`}>
                              {day}
                            </div>
                            {hasTime && (
                              <div className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">
                                {hasTime}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {activeDate ? `Chọn giờ cho ngày ${activeDate}/06` : 'Chọn ngày trước'}
            </h3>

            {activeDate ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-slate-900 font-semibold"
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChevronLeft className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Vui lòng chọn một ngày trên lịch để chọn giờ tập</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {Object.keys(selectedDates).length > 0 && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Đã chọn {Object.keys(selectedDates).length} lịch tập:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedDates).map(([date, time]) => (
                <div key={date} className="bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-sm">
                  <span className="font-semibold text-slate-900">{date}/06:</span>{' '}
                  <span className="text-indigo-700">{time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
