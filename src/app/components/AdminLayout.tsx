import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
  Globe,
  CreditCard,
  Briefcase as BriefcaseIcon,
  DollarSign,
  UserCircle,
  Calendar,
  Lock,
  CheckCircle,
  Shield,
  Plus,
  Building2,
  MessageCircle,
  Camera,
  Clock
} from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import { AddClubModal } from './AddClubModal';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MenuItem {
  name: string;
  icon: any;
  feature?: string;
  href?: string;
  submenu?: { name: string; href: string; feature?: string }[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const { selectedClub, setSelectedClub, clubs, setClubs } = useClub();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["customers"]);
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const clubDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [staffAvatar, setStaffAvatar] = useState('');

  const isAdminUser = user?.isAdmin === true;

  useEffect(() => {
    if (!user?.isStaff || user?.isAdmin || !user?.id) { setStaffAvatar(''); return; }
    fetch(`${getApiUrl()}/api/staff/${user.id}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setStaffAvatar(data?.avatar || ''))
      .catch(() => {});
  }, [user, location.pathname]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`${getApiUrl()}/api/staff/${user.id}`, {
          method: 'PUT',
          headers: getAuthHeaders() as any,
          body: JSON.stringify({ avatar: base64 })
        });
        if (res.ok) {
          setStaffAvatar(base64);
        } else {
          alert('Không thể cập nhật ảnh đại diện');
        }
      } catch {
        alert('Lỗi kết nối khi cập nhật ảnh');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!isAdminUser) return;
    setIsLoadingClubs(true);
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        const clubList = Array.isArray(data) ? data : data?.data || [];
        setClubs(clubList);
      })
      .catch(() => {})
      .finally(() => setIsLoadingClubs(false));
  }, [isAdminUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        clubDropdownRef.current &&
        !clubDropdownRef.current.contains(e.target as Node)
      ) {
        setClubDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allMenuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      feature: "statistics",
    },
    {
      name: "Quản lý khách hàng",
      icon: Users,
      feature: "customers",
      submenu: [
        { name: "Danh sách khách hàng", href: "/admin/customers" },
        { name: "Đăng ký khách hàng", href: "/admin/customers/register" },
        { name: "Khách hàng hết hạn", href: "/admin/customers/expired" },
      ],
    },
    {
      name: "Quản lý thiết bị",
      icon: Dumbbell,
      feature: "equipment",
      submenu: [
        { name: "Danh sách thiết bị", href: "/admin/equipment" },
        { name: "Thêm thiết bị", href: "/admin/equipment/add" },
      ],
    },
    {
      name: "Quản lý gói tập",
      icon: Package,
      feature: "packages",
      submenu: [
        { name: "Danh sách gói tập", href: "/admin/packages" },
        { name: "Thêm gói tập", href: "/admin/packages/add" },
        { name: "Danh sách chính sách", href: "/admin/contracts" },
      ],
    },
    {
      name: "Quản lý dịch vụ",
      icon: Briefcase,
      feature: "services",
      submenu: [
        { name: "Danh sách dịch vụ", href: "/admin/services" },
        { name: "Lịch sử dịch vụ", href: "/admin/services/history" },
      ],
    },
    {
      name: "Quản lý điểm danh",
      icon: ClipboardCheck,
      feature: "attendance",
      submenu: [
        { name: "Điểm danh hội viên", href: "/admin/attendance" },
        { name: "Lịch sử điểm danh", href: "/admin/attendance/history" },
      ],
    },
    { name: 'Chấm công nhân viên', href: '/admin/staff-attendance', icon: Clock, feature: 'attendance' },
    {
      name: "Quản lý sản phẩm",
      icon: ShoppingBag,
      feature: "products",
      submenu: [
        { name: "Danh sách sản phẩm", href: "/admin/products" },
        { name: "Thêm sản phẩm", href: "/admin/products/add" },
        { name: "Khách trả hàng", href: "/admin/products/returns" },
      ],
    },
    {
      name: "Quản lý bộ môn",
      href: "/admin/disciplines",
      icon: ListTodo,
      feature: "clubs",
    },
    {
      name: "Quản lý nhân viên",
      icon: UserCog,
      feature: "staff",
      submenu: [
        { name: 'Danh sách nhân viên', href: '/admin/staff' },
        { name: 'Chi tiết lương nhân viên', href: '/admin/staff/salary' },
        { name: 'Lịch sử trả lương', href: '/admin/staff/salary-history' },
        { name: 'Thêm nhân viên', href: '/admin/staff/add' },
        { name: 'Phân quyền', href: '/admin/staff/permissions' },
        { name: 'Phân công ca làm việc', href: '/admin/staff/shifts' },
      ]
    },
    {
      name: "Quản lý công việc",
      icon: ListTodo,
      feature: "tasks",
      submenu: [
        { name: "Danh sách công việc", href: "/admin/jobs" },
        { name: "Thêm công việc", href: "/admin/jobs/add" },
      ],
    },
    {
      name: "Quản lý thống kê",
      href: "/admin/statistics",
      icon: BarChart3,
      feature: "statistics",
    },
    {
      name: "Quản lý cơ sở",
      href: "/admin/clubs",
      icon: MapPin,
      feature: "clubs",
    },
    {
      name: "Quản lý chính sách",
      href: "/admin/policies",
      icon: FileText,
      feature: "services",
    },
    {
      name: "Quản lý Giao diện Website",
      href: "/admin/homepage",
      icon: Globe,
      feature: "services",
    },
    {
      name: "Quản lý thanh toán",
      href: "/admin/payment",
      icon: CreditCard,
      feature: "payment",
    },
    {
      name: "Quản lý tuyển dụng",
      href: "/admin/recruitment",
      icon: BriefcaseIcon,
      feature: "staff",
    },
    {
      name: "Quản lý chi phí",
      href: "/admin/expenses",
      icon: DollarSign,
      feature: "statistics",
    },
    {
      name: "Hồ sơ HLV",
      href: "/admin/trainer-profile",
      icon: UserCircle,
      feature: "training",
    },
    {
      name: "Lịch tập",
      href: "/admin/training-schedule",
      icon: Calendar,
      feature: "training",
    },
    { name: 'Thống kê & Báo cáo', href: '/admin/statistics', icon: BarChart3, feature: 'statistics' },
    { name: 'Quản lý cơ sở', href: '/admin/clubs', icon: MapPin, feature: 'clubs' },
    { name: 'Quản lý chính sách', href: '/admin/policies', icon: FileText, feature: 'services' },
    { name: 'Giao diện Trang chủ', href: '/admin/homepage', icon: Globe, feature: 'services' },
    { name: 'Quản lý thanh toán', href: '/admin/payment', icon: CreditCard, feature: 'payment' },
    { name: 'Quản lý tuyển dụng', href: '/admin/recruitment', icon: BriefcaseIcon, feature: 'staff' },
    { name: 'Quản lý chi phí', href: '/admin/expenses', icon: DollarSign, feature: 'statistics' },
    { name: 'Hồ sơ HLV', href: '/admin/trainer-profile', icon: UserCircle, feature: 'training' },
    { name: 'Lịch tập', href: '/admin/training-schedule', icon: Calendar, feature: 'training' },
    { name: 'Quản lý tủ đồ', href: '/admin/lockers', icon: Lock },
    { name: 'Xác nhận lịch tập', href: '/admin/schedule-confirmations', icon: CheckCircle, feature: 'schedule' },
    { name: 'Quản lý bài viết', href: '/admin/articles', icon: FileText, feature: 'services' }
  ];

  const menuItems = allMenuItems.filter((item: any) => {
    if (!user?.isStaff) return false;
    if (!item.feature) return true;
    return hasPermission(item.feature);
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((m) => m !== menuName)
        : [...prev, menuName],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-72`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <Link to="/">
              <ImageWithFallback
                src={logo}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <label className="relative group cursor-pointer" title="Đổi ảnh đại diện">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-indigo-100 overflow-hidden">
                  {staffAvatar ? (
                    <img src={staffAvatar} alt={user?.fullName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">
                      {user?.fullName?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "U"}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <div>
                <h3 className="font-bold text-slate-900">
                  {user?.fullName || user?.username}
                </h3>
                <p className="text-sm text-indigo-600">
                  {user?.role || "Nhân viên"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = "submenu" in item && item.submenu;
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
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {item
                              .submenu!.filter(
                                (sub) =>
                                  !sub.feature || hasPermission(sub.feature),
                              )
                              .map((subItem) => {
                                const isSubActive =
                                  location.pathname === subItem.href;
                                return (
                                  <li key={subItem.name}>
                                    <Link
                                      to={subItem.href}
                                      className={`block px-4 py-2.5 rounded-lg text-sm transition-all ${
                                        isSubActive
                                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                        to={item.href!}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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

      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
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
              {isAdminUser && (
                <div className="relative" ref={clubDropdownRef}>
                  <button
                    onClick={() => setClubDropdownOpen(!clubDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-sm min-w-[200px]"
                  >
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-700 truncate flex-1 text-left">
                      {isLoadingClubs
                        ? "Đang tải..."
                        : selectedClub === "all"
                          ? "Tất cả câu lạc bộ"
                          : clubs.find((c) => c._id === selectedClub)
                              ?.address || "Chọn câu lạc bộ"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                  {clubDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedClub("all");
                            setClubDropdownOpen(false);
                          }}
                        >
                          Tất cả câu lạc bộ
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        {clubs.map((club) => (
                          <button
                            key={club._id}
                            onClick={() => {
                              setSelectedClub(club._id);
                              setClubDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                              selectedClub === club._id
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-medium">{club.address}</div>
                            {club.phone && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                {club.phone}
                              </div>
                            )}
                          </button>
                        ))}
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => {
                            setShowAddClubModal(true);
                            setClubDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Thêm câu lạc bộ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
        <main className="p-6">{children}</main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
      />
    </div>
  );
}
