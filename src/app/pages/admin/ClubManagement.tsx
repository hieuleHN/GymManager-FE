import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';

export function ClubManagement() {
  const [formData, setFormData] = useState({
    title: 'ZenFitness - Hệ thống phòng tập hàng đầu',
    description: 'Chúng tôi cam kết mang đến trải nghiệm tập luyện tốt nhất với trang thiết bị hiện đại và đội ngũ huấn luyện viên chuyên nghiệp.',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    openTime: '06:00',
    closeTime: '22:00',
    phone: '0901234567'
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cập nhật thông tin câu lạc bộ thành công!');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý cơ sở phòng tập</h1>
          <p className="text-slate-600">Cập nhật thông tin câu lạc bộ</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giờ mở cửa <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.openTime}
                  onChange={(e) => handleChange('openTime', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giờ đóng cửa <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.closeTime}
                  onChange={(e) => handleChange('closeTime', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Cập nhật thông tin
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
