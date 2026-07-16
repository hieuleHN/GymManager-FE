import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, CreditCard, History, Calendar, UserCircle,
  Package, TrendingUp, Settings, LogOut, Menu, X, FileText,
  Bell, Home, Users, MessageCircle, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRightLeft, Wallet
} from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WalletBalance } from './WalletBalance';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileNotif, setProfileNotif] = useState<{ type: string; title: string; message: string } | null>(null);
  const [apiNotifications, setApiNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifPollRef = useRef<ReturnType<typeof setInterval>>();
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const updateNotifFromStatus = (status: string | undefined) => {
    if (!status || user?.isStaff) return;
    if (status === 'pending') {
      const created = localStorage.getItem('user_created_at');
      if (created) {
        const days = Math.floor((Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, 10 - days);
        if (remaining > 0 && remaining <= 5) {
          setProfileNotif({ type: 'warning', title: 'Cảnh báo', message: `Bạn còn ${remaining} ngày để cập nhật thông tin cá nhân!` });
        } else {
          setProfileNotif({ type: 'warning', title: 'Thông báo', message: 'Bạn cần nhập đầy đủ thông tin để mua gói tập' });
        }
      } else {
        setProfileNotif({ type: 'warning', title: 'Thông báo', message: 'Bạn cần nhập đầy đủ thông tin để mua gói tập' });
      }
    } else if (status === 'pending_approval') {
      setProfileNotif({ type: 'pending', title: 'Chờ xác nhận', message: 'Thông tin của bạn đang chờ nhân viên xác nhận' });
    } else if (status === 'approved') {
      setProfileNotif({ type: 'success', title: 'Xác nhận thành công', message: 'Thông tin của bạn đã được xác nhận' });
    } else if (status === 'rejected') {
      setProfileNotif({ type: 'error', title: 'Thông tin không đúng', message: 'Thông tin của bạn không được chấp nhận. Vui lòng cập nhật lại.' });
    }
  };

  useEffect(() => {
    updateNotifFromStatus(user?.status);
  }, [user?.status, user?.id]);

  useEffect(() => {
    if (user?.isStaff) return;
    if (user?.status === 'approved' || user?.status === 'locked') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      await refreshUser();
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && !user?.isStaff && !localStorage.getItem('user_created_at')) {
      fetch(`/api/customers/my-info`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.createdAt) {
            localStorage.setItem('user_created_at', data.createdAt);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && !user?.isStaff) {
      fetchNotifications();
      notifPollRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => { if (notifPollRef.current) clearInterval(notifPollRef.current); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || user.isStaff) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/notifications?recipientId=${user.id}&recipientRole=member&limit=50`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setApiNotifications(data.data || []);
      }
      const countRes = await fetch(`${getApiUrl()}/api/notifications/unread-count?recipientId=${user.id}&recipientRole=member`, {
        headers: getAuthHeaders()
      });
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  };

  const markAsRead = async (notifId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      fetchNotifications();
    } catch {}
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch(`${getApiUrl()}/api/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId: user.id, recipientRole: 'member' })
      });
      fetchNotifications();
    } catch {}
  };

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif._id);
    setShowNotifications(false);
    if (notif.type === 'booking_transferred') {
      navigate('/dashboard/schedule');
    } else if (notif.type === 'wallet_topup' || notif.type === 'wallet_payment') {
      navigate('/dashboard/history');
    } else if (notif.relatedBookingId?._id || notif.relatedBookingId) {
      const bookingId = notif.relatedBookingId._id || notif.relatedBookingId;
      navigate(`/dashboard/bookings/${bookingId}/status`);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'booking_request': return <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />;
      case 'booking_confirmed': return <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />;
      case 'booking_rejected':
      case 'booking_cancelled': return <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
      case 'transfer_requested': return <ArrowRightLeft className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />;
      case 'transfer_approved':
      case 'booking_transferred': return <ArrowRightLeft className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />;
      case 'transfer_rejected': return <ArrowRightLeft className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
      case 'wallet_topup':
      case 'wallet_payment': return <Wallet className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      default: return <Bell className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />;
    }
  };

  const handleBellClick = async () => {
    if (!user?.isStaff) await refreshUser();
    setShowNotifications(!showNotifications);
    if (!showNotifications) fetchNotifications();
  };

  const hasRedDot = (user?.status && user.status !== 'approved' && user.status !== 'locked') || unreadCount > 0;

  const menuItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Gói tập của tôi', href: '/dashboard/my-packages', icon: CreditCard },
    { name: 'Lịch sử giao dịch', href: '/dashboard/history', icon: History },
    { name: 'Lịch tập', href: '/dashboard/schedule/book', icon: Calendar },
    { name: 'Đặt lịch / Liên hệ HLV', href: '/dashboard/trainers', icon: UserCircle },
    { name: 'Cộng đồng', href: '/dashboard/community', icon: Users },
    { name: 'Tin nhắn', href: '/dashboard/messages', icon: MessageCircle },
    { name: 'Theo dõi tiến độ', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'Dịch vụ', href: '/dashboard/services', icon: FileText },
    { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user_created_at');
    if (pollRef.current) clearInterval(pollRef.current);
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-72`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <Link to="/">
              <ImageWithFallback src={logo} alt="ZenFitness Logo" className="h-16 w-auto object-contain" />
            </Link>
          </div>

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

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {isSidebarOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
            </button>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={handleBellClick}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {hasRedDot && <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {profileNotif && (
                        <Link to="/dashboard/settings"
                          onClick={() => setShowNotifications(false)}
                          className="block p-4 hover:bg-slate-50 border-b border-slate-100">
                          <div className="flex gap-3">
                            {profileNotif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
                            {profileNotif.type === 'pending' && <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                            {profileNotif.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                            {profileNotif.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm mb-1">{profileNotif.title}</h4>
                              <p className="text-sm text-slate-600">{profileNotif.message}</p>
                            </div>
                          </div>
                        </Link>
                      )}
                      {apiNotifications.map((notif) => (
                        <div key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`block p-4 hover:bg-slate-50 border-b border-slate-100 cursor-pointer ${!notif.read ? 'bg-indigo-50/50' : ''}`}>
                          <div className="flex gap-3">
                            {getNotifIcon(notif.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 text-sm mb-1">{notif.title}</h4>
                                {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                              </div>
                              <p className="text-sm text-slate-600">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString('vi-VN')} {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!profileNotif && apiNotifications.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-500">Không có thông báo</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <WalletBalance balance={(user as any)?.balance || 0} />

              <Link to="/"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                <Home className="w-4 h-4" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
