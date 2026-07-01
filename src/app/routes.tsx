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
]);
