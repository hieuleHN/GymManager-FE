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
<<<<<<< Updated upstream
=======
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
import { BookingManagement } from './pages/admin/BookingManagement';
>>>>>>> Stashed changes
import { Community } from './pages/dashboard/Community';
import { Messages } from './pages/dashboard/Messages';
import { Services } from './pages/dashboard/Services';
import { Settings } from './pages/dashboard/Settings';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" replace />;
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
  {
    path: '/dashboard/schedule',
    element: <ProtectedRoute><Schedule /></ProtectedRoute>
  },
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
<<<<<<< Updated upstream
]);
=======
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute role="staff"><AdminDashboard /></ProtectedRoute>
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
    path: '/admin/bookings',
    element: <ProtectedRoute role="staff"><BookingManagement /></ProtectedRoute>
  },
  {
    path: '/admin/tasks',
    element: <ProtectedRoute role="staff"><Tasks /></ProtectedRoute>
  },
]);
>>>>>>> Stashed changes
