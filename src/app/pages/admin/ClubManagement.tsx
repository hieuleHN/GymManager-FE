import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClubData {
  _id: string;
  title: string;
  description: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  images?: { url: string; description: string }[];
}

const emptyForm = {
  title: '',
  description: '',
  address: '',
  phone: '',
  openTime: '06:00',
  closeTime: '22:00',
};

export function ClubManagement() {
  const { selectedClub, clubs } = useClub();
  const headers = getAuthHeaders();

  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedClubData = clubs.find(c => c._id === selectedClub);

  useEffect(() => {
    if (!selectedClub || selectedClub === 'all') {
      setFormData(emptyForm);
      setFetchedOnce(false);
      return;
    }
    const fetchClub = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/${selectedClub}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch');
        const data: ClubData = await res.json();
        setFormData({
          title: data.title || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          openTime: data.openTime || '06:00',
          closeTime: data.closeTime || '22:00',
        });
        setFetchedOnce(true);
      } catch {
        toast.error('Không thể tải thông tin cơ sở');
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [selectedClub]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: string) => {
    if (!formData[field as keyof typeof formData].trim()) {
      setErrors((prev) => ({ ...prev, [field]: 'Trường này không được để trống' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || selectedClub === 'all') {
      toast.error('Vui lòng chọn một cơ sở phòng tập để cập nhật!');
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/locations/${selectedClub}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Cập nhật thông tin cơ sở thành công!');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý cơ sở phòng tập</h1>
          <p className="text-slate-600">
            {selectedClub === 'all'
              ? 'Vui lòng chọn một cơ sở từ dropdown phía trên để chỉnh sửa'
              : `Cập nhật thông tin: ${selectedClubData?.address || 'Đang tải...'}`
            }
          </p>
        </div>

        {selectedClub === 'all' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
            <p className="text-lg font-medium">Chọn một cơ sở phòng tập từ dropdown góc phải trên cùng để bắt đầu chỉnh sửa</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : !fetchedOnce ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
            <p>Không tìm thấy dữ liệu cơ sở</p>
          </div>
        ) : (
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
                  onBlur={() => handleBlur('title')}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
                  onBlur={() => handleBlur('address')}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
                  onBlur={() => handleBlur('phone')}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
