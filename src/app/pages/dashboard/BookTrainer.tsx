import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export function BookTrainer() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert('Vui lòng chọn ngày và giờ');
      return;
    }
    navigate(`/dashboard/trainers/${trainerId}/confirm`, {
      state: { date: selectedDate, time: selectedTime }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chọn thời gian</h1>
          <p className="text-slate-600">Chọn ngày và giờ phù hợp với lịch của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Tháng 6/2024</h2>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 5;
                const isSelected = selectedDate === day;
                return (
                  <button
                    key={i}
                    onClick={() => day >= 1 && day <= 30 && setSelectedDate(day)}
                    disabled={day < 1 || day > 30}
                    className={`aspect-square rounded-xl border-2 font-semibold transition-all ${
                      day < 1 || day > 30
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {day >= 1 && day <= 30 && day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {selectedDate ? `Chọn giờ cho ngày ${selectedDate}/06` : 'Chọn ngày trước'}
            </h3>

            {selectedDate ? (
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      selectedTime === time
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
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
                <p className="text-slate-500">Vui lòng chọn ngày để xem giờ có sẵn</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
            <h4 className="font-semibold text-indigo-900 mb-2">Thông tin đặt lịch:</h4>
            <p className="text-indigo-700">
              Ngày: <span className="font-bold">{selectedDate}/06/2024</span> - Giờ: <span className="font-bold">{selectedTime}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ flex: 1, height: 56, borderRadius: 3, textTransform: 'none', fontSize: '1rem' }}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            endIcon={<ArrowRight />}
            sx={{
              flex: 2,
              height: 56,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' }
            }}
          >
            Tiếp tục xác nhận
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
