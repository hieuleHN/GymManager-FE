import { Link, useLocation, useNavigate, Outlet } from 'react-router';
import {
  Dumbbell,
  Users,
  CreditCard,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  User as UserIcon,
  ChevronDown,
  MapPin,
  Activity,
  Instagram,
  Youtube,
  Music2
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@mui/material';

import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { clubsData, disciplinesData } from '../data';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Dumbbell },
    {
      name: 'Câu Lạc Bộ',
      href: '#',
      icon: MapPin,
      isDropdown: true,
      items: clubsData.map(c => ({ name: c.name, href: `/clubs/${c.id}` }))
    },
    {
      name: 'Bộ Môn',
      href: '#',
      icon: Activity,
      isDropdown: true,
      items: disciplinesData.map(d => ({ name: d.name, href: `/disciplines/${d.id}` }))
    },
    { name: 'Gói tập', href: '/packages', icon: CreditCard },
    { name: 'Huấn luyện viên', href: '/trainers', icon: Users },
  ];

  if (user) {
    navigation.push({ name: 'DASHBOARD HỘI VIÊN', href: '/dashboard', icon: LayoutDashboard });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <ImageWithFallback src={logo} alt="ZenFitness Logo" className="h-20 w-auto object-contain py-2" />
              </Link>
              <div className="hidden md:ml-8 lg:flex md:space-x-4 lg:space-x-6">
                {navigation.map((item) => (
                  item.isDropdown ? (
                    <div 
                      key={item.name} 
                      className="relative group flex items-center h-full"
                      onMouseEnter={() => setOpenDropdown(item.name)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-900 focus:outline-none">
                        {item.name}
                        <ChevronDown className="ml-1 w-4 h-4" />
                      </button>
                      
                      {openDropdown === item.name && (
                        <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-xl border border-slate-100 py-2 z-50">
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${
                        location.pathname === item.href
                          ? 'border-indigo-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <button className="text-slate-500 hover:text-slate-700 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {user.role === 'member' ? 'Hội viên' : (user.isStaff ? 'Nhân viên' : 'Hội viên')}
                      </p>
                    </div>
                    <img className="h-8 w-8 rounded-full ring-2 ring-indigo-100" src={user.avatar} alt="" />
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth">
                    <Button variant="text" sx={{ color: '#475569', textTransform: 'none' }}>Đăng nhập</Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}>
                      Tham gia ngay
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.isDropdown ? (
                    <>
                      <div className="flex items-center px-3 py-2 text-base font-semibold text-slate-900">
                        <item.icon className="mr-3 h-5 w-5 text-slate-500" />
                        {item.name}
                      </div>
                      <div className="pl-11 space-y-1">
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === item.href
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 mt-4 border-t border-slate-100 pt-4"
                >
                  <UserIcon className="mr-3 h-5 w-5" />
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo và giới thiệu */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ImageWithFallback src={logo} alt="ZenFitness Logo" className="h-20 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Nâng tầm hành trình thể hình của bạn với cơ sở vật chất hiện đại và đội ngũ huấn luyện viên đẳng cấp thế giới.
              </p>
            </div>

            {/* Dịch vụ */}
            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">Dịch vụ</h3>
              <ul className="space-y-2 text-sm">
                {disciplinesData.map((discipline) => (
                  <li key={discipline.id}>
                    <Link to={`/disciplines/${discipline.id}`} className="hover:text-indigo-400">
                      {discipline.name}
                    </Link>
                  </li>
                ))}
                <li><a href="#" className="hover:text-indigo-400">Stretching</a></li>
              </ul>
            </div>

            {/* Công ty */}
            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">Công ty</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-indigo-400">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-indigo-400">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-indigo-400">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-indigo-400">Liên hệ</a></li>
              </ul>
            </div>

            {/* Thông tin */}
            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">Thông tin</h3>
              <ul className="space-y-2 text-sm">
                {clubsData.slice(0, 5).map((club) => (
                  <li key={club.id}>
                    <Link to={`/clubs/${club.id}`} className="hover:text-indigo-400">
                      {club.name.replace('ZenFitness ', 'Cơ sở ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs">
            © 2026 ZENFITNESS. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}
