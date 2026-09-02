import { DashboardLayout } from '../components/DashboardLayout';
import { CreditCard, Calendar, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth, getAuthHeaders, getApiUrl } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { name: 'Gói tập hiện tại', value: '—', icon: CreditCard, color: 'bg-indigo-500', change: 'Đang tải...' },
    { name: 'Buổi đã tập tháng này', value: '—', icon: Activity, color: 'bg-green-500', change: '' },
    { name: 'Lịch hẹn tháng này', value: '—', icon: Calendar, color: 'bg-amber-500', change: '' },
    { name: 'Tiến độ tháng này', value: '—', icon: TrendingUp, color: 'bg-purple-500', change: '' }
  ]);
  const [upcomingClasses, setUpcomingClasses] = useState<{ name: string; time: string; trainer: string; location: string }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ action: string; detail: string; time: string }[]>([]);

  useEffect(() => {
    if (!user || user.isStaff) { setLoading(false); return; }
    const load = async () => {
      try {
        const headers = getAuthHeaders() as any;
        const [pkgRes, checkinRes, bookingRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/user-packages/my`, { headers }).then(r => r.json()).catch(() => []),
          fetch(`${getApiUrl()}/api/checkin/history?limit=100`, { headers }).then(r => r.json()).catch(() => []),
          fetch(`${getApiUrl()}/api/bookings/my`, { headers }).then(r => r.json()).catch(() => [])
        ]);
        const regs: any[] = Array.isArray(pkgRes) ? pkgRes : [];
        const activeRegs = regs.filter((r: any) => ['đang hoạt động','còn 10 ngày','đang tạm ngưng'].includes(r.status) && r.payment_status === 'đã thanh toán');
        const currentPkg = activeRegs.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
        let pkgName = 'Chưa có gói';
        let pkgRemain = 'Chưa đăng ký';
        if (currentPkg) {
          pkgName = currentPkg.package_id?.name || currentPkg.name || 'Gói tập';
          const end = new Date(currentPkg.end_date);
          const diff = Math.ceil((end.getTime() - Date.now()) / (86400000));
          pkgRemain = diff > 0 ? `Còn ${diff} ngày` : 'Hết hạn';
        }
        const checkins: any[] = Array.isArray(checkinRes) ? checkinRes : (checkinRes?.data || []);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthCheckins = checkins.filter((c: any) => c.checkInTime && new Date(c.checkInTime) >= monthStart);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const lastMonthCount = checkins.filter((c: any) => c.checkInTime && new Date(c.checkInTime) >= lastMonthStart && new Date(c.checkInTime) <= lastMonthEnd).length;
        const changePct = lastMonthCount > 0 ? Math.round(((monthCheckins.length - lastMonthCount) / lastMonthCount) * 100) : 0;
        const bookings: any[] = Array.isArray(bookingRes) ? bookingRes : [];
        const monthBookings = bookings.filter((b: any) => b.date && new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear());
        const confirmed = monthBookings.filter((b: any) => b.status === 'confirmed').length;
        const totalMonthBookings = monthBookings.length;
        const progress = totalMonthBookings > 0 ? Math.round((confirmed / totalMonthBookings) * 100) : (monthCheckins.length > 0 ? Math.min(100, Math.round((monthCheckins.length / 20) * 100)) : 0);

        setStats([
          { name: 'Gói tập hiện tại', value: pkgName, icon: CreditCard, color: 'bg-indigo-500', change: pkgRemain },
          { name: 'Buổi đã tập tháng này', value: String(monthCheckins.length), icon: Activity, color: 'bg-green-500', change: lastMonthCount > 0 ? `${changePct >= 0 ? '+' : ''}${changePct}% so với tháng trước` : 'Tháng đầu tiên' },
          { name: 'Lịch hẹn tháng này', value: totalMonthBookings > 0 ? `${confirmed}/${totalMonthBookings}` : `${monthBookings.length}`, icon: Calendar, color: 'bg-amber-500', change: totalMonthBookings > 0 ? `Tỷ lệ hoàn thành: ${progress}%` : 'Chưa có lịch' },
          { name: 'Tiến độ tháng này', value: `${progress}%`, icon: TrendingUp, color: 'bg-purple-500', change: progress >= 75 ? 'Đạt mục tiêu' : progress >= 50 ? 'Đang tiến triển' : 'Cần cố gắng' }
        ]);

        const upcoming = bookings
          .filter((b: any) => b.status === 'confirmed' || b.status === 'pending')
          .filter((b: any) => new Date(b.date) >= new Date(new Date().setHours(0,0,0,0)))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)
          .map((b: any) => ({
            name: b.disciplineName || b.disciplineId?.name || 'Buổi tập',
            time: `${new Date(b.date).toLocaleDateString('vi-VN')} ${b.startTime || b.time || ''}`.trim(),
            trainer: b.trainerId?.fullName ? `HLV ${b.trainerId.fullName}` : 'HLV',
            location: b.locationId?.title || b.locationId?.address || 'ZenFitness'
          }));
        setUpcomingClasses(upcoming);

        const activities: { action: string; detail: string; time: string }[] = [];
        monthCheckins.slice(0, 2).forEach((c: any) => {
          activities.push({ action: 'Hoàn thành buổi tập', detail: c.locationId?.title || 'Gym', time: new Date(c.checkInTime).toLocaleDateString('vi-VN') });
        });
        monthBookings.slice(0, 2).forEach((b: any) => {
          activities.push({ action: b.status === 'confirmed' ? 'Lịch hẹn đã xác nhận' : 'Đặt lịch mới', detail: b.disciplineName || 'Buổi tập', time: new Date(b.createdAt || b.date).toLocaleDateString('vi-VN') });
        });
        if (currentPkg) activities.push({ action: 'Gói tập hiện tại', detail: pkgName, time: `Hạn ${new Date(currentPkg.end_date).toLocaleDateString('vi-VN')}` });
        setRecentActivities(activities.slice(0, 4));
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [user]);

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
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...</div>
            ) : upcomingClasses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Chưa có lịch tập sắp tới</p>
            ) : (
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
            )}
            <Link to="/dashboard/schedule" className="block w-full mt-4 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors text-center">
              Xem tất cả lịch tập
            </Link>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Hoạt động gần đây</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...</div>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Chưa có hoạt động nào</p>
            ) : (
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
            )}
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
