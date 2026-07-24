import MemberQR from './pages/MemberQR';
import { StaffQR } from './pages/StaffQR';
import { AttendanceScanner } from './pages/admin/AttendanceScanner';
import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { PTList } from './pages/PTList';
import { Packages } from './pages/Packages';
import { PackageDetail } from './pages/PackageDetail';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { useAuth } from './context/AuthContext';
import { ClubDetail } from './pages/ClubDetail';
import { DisciplineDetail } from './pages/DisciplineDetail';
import { PackageCheckout } from './pages/PackageCheckout';
import { Contract } from './pages/Contract';
import { Payment } from './pages/Payment';
import { MyPackages } from './pages/dashboard/MyPackages';
import { PackageUpgrade } from './pages/dashboard/PackageUpgrade';
import { TransactionHistory } from './pages/dashboard/TransactionHistory';
import { Schedule } from './pages/dashboard/Schedule';
import { BookSchedule } from './pages/dashboard/BookSchedule';
import { Trainers } from './pages/dashboard/Trainers';
import { BookTrainer } from './pages/dashboard/BookTrainer';
import { ConfirmTrainerBooking } from './pages/dashboard/ConfirmTrainerBooking';
import { TrainerDetail } from './pages/dashboard/TrainerDetail';
import { Progress } from './pages/dashboard/Progress';
import { BookingStatus } from './pages/dashboard/BookingStatus';
import { Services as MemberServices } from './pages/dashboard/Services';
import { Settings } from './pages/dashboard/Settings';
import { AdminDashboard } from './pages/admin/Dashboard';
import { CustomerList } from './pages/admin/CustomerList';
import { CustomerRegister } from './pages/admin/CustomerRegister';
import { ExpiredCustomers } from './pages/admin/ExpiredCustomers';
import { EditCustomer } from './pages/admin/EditCustomer';
import { EquipmentList } from './pages/admin/EquipmentList';
import { AddEquipment } from './pages/admin/AddEquipment';
import { EditEquipment } from './pages/admin/EditEquipment';
import { Services } from './pages/admin/Services';
import { ServiceHistory } from './pages/admin/ServiceHistory';
import { AttendanceHistory } from './pages/admin/AttendanceHistory';
import { StaffList } from './pages/admin/StaffList';
import { StaffSalary } from './pages/admin/StaffSalary';
import { StaffSalaryHistory } from './pages/admin/StaffSalaryHistory';
import { AddStaff } from './pages/admin/AddStaff';
import { StaffPermissions } from './pages/admin/StaffPermissions';
import { StaffWallet } from './pages/admin/StaffWallet';
import { StaffCheckIn } from './pages/admin/StaffCheckIn';
import { JobList } from './pages/admin/JobList';
import { AddJob } from './pages/admin/AddJob';
import { EditJob } from './pages/admin/EditJob';
import { Statistics } from './pages/admin/Statistics';
import { PackageList } from './pages/admin/PackageList';
import { AddPackage } from './pages/admin/AddPackage';
import { EditPackage } from './pages/admin/EditPackage';
import { ContractList } from './pages/admin/ContractList';
import { EditContract } from './pages/admin/EditContract';
import { EditProduct } from './pages/admin/EditProduct';
import { ProductList } from './pages/admin/ProductList';
import { AddProduct } from './pages/admin/AddProduct';
import { ProductReturns } from './pages/admin/ProductReturns';
import { ClubManagement } from './pages/admin/ClubManagement';
import { DisciplineManagement } from './pages/admin/DisciplineManagement';
import { PolicyManagement } from './pages/admin/PolicyManagement';
import { HomepageManagement } from './pages/admin/HomepageManagement';
import { PaymentManagement } from './pages/admin/PaymentManagement';
import { RecruitmentManagement } from './pages/admin/RecruitmentManagement';
import { ExpenseManagement } from './pages/admin/ExpenseManagement';
import { TrainerProfile } from './pages/admin/TrainerProfile';
import { TrainingSchedule } from './pages/admin/TrainingSchedule';
import { LockerManagement } from './pages/admin/LockerManagement';
import { ScheduleConfirmations } from './pages/admin/ScheduleConfirmations';
import { Community } from './pages/dashboard/Community';
import { Messages } from './pages/dashboard/Messages';
import { Tasks } from './pages/admin/Tasks';
import { Invoices } from './pages/admin/Invoices';
import { BookingManagement } from './pages/admin/BookingManagement';
import { PostManagement } from './pages/admin/PostManagement';
import { ArticleManagement } from './pages/admin/ArticleManagement';
import { Articles } from './pages/Articles';
import { ArticleDetail } from './pages/ArticleDetail';
import { AdminCommunity } from './pages/admin/AdminCommunity';
import { AdminMessages } from './pages/admin/AdminMessages';

// IMPORT TRANG THỐNG KÊ BIỂU ĐỒ ADMIN
import { AdminStats } from './pages/dashboard/AdminStats';
import { LockerIssues } from './pages/dashboard/LockerIssues';

// Khai báo RouteErrorBoundary dự phòng
const RouteErrorBoundary = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-950 mb-3">Đã xảy ra sự cố!</h2>
        <p className="text-slate-500 text-sm mb-6">Trang web gặp sự cố nhỏ khi tải tài nguyên hệ thống. Vui lòng thử tải lại trang.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all"
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
};

const routeFeatures: Record<string, string> = {
  '/admin/dashboard': 'statistics',
  '/admin/admin-stats': 'statistics',
  '/admin/customers': 'customers',
  '/admin/customers/:id/edit': 'customers',
  '/admin/customers/register': 'customers',
  '/admin/customers/expired': 'customers',
  '/admin/equipment': 'equipment',
  '/admin/equipment/add': 'equipment',
  '/admin/equipment/:id/edit': 'equipment',
  '/admin/packages': 'packages',
  '/admin/packages/add': 'packages',
  '/admin/packages/:id/edit': 'packages',
  '/admin/contracts': 'packages',
  '/admin/contracts/:id/edit': 'packages',
  '/admin/services': 'services',
  '/admin/services/history': 'services',
  '/admin/attendance': 'attendance',
  '/admin/attendance/history': 'attendance',
  '/admin/products': 'products',
  '/admin/products/add': 'products',
  '/admin/products/returns': 'products',
  '/admin/products/:id/edit': 'products',
  '/admin/staff': 'staff',
  '/admin/staff/salary': 'salary',
  '/admin/staff/salary-history': 'salary',
  '/admin/staff/add': 'staff',
  '/admin/staff/permissions': 'permissions',
  '/admin/jobs': 'tasks',
  '/admin/jobs/add': 'tasks',
  '/admin/jobs/:id/edit': 'tasks',
  '/admin/statistics': 'statistics',
  '/admin/clubs': 'clubs',
  '/admin/disciplines': 'clubs',
  '/admin/policies': 'services',
  '/admin/homepage': 'services',
  '/admin/payment': 'payment',
  '/admin/recruitment': 'staff',
  '/admin/expenses': 'statistics',
  '/admin/trainer-profile': 'training',
  '/admin/training-schedule': 'training',
  '/admin/lockers': 'equipment',
  '/admin/schedule-confirmations': 'schedule',
  '/admin/tasks': 'tasks',
  '/admin/bookings': 'schedule',
  '/admin/invoices': 'payment',
  '/admin/posts': 'services',
  '/admin/articles': 'services',
  '/admin/community': 'services',
  '/admin/messages': 'services'
};

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'member' | 'staff' }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const isStaff = user.isStaff === true || user.role === 'admin' || user.role === 'staff';

  if (role === 'staff' && !isStaff) return <Navigate to="/" replace />;
  if (role === 'member' && isStaff) return <Navigate to="/admin/dashboard" replace />;

  if (role === 'staff' && isStaff) {
    const path = location.pathname;
    const feature = routeFeatures[path] || Object.entries(routeFeatures).find(([key]) => {
      if (key.includes(':id')) {
        const pattern = key.replace(/:id/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(path);
      }
      return false;
    })?.[1];

    if (feature && !hasPermission(feature) && path !== '/admin/dashboard') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, Component: Home },
      { path: 'learn', Component: Learn },
      { path: 'trainers', Component: PTList },
      { path: 'packages', Component: Packages },
      { path: 'packages/:packageId', Component: PackageDetail },
      { path: 'packages/:packageId/checkout', Component: PackageCheckout },
      { path: 'contract', Component: Contract },
      { path: 'payment', Component: Payment },
      { path: 'clubs/:id', Component: ClubDetail },
      { path: 'disciplines/:id', Component: DisciplineDetail },
      { path: 'auth', Component: Auth },
      { path: 'articles', Component: Articles },
      { path: 'articles/:id', Component: ArticleDetail },
      {
        path: 'dashboard/qr',
        element: <ProtectedRoute role="member"><MemberQR /></ProtectedRoute>
      },
      {
        path: 'staff-qr',
        element: <ProtectedRoute role="staff"><StaffQR /></ProtectedRoute>
      }
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute role="member"><Dashboard /></ProtectedRoute>
  },
  {
    path: '/dashboard/my-packages',
    element: <ProtectedRoute role="member"><MyPackages /></ProtectedRoute>
  },
  {
    path: '/dashboard/upgrade/:registrationId',
    element: <ProtectedRoute role="member"><PackageUpgrade /></ProtectedRoute>
  },
  {
    path: '/dashboard/history',
    element: <ProtectedRoute role="member"><TransactionHistory /></ProtectedRoute>
  },
  {
    path: '/dashboard/schedule',
    element: <ProtectedRoute role="member"><Schedule /></ProtectedRoute>
  },
  {
    path: '/dashboard/schedule/book',
    element: <ProtectedRoute role="member"><BookSchedule /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers',
    element: <ProtectedRoute role="member"><Trainers /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers/:trainerId',
    element: <ProtectedRoute role="member"><TrainerDetail /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers/:trainerId/book',
    element: <ProtectedRoute role="member"><BookTrainer /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers/:trainerId/confirm',
    element: <ProtectedRoute role="member"><ConfirmTrainerBooking /></ProtectedRoute>
  },
  {
    path: '/dashboard/progress',
    element: <ProtectedRoute role="member"><Progress /></ProtectedRoute>
  },
  {
    path: '/dashboard/community',
    element: <ProtectedRoute role="member"><Community /></ProtectedRoute>
  },
  {
    path: '/dashboard/bookings/:bookingId/status',
    element: <ProtectedRoute role="member"><BookingStatus /></ProtectedRoute>
  },
  {
    path: '/dashboard/messages',
    element: <ProtectedRoute role="member"><Messages /></ProtectedRoute>
  },
  {
    path: '/dashboard/services',
    element: <ProtectedRoute role="member"><MemberServices /></ProtectedRoute>
  },
  {
    path: '/admin/attendance',
    element: <ProtectedRoute role="staff"><AttendanceScanner /></ProtectedRoute>
  },
  {
    path: '/dashboard/settings',
    element: <ProtectedRoute role="member"><Settings /></ProtectedRoute>
  },
  {
    path: '/dashboard/locker-issues',
    element: <ProtectedRoute role="staff"><LockerIssues /></ProtectedRoute>
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute role="staff"><AdminDashboard /></ProtectedRoute>
  },
  {
    path: '/admin/admin-stats',
    element: <Navigate to="/admin/statistics" replace />
  },
  {
    path: '/admin/customers',
    element: <ProtectedRoute role="staff"><CustomerList /></ProtectedRoute>
  },
  {
    path: '/admin/customers/:id/edit',
    element: <ProtectedRoute role="staff"><EditCustomer /></ProtectedRoute>
  },
  {
    path: '/admin/customers/register',
    element: <ProtectedRoute role="staff"><CustomerRegister /></ProtectedRoute>
  },
  {
    path: '/admin/customers/expired',
    element: <ProtectedRoute role="staff"><ExpiredCustomers /></ProtectedRoute>
  },
  {
    path: '/admin/equipment',
    element: <ProtectedRoute role="staff"><EquipmentList /></ProtectedRoute>
  },
  {
    path: '/admin/equipment/add',
    element: <ProtectedRoute role="staff"><AddEquipment /></ProtectedRoute>
  },
  {
    path: '/admin/equipment/:id/edit',
    element: <ProtectedRoute role="staff"><EditEquipment /></ProtectedRoute>
  },
  {
    path: '/admin/packages',
    element: <ProtectedRoute role="staff"><PackageList /></ProtectedRoute>
  },
  {
    path: '/admin/packages/add',
    element: <ProtectedRoute role="staff"><AddPackage /></ProtectedRoute>
  },
  {
    path: '/admin/packages/:id/edit',
    element: <ProtectedRoute role="staff"><EditPackage /></ProtectedRoute>
  },
  {
    path: '/admin/contracts',
    element: <ProtectedRoute role="staff"><ContractList /></ProtectedRoute>
  },
  {
    path: '/admin/contracts/:id/edit',
    element: <ProtectedRoute role="staff"><EditContract /></ProtectedRoute>
  },
  {
    path: '/admin/services',
    element: <ProtectedRoute role="staff"><Services /></ProtectedRoute>
  },
  {
    path: '/admin/services/history',
    element: <ProtectedRoute role="staff"><ServiceHistory /></ProtectedRoute>
  },
  {
    path: '/admin/attendance/history',
    element: <ProtectedRoute role="staff"><AttendanceHistory /></ProtectedRoute>
  },
  {
    path: '/admin/staff-attendance',
    element: <ProtectedRoute role="staff"><StaffCheckIn /></ProtectedRoute>
  },
  {
    path: '/admin/products',
    element: <ProtectedRoute role="staff"><ProductList /></ProtectedRoute>
  },
  {
    path: '/admin/products/add',
    element: <ProtectedRoute role="staff"><AddProduct /></ProtectedRoute>
  },
  {
    path: '/admin/products/:id/edit',
    element: <ProtectedRoute role="staff"><EditProduct /></ProtectedRoute>
  },
  {
    path: '/admin/products/returns',
    element: <ProtectedRoute role="staff"><ProductReturns /></ProtectedRoute>
  },
  {
    path: '/admin/staff',
    element: <ProtectedRoute role="staff"><StaffList /></ProtectedRoute>
  },
  {
    path: '/admin/staff/salary',
    element: <ProtectedRoute role="staff"><StaffSalary /></ProtectedRoute>
  },
  {
    path: '/admin/staff/salary-history',
    element: <ProtectedRoute role="staff"><StaffSalaryHistory /></ProtectedRoute>
  },
  {
    path: '/admin/staff/add',
    element: <ProtectedRoute role="staff"><AddStaff /></ProtectedRoute>
  },
  {
    path: '/admin/staff/permissions',
    element: <ProtectedRoute role="staff"><StaffPermissions /></ProtectedRoute>
  },
  {
    path: '/admin/wallet',
    element: <ProtectedRoute role="staff"><StaffWallet /></ProtectedRoute>
  },
  {
    path: '/admin/jobs',
    element: <ProtectedRoute role="staff"><JobList /></ProtectedRoute>
  },
  {
    path: '/admin/jobs/add',
    element: <ProtectedRoute role="staff"><AddJob /></ProtectedRoute>
  }, {
    path: '/admin/jobs/:id/edit',
    element: <ProtectedRoute role="staff"><EditJob /></ProtectedRoute>
  },
  {
    path: '/admin/statistics',
    element: <ProtectedRoute role="staff"><Statistics /></ProtectedRoute>
  },
  
  {
    path: '/admin/clubs',
    element: <ProtectedRoute role="staff"><ClubManagement /></ProtectedRoute>
  },
  {
    path: '/admin/disciplines',
    element: <ProtectedRoute role="staff"><DisciplineManagement /></ProtectedRoute>
  },
  {
    path: '/admin/policies',
    element: <ProtectedRoute role="staff"><PolicyManagement /></ProtectedRoute>
  },
  {
    path: '/admin/homepage',
    element: <ProtectedRoute role="staff"><HomepageManagement /></ProtectedRoute>
  },
  {
    path: '/admin/payment',
    element: <ProtectedRoute role="staff"><PaymentManagement /></ProtectedRoute>
  },
  {
    path: '/admin/recruitment',
    element: <ProtectedRoute role="staff"><RecruitmentManagement /></ProtectedRoute>
  },
  {
    path: '/admin/expenses',
    element: <ProtectedRoute role="staff"><ExpenseManagement /></ProtectedRoute>
  },
  {
    path: '/admin/trainer-profile',
    element: <ProtectedRoute role="staff"><TrainerProfile /></ProtectedRoute>
  },
  {
    path: '/admin/training-schedule',
    element: <ProtectedRoute role="staff"><TrainingSchedule /></ProtectedRoute>
  },
  {
    path: '/admin/lockers',
    element: <ProtectedRoute role="staff"><LockerManagement /></ProtectedRoute>
  },
  {
    path: '/admin/schedule-confirmations',
    element: <ProtectedRoute role="staff"><ScheduleConfirmations /></ProtectedRoute>
  },
  {
    path: '/admin/tasks',
    element: <ProtectedRoute role="staff"><Tasks /></ProtectedRoute>
  },
  {
    path: '/admin/bookings',
    element: <ProtectedRoute role="staff"><BookingManagement /></ProtectedRoute>
  },
  {
    path: '/admin/invoices',
    element: <ProtectedRoute role="staff"><Invoices /></ProtectedRoute>
  },
  {
    path: '/admin/posts',
    element: <ProtectedRoute role="staff"><PostManagement /></ProtectedRoute>
  },
  {
    path: '/admin/articles',
    element: <ProtectedRoute role="staff"><ArticleManagement /></ProtectedRoute>
  },
  {
    path: '/admin/community',
    element: <ProtectedRoute role="staff"><AdminCommunity /></ProtectedRoute>
  },
  {
    path: '/admin/messages',
    element: <ProtectedRoute role="staff"><AdminMessages /></ProtectedRoute>
  },
]);