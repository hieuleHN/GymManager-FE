import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'guest' | 'member' | 'pt' | 'admin' | 'receptionist' | 'manager' | 'instructor';

interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    // Mock login
    setUser({
      id: '1',
      name: role === 'guest' ? 'Guest' : `User ${role.toUpperCase()}`,
      role,
      email: `${role}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
