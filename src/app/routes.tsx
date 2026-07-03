import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { PTList } from './pages/PTList';
import { Packages } from './pages/Packages';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { useAuth } from './context/AuthContext';
import { ClubDetail } from './pages/ClubDetail';
import { DisciplineDetail } from './pages/DisciplineDetail';
import { PackageCheckout } from './pages/PackageCheckout';
import { Contract } from './pages/Contract';
import { Payment } from './pages/Payment';
import { MyPackages } from './pages/dashboard/MyPackages';
import { TransactionHistory } from './pages/dashboard/TransactionHistory';
import { Schedule } from './pages/dashboard/Schedule';
import { BookSchedule } from './pages/dashboard/BookSchedule';
import { Trainers } from './pages/dashboard/Trainers';
import { BookTrainer } from './pages/dashboard/BookTrainer';
import { ConfirmTrainerBooking } from './pages/dashboard/ConfirmTrainerBooking';
import { Products } from './pages/dashboard/Products';
import { Progress } from './pages/dashboard/Progress';
import { Community } from './pages/dashboard/Community';
import { Messages } from './pages/dashboard/Messages';
import { Services } from './pages/dashboard/Services';
import { Settings } from './pages/dashboard/Settings';
import { AdminDashboard } from './pages/admin/Dashboard';
import { CustomerList } from './pages/admin/CustomerList';
import { CustomerRegister } from './pages/admin/CustomerRegister';
import { ExpiredCustomers } from './pages/admin/ExpiredCustomers';
import { EquipmentList } from './pages/admin/EquipmentList';
import { AddEquipment } from './pages/admin/AddEquipment';
import { EditEquipment } from './pages/admin/EditEquipment';
import { PackageList } from './pages/admin/PackageList';
import { AddPackage } from './pages/admin/AddPackage';
import { EditPackage } from './pages/admin/EditPackage';
import { ContractList } from './pages/admin/ContractList';
import { EditContract } from './pages/admin/EditContract';
import { Services as AdminServices } from './pages/admin/Services';
import { ServiceHistory } from './pages/admin/ServiceHistory';
import { Attendance } from './pages/admin/Attendance';
import { AttendanceHistory } from './pages/admin/AttendanceHistory';
import { AttendanceScanner } from './pages/admin/AttendanceScanner';
import { ProductList } from './pages/admin/ProductList';
import { AddProduct } from './pages/admin/AddProduct';
import { EditProduct } from './pages/admin/EditProduct';
import { ProductReturns } from './pages/admin/ProductReturns';
import { DisciplineManagement } from './pages/admin/DisciplineManagement';
import { StaffList } from './pages/admin/StaffList';
import { StaffSalary } from './pages/admin/StaffSalary';
import { StaffSalaryHistory } from './pages/admin/StaffSalaryHistory';
import { AddStaff } from './pages/admin/AddStaff';
import { StaffPermissions } from './pages/admin/StaffPermissions';
import { JobList } from './pages/admin/JobList';
import { AddJob } from './pages/admin/AddJob';
import { EditJob } from './pages/admin/EditJob';
import { Statistics } from './pages/admin/Statistics';
import { ClubManagement } from './pages/admin/ClubManagement';
import { PolicyManagement } from './pages/admin/PolicyManagement';
import { HomepageManagement } from './pages/admin/HomepageManagement';
import { PaymentManagement } from './pages/admin/PaymentManagement';
import { RecruitmentManagement } from './pages/admin/RecruitmentManagement';
import { ExpenseManagement } from './pages/admin/ExpenseManagement';
import { TrainerProfile } from './pages/admin/TrainerProfile';
import { TrainingSchedule } from './pages/admin/TrainingSchedule';
import { LockerManagement } from './pages/admin/LockerManagement';
import { ScheduleConfirmations } from './pages/admin/ScheduleConfirmations';
import { Invoices } from './pages/admin/Invoices';
import { EditCustomer } from './pages/admin/EditCustomer';
import { BookingManagement } from './pages/admin/BookingManagement';
import { PostManagement } from './pages/admin/PostManagement';
import { Tasks } from './pages/admin/Tasks';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role === 'admin' && !user.isStaff) return <Navigate to="/" replace />;
  if (role && role !== 'admin' && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'learn', Component: Learn },
      { path: 'trainers', Component: PTList },
      { path: 'packages', Component: Packages },
      { path: 'packages/:packageId/checkout', Component: PackageCheckout },
      { path: 'contract', Component: Contract },
      { path: 'payment', Component: Payment },
      { path: 'clubs/:id', Component: ClubDetail },
      { path: 'disciplines/:id', Component: DisciplineDetail },
      { path: 'auth', Component: Auth },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: '/dashboard/my-packages',
    element: <ProtectedRoute><MyPackages /></ProtectedRoute>
  },
  {
    path: '/dashboard/history',
    element: <ProtectedRoute><TransactionHistory /></ProtectedRoute>
  },
  // {
  //   path: '/dashboard/schedule',
  //   element: <ProtectedRoute><Schedule /></ProtectedRoute>
  // },
  {
    path: '/dashboard/schedule/book',
    element: <ProtectedRoute><BookSchedule /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers',
    element: <ProtectedRoute><Trainers /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers/:trainerId/book',
    element: <ProtectedRoute><BookTrainer /></ProtectedRoute>
  },
  {
    path: '/dashboard/trainers/:trainerId/confirm',
    element: <ProtectedRoute><ConfirmTrainerBooking /></ProtectedRoute>
  },
  {
    path: '/dashboard/products',
    element: <ProtectedRoute><Products /></ProtectedRoute>
  },
  {
    path: '/dashboard/progress',
    element: <ProtectedRoute><Progress /></ProtectedRoute>
  },
  {
    path: '/dashboard/community',
    element: <ProtectedRoute><Community /></ProtectedRoute>
  },
  {
    path: '/dashboard/messages',
    element: <ProtectedRoute><Messages /></ProtectedRoute>
  },
  {
    path: '/dashboard/services',
    element: <ProtectedRoute><Services /></ProtectedRoute>
  },
  {
    path: '/dashboard/settings',
    element: <ProtectedRoute><Settings /></ProtectedRoute>
  },
  {
    path: '/admin',
    element: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin/customers',
    element: <ProtectedRoute role="admin"><CustomerList /></ProtectedRoute>,
  },
  {
    path: '/admin/customers/register',
    element: <ProtectedRoute role="admin"><CustomerRegister /></ProtectedRoute>,
  },
  {
    path: '/admin/customers/expired',
    element: <ProtectedRoute role="admin"><ExpiredCustomers /></ProtectedRoute>,
  },
  {
    path: '/admin/customers/:id/edit',
    element: <ProtectedRoute role="admin"><EditCustomer /></ProtectedRoute>,
  },
  {
    path: '/admin/equipment',
    element: <ProtectedRoute role="admin"><EquipmentList /></ProtectedRoute>,
  },
  {
    path: '/admin/equipment/add',
    element: <ProtectedRoute role="admin"><AddEquipment /></ProtectedRoute>,
  },
  {
    path: '/admin/equipment/:id/edit',
    element: <ProtectedRoute role="admin"><EditEquipment /></ProtectedRoute>,
  },
  {
    path: '/admin/packages',
    element: <ProtectedRoute role="admin"><PackageList /></ProtectedRoute>,
  },
  {
    path: '/admin/packages/add',
    element: <ProtectedRoute role="admin"><AddPackage /></ProtectedRoute>,
  },
  {
    path: '/admin/packages/:id/edit',
    element: <ProtectedRoute role="admin"><EditPackage /></ProtectedRoute>,
  },
  {
    path: '/admin/contracts',
    element: <ProtectedRoute role="admin"><ContractList /></ProtectedRoute>,
  },
  {
    path: '/admin/contracts/:id/edit',
    element: <ProtectedRoute role="admin"><EditContract /></ProtectedRoute>,
  },
  {
    path: '/admin/services',
    element: <ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>,
  },
  {
    path: '/admin/services/history',
    element: <ProtectedRoute role="admin"><ServiceHistory /></ProtectedRoute>,
  },
  {
    path: '/admin/attendance',
    element: <ProtectedRoute role="admin"><Attendance /></ProtectedRoute>,
  },
  {
    path: '/admin/attendance/history',
    element: <ProtectedRoute role="admin"><AttendanceHistory /></ProtectedRoute>,
  },
  {
    path: '/admin/attendance/scanner',
    element: <ProtectedRoute role="admin"><AttendanceScanner /></ProtectedRoute>,
  },
  {
    path: '/admin/products',
    element: <ProtectedRoute role="admin"><ProductList /></ProtectedRoute>,
  },
  {
    path: '/admin/products/add',
    element: <ProtectedRoute role="admin"><AddProduct /></ProtectedRoute>,
  },
  {
    path: '/admin/products/:id/edit',
    element: <ProtectedRoute role="admin"><EditProduct /></ProtectedRoute>,
  },
  {
    path: '/admin/products/returns',
    element: <ProtectedRoute role="admin"><ProductReturns /></ProtectedRoute>,
  },
  {
    path: '/admin/disciplines',
    element: <ProtectedRoute role="admin"><DisciplineManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/staff',
    element: <ProtectedRoute role="admin"><StaffList /></ProtectedRoute>,
  },
  {
    path: '/admin/staff/add',
    element: <ProtectedRoute role="admin"><AddStaff /></ProtectedRoute>,
  },
  {
    path: '/admin/staff/salary',
    element: <ProtectedRoute role="admin"><StaffSalary /></ProtectedRoute>,
  },
  {
    path: '/admin/staff/salary-history',
    element: <ProtectedRoute role="admin"><StaffSalaryHistory /></ProtectedRoute>,
  },
  {
    path: '/admin/staff/permissions',
    element: <ProtectedRoute role="admin"><StaffPermissions /></ProtectedRoute>,
  },
  {
    path: '/admin/jobs',
    element: <ProtectedRoute role="admin"><JobList /></ProtectedRoute>,
  },
  {
    path: '/admin/jobs/add',
    element: <ProtectedRoute role="admin"><AddJob /></ProtectedRoute>,
  },
  {
    path: '/admin/jobs/:id/edit',
    element: <ProtectedRoute role="admin"><EditJob /></ProtectedRoute>,
  },
  {
    path: '/admin/statistics',
    element: <ProtectedRoute role="admin"><Statistics /></ProtectedRoute>,
  },
  {
    path: '/admin/clubs',
    element: <ProtectedRoute role="admin"><ClubManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/policies',
    element: <ProtectedRoute role="admin"><PolicyManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/homepage',
    element: <ProtectedRoute role="admin"><HomepageManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/payment',
    element: <ProtectedRoute role="admin"><PaymentManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/recruitment',
    element: <ProtectedRoute role="admin"><RecruitmentManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/expenses',
    element: <ProtectedRoute role="admin"><ExpenseManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/trainer-profile',
    element: <ProtectedRoute role="admin"><TrainerProfile /></ProtectedRoute>,
  },
  {
    path: '/admin/training-schedule',
    element: <ProtectedRoute role="admin"><TrainingSchedule /></ProtectedRoute>,
  },
  {
    path: '/admin/lockers',
    element: <ProtectedRoute role="admin"><LockerManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/schedule-confirmations',
    element: <ProtectedRoute role="admin"><ScheduleConfirmations /></ProtectedRoute>,
  },
  {
    path: '/admin/bookings',
    element: <ProtectedRoute role="admin"><BookingManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/posts',
    element: <ProtectedRoute role="admin"><PostManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/tasks',
    element: <ProtectedRoute role="admin"><Tasks /></ProtectedRoute>,
  },
  {
    path: '/admin/invoices',
    element: <ProtectedRoute role="admin"><Invoices /></ProtectedRoute>,
  },
]);
