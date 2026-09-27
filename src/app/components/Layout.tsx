import { Link, useLocation, useNavigate, Outlet } from "react-router";
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
  QrCode,
  Calendar,
  Check,
  FileText,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth, getApiUrl, getAuthHeaders } from "../context/AuthContext";
import { Button } from "@mui/material";

import logo from "../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { WalletBalance } from "./WalletBalance";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // UI States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ─── ĐỒNG BỘ DỮ LIỆU ĐỘNG (API) ───
  const [clubs, setClubs] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);

  useEffect(() => {
    // 1. Lấy danh sách Câu lạc bộ (Cơ sở)
    fetch(`${getApiUrl()}/api/locations`)
      .then((res) => res.json())
      .then((data) => {
        const clubList = Array.isArray(data) ? data : data?.data || [];
        setClubs(clubList);
      })
      .catch((err) => console.error("Lỗi lấy danh sách CLB:", err));

    // 2. Lấy danh sách Bộ môn
    fetch(`${getApiUrl()}/api/disciplines?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        const discList = Array.isArray(data) ? data : data?.data || [];
        setDisciplines(discList);
      })
      .catch((err) => console.error("Lỗi lấy danh sách Bộ môn:", err));
  }, []);

  // ─── XỬ LÝ THÔNG BÁO ───
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const role = user.role === "member" ? "member" : "staff";
      const res = await fetch(
        `${getApiUrl()}/api/notifications?recipientId=${user.id}&recipientRole=${role}&limit=10`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch { }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const role = user.role === "member" ? "member" : "staff";
      const res = await fetch(
        `${getApiUrl()}/api/notifications/unread-count?recipientId=${user.id}&recipientRole=${role}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch { }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch(`${getApiUrl()}/api/notifications/${notif._id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
    } catch { }
    setShowNotifications(false);
    if (notif.type === "booking_transferred") {
      navigate("/dashboard/schedule");
    } else if (
      notif.type === "wallet_topup" ||
      notif.type === "wallet_payment"
    ) {
      navigate("/dashboard/history");
    } else if (notif.relatedBookingId?._id || notif.relatedBookingId) {
      const bookingId = notif.relatedBookingId._id || notif.relatedBookingId;
      navigate(`/dashboard/bookings/${bookingId}/status`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const role = user.role === "member" ? "member" : "staff";
      await fetch(`${getApiUrl()}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          ...(getAuthHeaders() as any),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: user.id, recipientRole: role }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "booking_confirmed":
        return <Check className="w-4 h-4 text-green-500" />;
      case "booking_rejected":
      case "booking_cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "booking_request":
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case "wallet_topup":
      case "wallet_payment":
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  // ─── CẤU HÌNH MENU NAVBAR ───
  const navigation = [
    { name: "Trang chủ", href: "/", icon: Dumbbell },
    {
      name: "Câu Lạc Bộ",
      href: "#",
      icon: MapPin,
      isDropdown: true,
      items:
        clubs.length > 0
          ? clubs.map((c) => ({
            name: c.name || c.address,
            href: `/clubs/${c._id}`,
          }))
          : [{ name: "Đang cập nhật...", href: "#" }],
    },
    {
      name: "Bộ Môn",
      href: "#",
      icon: Activity,
      isDropdown: true,
      items:
        disciplines.length > 0
          ? disciplines.map((d) => ({
            name: d.name,
            href: `/disciplines/${d._id}`,
          }))
          : [{ name: "Đang cập nhật...", href: "#" }],
    },
    { name: "Gói tập", href: "/packages", icon: CreditCard },
    { name: "Huấn luyện viên", href: "/trainers", icon: Users },
    { name: "Bài viết", href: "/articles", icon: FileText },
  ];

  if (user) {
    navigation.push({
      name: "DASHBOARD HỘI VIÊN",
      href: "/dashboard",
      icon: LayoutDashboard,
    });
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <ImageWithFallback
                  src={logo}
                  alt="ZenFitness Logo"
                  className="h-20 w-auto object-contain py-2"
                />
              </Link>

              {/* Menu Desktop */}
              <div className="hidden md:ml-8 lg:flex md:space-x-4 lg:space-x-6">
                {navigation.map((item) =>
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
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${location.pathname === item.href
                          ? "border-indigo-500 text-slate-900 font-semibold"
                          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        }`}
                    >
                      {item.name}
                    </Link>
                  ),
                )}
              </div>
            </div>

            {/* Cụm chức năng Avatar / Login bên tay phải */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div
                  className="flex items-center gap-4 relative"
                  ref={notifRef}
                >
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) fetchNotifications();
                    }}
                    className="text-slate-500 hover:text-slate-700 relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 block min-w-[18px] h-[18px] rounded-full bg-red-500 ring-2 ring-white text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-[500px] flex flex-col">
                      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                        <h3 className="font-bold text-slate-900">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            Không có thông báo
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-left p-4 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${!notif.read ? "bg-indigo-50/50" : ""
                                }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${!notif.read
                                      ? "font-semibold text-slate-900"
                                      : "text-slate-700"
                                    }`}
                                >
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <WalletBalance balance={(user as any)?.balance || 0} />
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {user.role === "member"
                          ? "Hội viên"
                          : user.isStaff
                            ? "Nhân viên"
                            : "Hội viên"}
                      </p>
                    </div>
                    <img
                      className="h-8 w-8 rounded-full ring-2 ring-indigo-100"
                      src={user.avatar}
                      alt=""
                    />
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth">
                    <Button
                      variant="text"
                      sx={{ color: "#475569", textTransform: "none" }}
                    >
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: "#4f46e5",
                        "&:hover": { bgcolor: "#4338ca" },
                        textTransform: "none",
                      }}
                    >
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
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
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
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${location.pathname === item.href
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ImageWithFallback
                  src={logo}
                  alt="ZenFitness Logo"
                  className="h-20 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Nâng tầm hành trình thể hình của bạn với cơ sở vật chất hiện đại
                và đội ngũ huấn luyện viên đẳng cấp thế giới.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">
                Dịch vụ
              </h3>
              <ul className="space-y-2 text-sm">
                {disciplines.slice(0, 5).map((discipline) => (
                  <li key={discipline._id}>
                    <Link
                      to={`/disciplines/${discipline._id}`}
                      className="hover:text-indigo-400"
                    >
                      {discipline.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="#" className="hover:text-indigo-400">
                    Stretching
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">
                Công ty
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-indigo-400">
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <Link
                    to="/policies"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link
                    to="/recruitment"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-indigo-400">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 uppercase">
                Thông tin
              </h3>
              <ul className="space-y-2 text-sm">
                {clubs.slice(0, 5).map((club) => (
                  <li key={club._id}>
                    <Link
                      to={`/clubs/${club._id}`}
                      className="hover:text-indigo-400"
                    >
                      {(club.name || club.address).replace(
                        "ZenFitness ",
                        "Cơ sở ",
                      )}
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
