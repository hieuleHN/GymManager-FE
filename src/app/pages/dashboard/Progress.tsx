import { DashboardLayout } from '../../components/DashboardLayout';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

export function Progress() {
  const stats = [
    { label: 'Buổi đã tập', value: '18', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Buổi bỏ lỡ', value: '5', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Tỷ lệ hoàn thành', value: '78%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cân nặng hiện tại', value: '72 kg', color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const trainingHistory = [
    { week: 'Tuần 1', days: [true, true, true, false, true, false, false] },
    { week: 'Tuần 2', days: [true, true, true, true, false, true, false] },
    { week: 'Tuần 3', days: [false, true, true, true, true, false, false] },
    { week: 'Tuần 4', days: [true, false, true, true, false, true, true] },
    { week: 'Tuần 5', days: [null, null, null, null, null, null, null] }
  ];

  const bodyMetrics = [
    { label: 'Cân nặng', value: '72 kg' },
    { label: 'Mỡ cơ thể', value: '18%' },
    { label: 'BMI', value: '22.5' },
    { label: 'Calo', value: '1650 kcal' }
  ];

  const progressMetrics = [
    { label: 'Cân nặng', value: '+2.5kg', trend: 'up', change: 'so với tháng trước', color: 'text-green-600' },
    { label: 'Số buổi tập', value: '+15%', trend: 'up', change: 'so với tháng trước', color: 'text-green-600' },
    { label: 'Mỡ cơ thể', value: '+20%', trend: 'up', change: 'so với tháng trước', color: 'text-green-600' },
    { label: 'Mỡ cơ thể', value: '-2%', trend: 'down', change: 'so với tháng trước', color: 'text-red-600' }
  ];

  const trainerFeedback = "Tiến độ tập luyện của bạn rất tốt! Cân nặng tăng đều đặn và khối lượng cơ bắp phát triển rõ rệt. Hãy tiếp tục duy trì chế độ dinh dưỡng và tập luyện như hiện tại. Trong tuần tới, chúng ta sẽ tăng cường độ để phát triển sức mạnh thêm.";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Theo dõi tiến độ</h1>
          <p className="text-slate-600">Theo dõi hành trình tập luyện của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Lịch sử tập luyện</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-8 gap-2 text-center text-sm font-semibold text-slate-600 mb-2">
                <div></div>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                  <div key={idx}>{day}</div>
                ))}
              </div>

              {trainingHistory.map((week, idx) => (
                <div key={idx} className="grid grid-cols-8 gap-2">
                  <div className="text-sm text-slate-600 font-medium flex items-center">
                    {week.week}
                  </div>
                  {week.days.map((status, dayIdx) => (
                    <div key={dayIdx} className="flex items-center justify-center">
                      {status === null ? (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-50"></div>
                      ) : status ? (
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex gap-6 text-sm pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-slate-600">Đã tập</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-slate-600">Bỏ lỡ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-50"></div>
                  <span className="text-slate-600">Sắp tới</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Metrics */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Chỉ số cơ thể</h3>

            <div className="space-y-4">
              {bodyMetrics.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{metric.label}</span>
                  <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trainer Feedback */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 text-white rounded-full p-3">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2">Đánh giá từ Huấn luyện viên</h3>
              <p className="text-slate-700 leading-relaxed">{trainerFeedback}</p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div>
          <h3 className="font-bold text-slate-900 mb-4">Thống kê tiến độ</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {progressMetrics.map((metric, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-2">
                  {metric.trend === 'up' ? (
                    <TrendingUp className={`w-5 h-5 ${metric.color}`} />
                  ) : (
                    <TrendingDown className={`w-5 h-5 ${metric.color}`} />
                  )}
                  <span className="text-sm text-slate-600">{metric.label}</span>
                </div>
                <p className={`text-3xl font-bold ${metric.color} mb-1`}>{metric.value}</p>
                <p className="text-xs text-slate-500">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
