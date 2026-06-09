import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Briefcase,
  ClipboardCheck,
  Receipt,
  Bell,
  UserCog,
  ListTodo,
  BarChart3,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingBag,
  MapPin,
  FileText,
  Camera,
  Globe,
  CreditCard,
  Briefcase as BriefcaseIcon,
  DollarSign,
  UserCircle,
  Calendar,
  Star,
  MessageCircle,
  FileText as FileIcon,
  MessageSquare,
  Lock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['customers']);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedClub, setSelectedClub] = useState('all');

  // Danh sách các câu lạc bộ
  const clubs = [
    { id: 'all', name: 'Tất cả câu lạc bộ' },
    { id: 'hcm-q1', name: 'CLB Quận 1, TP.HCM' },
    { id: 'hcm-q3', name: 'CLB Quận 3, TP.HCM' },
    { id: 'hcm-q7', name: 'CLB Quận 7, TP.HCM' },
    { id: 'hn-hdong', name: 'CLB Hoàng Đạo Thúy, Hà Nội' },
    { id: 'hn-cg', name: 'CLB Cầu Giấy, Hà Nội' }
  ];

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    {
      name: 'Quản lý khách hàng',
      icon: Users,
      submenu: [
        { name: 'Danh sách khách hàng', href: '/admin/customers' },
        { name: 'Đăng ký khách hàng', href: '/admin/customers/register' },
        { name: 'Khách hàng hết hạn', href: '/admin/customers/expired' }
      ]
    },
    {
      name: 'Quản lý thiết bị',
      icon: Dumbbell,
      submenu: [
        { name: 'Danh sách thiết bị', href: '/admin/equipment' },
        { name: 'Thêm thiết bị', href: '/admin/equipment/add' }
      ]
    },
    {
      name: 'Quản lý gói tập',
      icon: Package,
      submenu: [
        { name: 'Danh sách gói tập', href: '/admin/packages' },
        { name: 'Thêm gói tập', href: '/admin/packages/add' },
        { name: 'Danh sách hợp đồng', href: '/admin/contracts' }
      ]
    },
    {
      name: 'Quản lý dịch vụ',
      icon: Briefcase,
      submenu: [
        { name: 'Danh sách dịch vụ', href: '/admin/services' },
        { name: 'Lịch sử dịch vụ', href: '/admin/services/history' }
      ]
    },
    {
      name: 'Quản lý điểm danh',
      icon: ClipboardCheck,
      submenu: [
        { name: 'Danh sách điểm danh', href: '/admin/attendance' },
        { name: 'Lịch sử điểm danh', href: '/admin/attendance/history' }
      ]
    },
    {
      name: 'Quản lý sản phẩm',
      icon: ShoppingBag,
      submenu: [
        { name: 'Danh sách sản phẩm', href: '/admin/products' },
        { name: 'Thêm sản phẩm', href: '/admin/products/add' },
        { name: 'Khách trả hàng', href: '/admin/products/returns' }
      ]
    },
    {
      name: 'Quản lý nhân viên',
      icon: UserCog,
      submenu: [
        { name: 'Danh sách nhân viên', href: '/admin/staff' },
        { name: 'Chi tiết lương nhân viên', href: '/admin/staff/salary' },
        { name: 'Lịch sử trả lương', href: '/admin/staff/salary-history' },
        { name: 'Thêm nhân viên', href: '/admin/staff/add' },
        { name: 'Phân quyền', href: '/admin/staff/permissions' }
      ]
    },
    { name: 'Quản lý công việc', href: '/admin/jobs', icon: ListTodo },
    { name: 'Quản lý thống kê', href: '/admin/statistics', icon: BarChart3 },
    { name: 'Quản lý cơ sở', href: '/admin/clubs', icon: MapPin },
    { name: 'Quản lý bộ môn', href: '/admin/disciplines', icon: Dumbbell },
    { name: 'Quản lý chính sách', href: '/admin/policies', icon: FileText },
    { name: 'Giao diện Trang chủ', href: '/admin/homepage', icon: Globe },
    { name: 'Quản lý thanh toán', href: '/admin/payment', icon: CreditCard },
    { name: 'Quản lý tuyển dụng', href: '/admin/recruitment', icon: BriefcaseIcon },
    { name: 'Quản lý chi phí', href: '/admin/expenses', icon: DollarSign },
    { name: 'Hồ sơ HLV', href: '/admin/trainer-profile', icon: UserCircle },
    { name: 'Lịch tập', href: '/admin/training-schedule', icon: Calendar },
    { name: 'Quản lý tủ đồ', href: '/admin/lockers', icon: Lock },
    { name: 'Xác nhận lịch tập', href: '/admin/schedule-confirmations', icon: CheckCircle }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
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
                <p className="text-sm text-indigo-600">Quản trị viên</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = 'submenu' in item;
                const isExpanded = expandedMenus.includes(item.name);
                const isActive = !hasSubmenu && location.pathname === item.href;

                return (
                  <li key={item.name}>
                    {hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleMenu(item.name)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {item.submenu.map((subItem) => {
                              const isSubActive = location.pathname === subItem.href;
                              return (
                                <li key={subItem.name}>
                                  <Link
                                    to={subItem.href}
                                    className={`block px-4 py-2.5 rounded-lg text-sm transition-all ${
                                      isSubActive
                                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
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
                    )}
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

            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>

              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>

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

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Camera điểm danh</h3>
              <button
                onClick={() => setShowCamera(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center">
              <p className="text-white text-center">
                Camera sẽ được khởi động ở đây
                <br />
                <span className="text-sm text-slate-400">Tính năng đang được phát triển</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
