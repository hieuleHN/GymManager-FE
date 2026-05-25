import { DashboardLayout } from '../components/DashboardLayout';
import { CreditCard, Calendar, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Gói tập hiện tại',
      value: 'PREMIUM',
      icon: CreditCard,
      color: 'bg-indigo-500',
      change: 'Còn 25 ngày'
    },
    {
      name: 'Buổi đã tập tháng này',
      value: '18',
      icon: Activity,
      color: 'bg-green-500',
      change: '+12% so với tháng trước'
    },
    {
      name: 'Buổi đã tập tháng này',
      value: '18/20',
      icon: Calendar,
      color: 'bg-amber-500',
      change: 'Tỷ lệ hoàn thành: 90%'
    },
    {
      name: 'Tiến độ tháng này',
      value: '75%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: 'Đạt mục tiêu'
    }
  ];

  const upcomingClasses = [
    { name: 'Yoga Buổi Sáng', time: 'Hôm nay, 7:00 AM', trainer: 'HLV Trần Thị B', location: 'ZenFitness Quận 1' },
    { name: 'Boxing Cardio', time: 'Mai, 6:30 PM', trainer: 'HLV Lê Minh C', location: 'ZenFitness Quận 1' },
    { name: 'Pilates Core', time: 'Thứ 6, 9:00 AM', trainer: 'HLV Nguyễn Văn A', location: 'ZenFitness Quận 7' }
  ];

  const recentActivities = [
    { action: 'Hoàn thành buổi tập', detail: 'Gym - Strength Training', time: '2 giờ trước' },
    { action: 'Đặt lịch mới', detail: 'Yoga Buổi Sáng', time: '5 giờ trước' },
    { action: 'Thanh toán thành công', detail: 'Gói PREMIUM - 1 tháng', time: 'Hôm qua' },
    { action: 'Cập nhật tiến độ', detail: 'Giảm 0.5kg', time: '2 ngày trước' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Xin chào, {user?.name}! 👋
          </h1>
          <p className="text-slate-600">
            Chào mừng bạn quay trở lại. Hãy cùng xem hoạt động của bạn hôm nay.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">{stat.name}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Classes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Lịch tập sắp tới</h2>
            <div className="space-y-4">
              {upcomingClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{cls.name}</h3>
                    <p className="text-sm text-slate-600 mb-1">{cls.time}</p>
                    <p className="text-xs text-slate-500">{cls.trainer} • {cls.location}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
              Xem tất cả lịch tập
            </button>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Hoạt động gần đây</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{activity.action}</h3>
                    <p className="text-sm text-slate-600 mb-1">{activity.detail}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-2xl text-white">
          <h2 className="text-2xl font-bold mb-4">Bắt đầu tập luyện ngay hôm nay!</h2>
          <p className="text-indigo-100 mb-6">
            Đặt lịch với huấn luyện viên cá nhân hoặc tham gia các lớp học nhóm sôi động.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
              Đặt lịch HLV
            </button>
            <button className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-colors">
              Xem lớp học
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
