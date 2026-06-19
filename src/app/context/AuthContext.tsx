import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  fullName?: string;
  name: string;
  role: string;
  token: string;
  isStaff: boolean;
  isAdmin?: boolean;
  jobId?: string;
  locationId?: string | null;
  avatar?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (role: 'member' | 'staff', account: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (feature: string) => boolean;
}

const API_URL = '';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (role: 'member' | 'staff', account: string, password: string) => {
    const endpoint = role === 'staff'
      ? `${API_URL}/api/staff/login`
      : `${API_URL}/api/customers/login`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập thất bại!');
    }

    const fullName = data.user.fullName || data.user.username || data.user.account || 'User';
    const userData: User = {
      id: data.user.id,
      username: data.user.username || data.user.account,
      fullName,
      name: fullName,
      role: data.user.role || role,
      token: data.token,
      isStaff: data.user.isStaff,
      isAdmin: data.user.isAdmin,
      jobId: data.user.jobId,
      locationId: data.user.locationId || null,
      avatar: data.user.avatar,
      permissions: data.user.permissions || []
    };

    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const hasPermission = (feature: string): boolean => {
    if (!user) return false;
    if (!user.isStaff) return true; // Members can access member features
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(feature);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
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

export function getApiUrl() {
  return API_URL;
}

export function getAuthHeaders() {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return {};
  const user = JSON.parse(stored);
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  };
}