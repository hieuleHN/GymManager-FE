import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ClubProvider } from './context/ClubContext';
import { Toaster } from 'sonner';
import { ChatWidget } from './components/ChatWidget';

export default function App() {
  return (
    <AuthProvider>
      <ClubProvider>
        <RouterProvider router={router} />
      </ClubProvider>
      <Toaster position="top-center" expand={true} richColors />
      <ChatWidget />
    </AuthProvider>
  );
}
