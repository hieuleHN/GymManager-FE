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
  jobPermissions?: string[];
  status?: string;
}

interface AuthContextType {
  user: User | null;
  login: (account: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (feature: string) => boolean;
  refreshUser: () => Promise<void>;
  updateAvatar: (avatar: string) => void;
}

const API_URL = '';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      if (!parsed.isStaff) {
        fetch(`${API_URL}/api/customers/my-info`, {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (!data || !data._id) return;
            const refreshed = {
              ...parsed,
              fullName: data.fullName || parsed.fullName,
              name: data.fullName || parsed.fullName || parsed.name,
              status: data.status,
              avatar: data.avatar || parsed.avatar,
              locationId: data.locationId || parsed.locationId || null
            };
            localStorage.setItem('auth_user', JSON.stringify(refreshed));
            setUser(refreshed);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
        return;
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (account: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
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
      role: data.user.role || 'member',
      token: data.token,
      isStaff: data.user.isStaff,
      isAdmin: data.user.isAdmin,
      jobId: data.user.jobId,
      locationId: data.user.locationId || null,
      avatar: data.user.avatar,
      permissions: data.user.permissions || [],
      jobPermissions: data.user.jobPermissions || [],
      status: data.user.status
    };

    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const refreshUser = async () => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) return;
    const current = JSON.parse(stored);
    if (current.isStaff) return;
    try {
      const res = await fetch(`${API_URL}/api/customers/my-info`, {
        headers: { 'Authorization': `Bearer ${current.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...current,
          fullName: data.fullName || current.fullName,
          name: data.fullName || current.fullName || current.name,
          status: data.status,
          avatar: data.avatar || current.avatar,
          locationId: data.locationId || current.locationId || null
        };
        localStorage.setItem('auth_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const updateAvatar = (avatar: string) => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) return;
    const updated = { ...JSON.parse(stored), avatar };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    setUser(updated);
  };

  const hasPermission = (feature: string): boolean => {
    if (!user) return false;
    if (!user.isStaff) return true;
    if (user.isAdmin) return true;
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(feature);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission, refreshUser, updateAvatar }}>
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

export function customerAvatarSrc(avatar?: string) {
  if (!avatar) return '';
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('/uploads/')) return avatar;
  return `${API_URL}/uploads/customers/${avatar}`;
}

export function getAuthHeaders() {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return {};
  const user = JSON.parse(stored);
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  };
  // Admin chọn phòng tập ở dropdown -> gắn header để backend lọc theo phòng tập đã chọn
  if (user.isAdmin) {
    try {
      const selectedClub = localStorage.getItem('selected_club');
      if (selectedClub && selectedClub !== 'all') {
        headers['X-Location-Id'] = selectedClub;
      }
    } catch { /* ignore */ }
  }
  return headers;
}

export function getToken(): string | null {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return null;
  const user = JSON.parse(stored);
  return user.token || null;
}
