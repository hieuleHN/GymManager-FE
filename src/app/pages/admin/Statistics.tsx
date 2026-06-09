import { AdminLayout } from '../../components/AdminLayout';
import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, CreditCard,
  Activity, ShoppingBag, UserCheck, Calendar
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const revenueData = [
  { month: 'T1', revenue: 450, target: 400 },
  { month: 'T2', revenue: 520, target: 450 },
  { month: 'T3', revenue: 480, target: 450 },
  { month: 'T4', revenue: 590, target: 500 },
  { month: 'T5', revenue: 610, target: 550 },
  { month: 'T6', revenue: 680, target: 600 },
];

const memberGrowthData = [
  { month: 'T1', newMembers: 45, churned: 12, net: 33 },
  { month: 'T2', newMembers: 62, churned: 18, net: 44 },
  { month: 'T3', newMembers: 55, churned: 15, net: 40 },
  { month: 'T4', newMembers: 78, churned: 20, net: 58 },
  { month: 'T5', newMembers: 90, churned: 22, net: 68 },
  { month: 'T6', newMembers: 105, churned: 25, net: 80 },
];

const membershipData = [
  { name: 'Gym', value: 450, color: '#4f46e5' },
  { name: 'Yoga', value: 320, color: '#06b6d4' },
  { name: 'Boxing', value: 180, color: '#f59e0b' },
  { name: 'Pilates', value: 150, color: '#10b981' },
  { name: 'Combo', value: 200, color: '#8b5cf6' }
];

const packageSales = [
  { package: '1 tháng', sales: 120, revenue: 120 },
  { package: '3 tháng', sales: 280, revenue: 560 },
  { package: '6 tháng', sales: 350, revenue: 1050 },
  { package: '12 tháng', sales: 550, revenue: 2750 }
];

const attendanceData = [
  { day: 'T2', count: 145 },
  { day: 'T3', count: 162 },
  { day: 'T4', count: 138 },
  { day: 'T5', count: 175 },
  { day: 'T6', count: 188 },
  { day: 'T7', count: 220 },
  { day: 'CN', count: 195 },
];

const productData = [
  { name: 'Whey Protein', sales: 85, revenue: 25500000 },
  { name: 'BCAA', sales: 62, revenue: 12400000 },
  { name: 'Pre-Workout', sales: 48, revenue: 14400000 },
  { name: 'Creatine', sales: 72, revenue: 10800000 },
  { name: 'Vitamin', sales: 95, revenue: 9500000 },
];

const trainerPerformance = [
  { subject: 'Số buổi PT', A: 85, fullMark: 100 },
  { subject: 'Đánh giá KH', A: 92, fullMark: 100 },
  { subject: 'Tỷ lệ giữ chân', A: 78, fullMark: 100 },
  { subject: 'Doanh thu', A: 88, fullMark: 100 },
  { subject: 'Đúng giờ', A: 95, fullMark: 100 },
  { subject: 'Chuyên môn', A: 90, fullMark: 100 },
];

const PERIODS = ['Tuần này', 'Tháng này', 'Quý này', 'Năm nay'];

export function Statistics() {
  const [period, setPeriod] = useState('Tháng này');

  const stats = [
    { label: 'Doanh thu tháng này', value: '680M', change: '+11%', trend: 'up', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Tổng hội viên', value: '1,300', change: '+8%', trend: 'up', icon: Users, color: 'bg-blue-500' },
    { label: 'Gói tập bán ra', value: '124', change: '+12%', trend: 'up', icon: CreditCard, color: 'bg-purple-500' },
    { label: 'Tỷ lệ gia hạn', value: '78%', change: '-2%', trend: 'down', icon: TrendingUp, color: 'bg-indigo-500' },
    { label: 'Điểm danh hôm nay', value: '220', change: '+18%', trend: 'up', icon: UserCheck, color: 'bg-teal-500' },
    { label: 'Sản phẩm bán ra', value: '362', change: '+5%', trend: 'up', icon: ShoppingBag, color: 'bg-orange-500' },
    { label: 'Buổi PT hôm nay', value: '48', change: '+7%', trend: 'up', icon: Activity, color: 'bg-pink-500' },
    { label: 'HV đăng ký mới', value: '105', change: '+16%', trend: 'up', icon: Calendar, color: 'bg-cyan-500' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Quản lý thống kê</h1>
            <p className="text-slate-600">Báo cáo và phân tích dữ liệu toàn hệ thống</p>
          </div>
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.color} p-2.5 rounded-xl`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{stat.change}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Doanh thu theo tháng</h2>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">Triệu VNĐ</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v}M`, '']} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#colorRevenue)" name="Doanh thu" />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Mục tiêu" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Member Growth */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Tăng trưởng hội viên</h2>
              <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">Người</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newMembers" fill="#10b981" name="Đăng ký mới" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" fill="#f87171" name="Rời bỏ" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={2} name="Tăng ròng" dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. Membership Distribution Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Phân bố hội viên theo môn</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {membershipData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Package Sales */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Doanh số theo loại gói</h2>
              <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Số lượng & Doanh thu (M)</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={packageSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="package" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#4f46e5" name="Số lượng" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="#8b5cf6" name="DT (M)" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5. Attendance by Day of Week */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Điểm danh theo ngày trong tuần</h2>
              <span className="text-xs bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full font-medium">Lượt</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Lượt điểm danh" radius={[6, 6, 0, 0]}>
                  {attendanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count === Math.max(...attendanceData.map(d => d.count)) ? '#4f46e5' : '#c7d2fe'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 6. Trainer Performance Radar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Hiệu suất HLV trung bình</h2>
              <span className="text-xs bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full font-medium">Điểm / 100</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius={95} data={trainerPerformance}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="HLV" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Top sản phẩm bán chạy</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Sản phẩm</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Số lượng bán</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Doanh thu</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {productData.map((item, i) => {
                  const totalRevenue = productData.reduce((s, d) => s + d.revenue, 0);
                  const pct = Math.round((item.revenue / totalRevenue) * 100);
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{item.sales}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{(item.revenue / 1000000).toFixed(1)}M</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-slate-600 text-xs w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
