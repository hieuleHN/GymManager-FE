import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ClubProvider } from './context/ClubContext';
import { ChatProvider } from './context/ChatContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../lib/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClubProvider>
          <RouterProvider router={router} />
        </ClubProvider>
        <Toaster position="top-center" expand={true} richColors />
      </AuthProvider>
    </ErrorBoundary>
  );
}