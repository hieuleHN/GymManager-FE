import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { User, Lock, Bell, Shield, CreditCard, Globe } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901234567',
    gender: 'male',
    birthDate: '1990-01-01',
    address: '123 Đường ABC, Quận 1, TP.HCM',
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

  const handleSave = () => {
    alert('Cập nhật thành công!');
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài đặt</h1>
          <p className="text-slate-600">Quản lý thông tin tài khoản và tùy chọn của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Thông tin cá nhân</h2>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-2">
                      <p className="text-sm text-indigo-900">
                        <span className="font-semibold">Mã hội viên của bạn là:</span> <span className="text-lg font-bold">ZF-2024-00123</span>
                      </p>
                    </div>
                    <p className="text-slate-600">Cập nhật thông tin cá nhân của bạn</p>
                  </div>

                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <div>
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: '#4f46e5',
                          '&:hover': { bgcolor: '#4338ca' },
                          textTransform: 'none',
                          borderRadius: 2,
                          mb: 1
                        }}
                      >
                        Thay đổi ảnh
                      </Button>
                      <p className="text-sm text-slate-600">JPG, PNG. Tối đa 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ngày sinh</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 4
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' },
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 4
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Bảo mật</h2>
                    <p className="text-slate-600">Quản lý mật khẩu và bảo mật tài khoản</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-slate-900">Xác thực hai yếu tố</p>
                          <p className="text-sm text-slate-600">Tăng cường bảo mật cho tài khoản của bạn</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.twoFactorAuth}
                            onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian hết phiên (phút)</label>
                        <select
                          value={formData.sessionTimeout}
                          onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="15">15 phút</option>
                          <option value="30">30 phút</option>
                          <option value="60">1 giờ</option>
                          <option value="120">2 giờ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 4
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' },
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 4
                      }}
                    >
                      Cập nhật bảo mật
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
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
                          <input
                            type="checkbox"
                            checked={formData[item.id as keyof typeof formData] as boolean}
                            onChange={(e) => handleInputChange(item.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' },
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 4
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}

              {/* Privacy, Billing, Preferences - Placeholder */}
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
