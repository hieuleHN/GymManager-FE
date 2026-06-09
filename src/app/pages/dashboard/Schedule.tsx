import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export function Schedule() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  const weekSchedule = [
    { day: 1, hour: 2, title: 'PT Thùy Anh', time: '08:00 - 09:00', type: 'pt' },
    { day: 2, hour: 5, title: 'Yoga', time: '16:00 - 17:00', type: 'yoga' },
    { day: 4, hour: 5, title: 'Boxing', time: '16:00 - 18:00', type: 'boxing' },
    { day: 5, hour: 1, title: 'Group X', time: '06:00 - 07:30', type: 'groupx' },
    { day: 6, hour: 6, title: 'Zumba', time: '18:00 - 19:00', type: 'zumba' }
  ];

  const monthSchedule = [
    { date: 3, events: [{ time: '08:00', title: 'PT' }] },
    { date: 5, events: [{ time: '16:00', title: 'Yoga' }] },
    { date: 7, events: [{ time: '16:00', title: 'Boxing' }] },
    { date: 10, events: [{ time: '06:00', title: 'GroupX' }] },
    { date: 14, events: [{ time: '18:00', title: 'Zumba' }] },
    { date: 17, events: [{ time: '08:00', title: 'PT' }] },
    { date: 19, events: [{ time: '16:00', title: 'Yoga' }] },
    { date: 21, events: [{ time: '16:00', title: 'Boxing' }] },
    { date: 24, events: [{ time: '06:00', title: 'GroupX' }] },
    { date: 28, events: [{ time: '18:00', title: 'Zumba' }] }
  ];

  const getColorClass = (type: string) => {
    const colors: {[key: string]: string} = {
      'pt': 'bg-purple-100 text-purple-700 border-purple-300',
      'yoga': 'bg-green-100 text-green-700 border-green-300',
      'boxing': 'bg-amber-100 text-amber-700 border-amber-300',
      'groupx': 'bg-blue-100 text-blue-700 border-blue-300',
      'zumba': 'bg-pink-100 text-pink-700 border-pink-300'
    };
    return colors[type] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const hasEventOnDate = (date: number) => {
    return monthSchedule.find(s => s.date === date);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Lịch tập</h1>
            <p className="text-slate-600">Xem và quản lý lịch tập luyện</p>
          </div>
          <Link to="/dashboard/schedule/book">
            <Button
              variant="contained"
              startIcon={<Plus className="w-5 h-5" />}
              sx={{
                height: 48,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' }
              }}
            >
              Đặt lịch mới
            </Button>
          </Link>
        </div>

        {/* Calendar Card */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          {/* View Toggle & Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">
                {viewMode === 'week' ? 'Tuần 14/06 - 20/06/2024' : 'Tháng 6/2024'}
              </h2>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tháng
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'week' ? (
              <div className="h-full flex flex-col">
                {/* Week Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-sm text-slate-600 font-medium"></div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm text-slate-600 mb-1">{day}</div>
                      <div className="font-bold text-slate-900">{14 + idx}/06</div>
                    </div>
                  ))}
                </div>

                {/* Week Grid */}
                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="h-full grid grid-rows-8 gap-px bg-slate-200">
                    {hours.map((hour, hourIdx) => (
                      <div key={hour} className="grid grid-cols-8 gap-px">
                        <div className="bg-white p-2 text-sm text-slate-600 font-medium flex items-center justify-center">
                          {hour}
                        </div>
                        {weekDays.map((_, dayIdx) => {
                          const event = weekSchedule.find(
                            e => e.day === dayIdx && e.hour === hourIdx
                          );
                          return (
                            <div key={dayIdx} className="bg-white p-1 relative">
                              {event && (
                                <div className={`absolute inset-1 rounded-lg border-2 p-1.5 ${getColorClass(event.type)}`}>
                                  <p className="font-bold text-xs leading-tight">{event.title}</p>
                                  <p className="text-xs opacity-75">{event.time}</p>
                                </div>
                              )}
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
                {/* Month Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                    <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Month Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-7 grid-rows-5 gap-2 h-full">
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 2;
                      const eventData = hasEventOnDate(day);
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border-2 p-2 ${
                            day < 1 || day > 30
                              ? 'bg-slate-50 border-slate-100'
                              : eventData
                              ? 'border-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100'
                              : 'border-slate-200 hover:border-slate-300 cursor-pointer bg-white'
                          }`}
                        >
                          {day >= 1 && day <= 30 && (
                            <div className="h-full flex flex-col">
                              <div className="font-bold text-slate-900 text-sm mb-1">{day}</div>
                              {eventData && eventData.events.map((evt, idx) => (
                                <div key={idx} className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded mb-1">
                                  <div className="font-semibold">{evt.time}</div>
                                  <div className="truncate">{evt.title}</div>
                                </div>
                              ))}
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

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-slate-600">PT Cá nhân</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-slate-600">Lớp nhóm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-slate-600">Các môn khác</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
