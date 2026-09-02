import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { User, Lock, Bell, Shield, CreditCard, Globe, Camera, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth, getApiUrl, getAuthHeaders, customerAvatarSrc } from '../../context/AuthContext';

export function Settings() {
  const { user, refreshUser, updateAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nam',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    twoFactorAuth: false,
    sessionTimeout: '30',
    language: 'vi'
  });


  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (initialFetchDone.current) return;
    if (user?.id && !user?.isStaff) {
      fetch(`${getApiUrl()}/api/customers/my-info`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setFormData(prev => ({
              ...prev,
              fullName: data.fullName || '',
              gender: data.gender || 'Nam',
              phone: data.phone || '',
              email: data.email || '',
              address: data.address || '',
              idNumber: data.idNumber || ''
            }));

          }
        })
        .catch(() => {})
        .finally(() => { initialFetchDone.current = true; setFetching(false); });
    } else {
      setFetching(false);
      initialFetchDone.current = true;
    }
  }, [user?.id]);

  const tabs = [
    { id: 'profile', name: 'Thông tin cá nhân', icon: User },
    { id: 'security', name: 'Bảo mật', icon: Lock },
    { id: 'notifications', name: 'Thông báo', icon: Bell },
    { id: 'privacy', name: 'Quyền riêng tư', icon: Shield },
    { id: 'billing', name: 'Thanh toán', icon: CreditCard },
    { id: 'preferences', name: 'Tùy chọn', icon: Globe }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    if (!formData.fullName || !formData.phone || !formData.email) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và email!');
      return;
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('fullName', formData.fullName);
      form.append('gender', formData.gender);
      form.append('phone', formData.phone);
      form.append('email', formData.email);
      form.append('address', formData.address);
      form.append('idNumber', formData.idNumber);

      const res = await fetch(`${getApiUrl()}/api/customers/submit-info`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật!');
      setSuccess('Gửi thông tin thành công! Vui lòng chờ nhân viên xác nhận.');
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError('');
    setSuccess('');
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(`${getApiUrl()}/api/customers/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật ảnh đại diện!');
      updateAvatar(data.avatar || '');
      setSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveSecurity = async () => {
    setError('');
    setSuccess('');
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận!');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu mới không khớp!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/change-password`, {
        method: 'POST',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đổi mật khẩu!');
      setSuccess('Đổi mật khẩu thành công!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = () => {
    if (!user?.status) return null;
    const badges: Record<string, { label: string; class: string }> = {
      pending: { label: 'Chưa điền thông tin', class: 'bg-gray-100 text-gray-700' },
      pending_approval: { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Đã xác nhận', class: 'bg-green-100 text-green-700' },
      rejected: { label: 'Thông tin không đúng', class: 'bg-red-100 text-red-700' },
      locked: { label: 'Đã khóa', class: 'bg-red-100 text-red-700' },
    };
    const b = badges[user.status];
    return b ? <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${b.class}`}>{b.label}</span> : null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài đặt</h1>
          <p className="text-slate-600">Quản lý thông tin tài khoản và tùy chọn của bạn</p>
        </div>

        {user?.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">Thông tin của bạn đã được xác nhận thành công!</p>
          </div>
        )}

        {user?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">Thông tin của bạn không đúng. Vui lòng cập nhật lại thông tin!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Thông tin cá nhân</h2>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-slate-500">Trạng thái:</span>
                      {statusBadge()}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-slate-500">Mã hội viên:</span>
                      <span className="text-sm font-semibold text-slate-900">{user?.username || 'Chưa có'}</span>
                    </div>
                    <p className="text-slate-600">Cập nhật thông tin cá nhân và gửi cho nhân viên xác nhận</p>
                  </div>

                  {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
                  {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{success}</div>}

                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                    <div className="relative group">
                      <img
                        src={customerAvatarSrc(user?.avatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex cursor-pointer">
                        <Button variant="contained" component="span" disabled={uploadingAvatar}
                          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, mb: 1 }}>
                          {uploadingAvatar ? 'Đang tải...' : 'Thay đổi ảnh'}
                        </Button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <p className="text-sm text-slate-600">JPG, PNG. Tối đa 5MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
                      <select value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                      <input type="tel" value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Số căn cước</label>
                      <input type="text" value={formData.idNumber}
                        onChange={(e) => handleInputChange('idNumber', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="001234567890" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                      <input type="text" value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button variant="outlined"
                      sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                      Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSaveProfile} disabled={loading}
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                      {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Bảo mật</h2>
                    <p className="text-slate-600">Quản lý mật khẩu và bảo mật tài khoản</p>
                  </div>

                  {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
                  {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{success}</div>}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                      <input type="password" value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                      <input type="password" value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                      <input type="password" value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-slate-900">Xác thực hai yếu tố</p>
                          <p className="text-sm text-slate-600">Tăng cường bảo mật cho tài khoản của bạn</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.twoFactorAuth}
                            onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian hết phiên (phút)</label>
                        <select value={formData.sessionTimeout}
                          onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="15">15 phút</option>
                          <option value="30">30 phút</option>
                          <option value="60">1 giờ</option>
                          <option value="120">2 giờ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button variant="outlined"
                      sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                      Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSaveSecurity} disabled={loading}
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                      {loading ? 'Đang xử lý...' : 'Cập nhật bảo mật'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Thông báo</h2>
                    <p className="text-slate-600">Quản lý cách bạn nhận thông báo</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: 'emailNotifications', label: 'Thông báo qua Email', desc: 'Nhận thông báo về lịch tập, gói tập và tin tức' },
                      { id: 'pushNotifications', label: 'Thông báo đẩy', desc: 'Nhận thông báo trên thiết bị di động' },
                      { id: 'smsNotifications', label: 'Thông báo SMS', desc: 'Nhận tin nhắn SMS về lịch hẹn quan trọng' },
                      { id: 'marketingEmails', label: 'Email marketing', desc: 'Nhận thông tin về chương trình khuyến mãi và sự kiện' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-600">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData[item.id as keyof typeof formData] as boolean}
                            onChange={(e) => handleInputChange(item.id, e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button variant="contained" onClick={() => alert('Cập nhật thành công!')}
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}

              {(activeTab === 'privacy' || activeTab === 'billing' || activeTab === 'preferences') && (
                <div className="text-center py-12">
                  <p className="text-slate-600">Tính năng này đang được phát triển</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
