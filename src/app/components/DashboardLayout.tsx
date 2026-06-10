import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  CreditCard,
  History,
  Calendar,
  UserCircle,
  Package,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Bell,
  Home,
  Users,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Gói tập của tôi', href: '/dashboard/my-packages', icon: CreditCard },
    { name: 'Lịch sử giao dịch', href: '/dashboard/history', icon: History },
    { name: 'Lịch tập', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Đặt lịch / Liên hệ HLV', href: '/dashboard/trainers', icon: UserCircle },
    { name: 'Cộng đồng', href: '/dashboard/community', icon: Users },
    { name: 'Tin nhắn', href: '/dashboard/messages', icon: MessageCircle },
    { name: 'Theo dõi tiến độ', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'Dịch vụ', href: '/dashboard/services', icon: FileText },
    { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
  ];

  const notifications = [
    {
      id: 1,
      title: 'Gói tập sắp hết hạn',
      message: 'Gói PREMIUM của bạn còn 10 ngày nữa sẽ hết hạn',
      time: '2 giờ trước',
      type: 'warning'
    },
    {
      id: 2,
      title: 'Thông báo từ Admin',
      message: 'Phòng tập sẽ đóng cửa sớm vào ngày 25/12 do lễ Giáng sinh',
      time: '5 giờ trước',
      type: 'info'
    },
    {
      id: 3,
      title: 'Tin nhắn từ lễ tân',
      message: 'Vui lòng mang theo thẻ hội viên khi đến phòng tập',
      time: 'Hôm qua',
      type: 'info'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <Link to="/">
              <ImageWithFallback
                src={logo}
                alt="ZenFitness Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'}
                alt={user?.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-100"
              />
              <div>
                <h3 className="font-bold text-slate-900">{user?.name}</h3>
                <p className="text-sm text-indigo-600">Hội viên</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-72' : 'ml-0'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-bold text-slate-900">Thông báo</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          to="/dashboard"
                          onClick={() => setShowNotifications(false)}
                          className="block p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                              notif.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                                {notif.title}
                              </h4>
                              <p className="text-sm text-slate-600 mb-1">{notif.message}</p>
                              <p className="text-xs text-slate-400">{notif.time}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-3 border-t border-slate-200 text-center">
                      <Link
                        to="/dashboard/community"
                        onClick={() => setShowNotifications(false)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Xem tất cả
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
