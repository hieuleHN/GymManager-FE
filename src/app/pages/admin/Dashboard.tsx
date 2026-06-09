import { AdminLayout } from '../../components/AdminLayout';
import { Users, Dumbbell, Receipt, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { label: 'Tổng khách hàng', value: '1,234', icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Khách hàng hoạt động', value: '987', icon: Users, color: 'bg-green-500', change: '+8%' },
    { label: 'Thiết bị', value: '156', icon: Dumbbell, color: 'bg-purple-500', change: '+3' },
    { label: 'Doanh thu tháng', value: '450M', icon: Receipt, color: 'bg-indigo-500', change: '+15%' }
  ];

  const recentActivities = [
    { action: 'Đăng ký mới', customer: 'Nguyễn Văn A', time: '10 phút trước', type: 'success' },
    { action: 'Gia hạn gói tập', customer: 'Trần Thị B', time: '25 phút trước', type: 'info' },
    { action: 'Thanh toán hóa đơn', customer: 'Lê Văn C', time: '1 giờ trước', type: 'success' },
    { action: 'Hết hạn gói tập', customer: 'Phạm Thị D', time: '2 giờ trước', type: 'warning' }
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Tổng quan hệ thống quản lý ZenFitness</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Hoạt động gần đây</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">{activity.customer}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thống kê nhanh</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Khách hàng mới tháng này</span>
                <span className="text-2xl font-bold text-indigo-600">124</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Hóa đơn chưa thanh toán</span>
                <span className="text-2xl font-bold text-amber-600">15</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Sắp hết hạn (7 ngày)</span>
                <span className="text-2xl font-bold text-red-600">23</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
