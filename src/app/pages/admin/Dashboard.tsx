import { AdminLayout } from '../../components/AdminLayout';
import { Users, Dumbbell, Receipt, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

export function AdminDashboard() {
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Tổng khách hàng', value: '—', icon: Users, color: 'bg-blue-500', change: '' },
    { label: 'Khách hàng hoạt động', value: '—', icon: Users, color: 'bg-green-500', change: '' },
    { label: 'Thiết bị', value: '—', icon: Dumbbell, color: 'bg-purple-500', change: '' },
    { label: 'Doanh thu tháng', value: '—', icon: Receipt, color: 'bg-indigo-500', change: '' }
  ]);
  const [recentActivities, setRecentActivities] = useState<{ action: string; customer: string; time: string; type: string }[]>([]);
  const [quickStats, setQuickStats] = useState({ newThisMonth: 0, unpaid: 0, expiring: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders() as any;
        const locParam = selectedClub && selectedClub !== 'all' ? `?locationId=${selectedClub}` : '';
        const locParam2 = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
        const [kpiRes, equipRes, dashRes, expiringRes, unpaidRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/customers/kpi${locParam}`, { headers }).then(r => r.json()).catch(() => null),
          fetch(`${getApiUrl()}/api/equipments?page=1&limit=1${locParam2 ? locParam2 : ''}`, { headers }).then(r => r.json()).catch(() => null),
          fetch(`${getApiUrl()}/api/dashboard/admin-stats?period=month${locParam2}`, { headers }).then(r => r.json()).catch(() => null),
          fetch(`${getApiUrl()}/api/customers/alerts${locParam}`, { headers }).then(r => r.json()).catch(() => null),
          fetch(`${getApiUrl()}/api/user-packages/all?page=1&limit=100&payment_status=chờ thanh toán`, { headers }).then(r => r.json()).catch(() => null)
        ]);
        const totalCustomers = kpiRes?.totalMembers ?? kpiRes?.total ?? 0;
        const activeCustomers = kpiRes?.activeMembers ?? 0;
        const newThisMonth = kpiRes?.newThisMonth ?? dashRes?.summary?.totalNewCustomers ?? 0;
        const equipTotal = equipRes?.total ?? equipRes?.data?.length ?? 0;
        let revenue = 0;
        try {
          const finRes = await fetch(`${getApiUrl()}/api/statistics/finance?period=month${locParam2}`, { headers }).then(r => r.json()).catch(() => null);
          revenue = finRes?.totalRevenue ?? finRes?.revenue ?? dashRes?.summary?.totalBookings ? dashRes.summary.totalBookings * 500000 : 0;
        } catch {}
        const expiring = expiringRes?.expiring_soon?.length ?? expiringRes?.length ?? 0;
        const unpaid = unpaidRes?.total ?? unpaidRes?.data?.length ?? 0;

        setStats([
          { label: 'Tổng khách hàng', value: totalCustomers ? totalCustomers.toLocaleString('vi-VN') : '0', icon: Users, color: 'bg-blue-500', change: newThisMonth ? `+${newThisMonth} mới` : '' },
          { label: 'Khách hàng hoạt động', value: activeCustomers ? activeCustomers.toLocaleString('vi-VN') : '0', icon: Users, color: 'bg-green-500', change: '' },
          { label: 'Thiết bị', value: equipTotal ? String(equipTotal) : '0', icon: Dumbbell, color: 'bg-purple-500', change: '' },
          { label: 'Doanh thu tháng', value: revenue ? `${(revenue/1000000).toFixed(1)}M` : '0', icon: Receipt, color: 'bg-indigo-500', change: '' }
        ]);
        setQuickStats({ newThisMonth, unpaid, expiring });

        const activities: typeof recentActivities = [];
        if (expiringRes?.expiring_soon) {
          expiringRes.expiring_soon.slice(0, 2).forEach((e: any) => {
            activities.push({ action: 'Sắp hết hạn', customer: e.customer?.fullName || e.customer?.account || 'Hội viên', time: '7 ngày tới', type: 'warning' });
          });
        }
        try {
          const recentRes = await fetch(`${getApiUrl()}/api/customers?page=1&limit=5${locParam2}`, { headers }).then(r => r.json()).catch(() => null);
          const list = recentRes?.data || [];
          list.slice(0, 2).forEach((c: any) => {
            activities.push({ action: 'Đăng ký mới', customer: c.fullName || c.account, time: new Date(c.createdAt).toLocaleDateString('vi-VN'), type: 'success' });
          });
        } catch {}
        if (unpaid > 0) activities.push({ action: 'Hóa đơn chưa thanh toán', customer: `${unpaid} đơn`, time: 'Hiện tại', type: 'info' });
        setRecentActivities(activities.slice(0, 4));
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [selectedClub]);

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
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...</div>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Chưa có hoạt động gần đây</p>
            ) : (
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
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thống kê nhanh</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Khách hàng mới tháng này</span>
                  <span className="text-2xl font-bold text-indigo-600">{quickStats.newThisMonth}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Hóa đơn chưa thanh toán</span>
                  <span className="text-2xl font-bold text-amber-600">{quickStats.unpaid}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Sắp hết hạn (7 ngày)</span>
                  <span className="text-2xl font-bold text-red-600">{quickStats.expiring}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
