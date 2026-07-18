import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branch?: string;
}

interface FormValues {
  title: string;
  description: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
}

const emptyForm: FormValues = {
  title: '',
  description: '',
  address: '',
  phone: '',
  openTime: '06:00',
  closeTime: '22:00',
  bankName: '',
  accountNumber: '',
  accountName: '',
  branch: '',
};

export function ClubManagement() {
  const { selectedClub, clubs } = useClub();
  const headers = getAuthHeaders();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: emptyForm,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const selectedClubData = clubs.find(c => c._id === selectedClub);

  useEffect(() => {
    if (!selectedClub || selectedClub === 'all') {
      reset(emptyForm);
      setFetchedOnce(false);
      return;
    }
    const fetchClub = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/${selectedClub}`, { headers: headers as any });
        if (!res.ok) throw new Error('Failed to fetch');
        const data: ClubData = await res.json();
        reset({
          title: data.title || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          openTime: data.openTime || '06:00',
          closeTime: data.closeTime || '22:00',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          branch: data.branch || '',
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

  const onSubmit = async (data: FormValues) => {
    if (!selectedClub || selectedClub === 'all') {
      toast.error('Vui lòng chọn một cơ sở phòng tập để cập nhật!');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/locations/${selectedClub}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify(data),
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description', { required: 'Vui lòng nhập mô tả' })}
                  rows={4}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.description ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.address && <span className="text-red-500 text-sm mt-1">{errors.address.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ mở cửa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('openTime', { required: 'Vui lòng nhập giờ mở cửa' })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.openTime ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.openTime && <span className="text-red-500 text-sm mt-1">{errors.openTime.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ đóng cửa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('closeTime', { required: 'Vui lòng nhập giờ đóng cửa' })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.closeTime ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.closeTime && <span className="text-red-500 text-sm mt-1">{errors.closeTime.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
              </div>

              <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Cấu hình Thanh toán Online</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mã Ngân hàng (VD: MB, VCB, TCB)</label>
                    <input
                      type="text"
                      {...register('bankName')}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập tên viết tắt ngân hàng..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số tài khoản</label>
                    <input
                      type="text"
                      {...register('accountNumber')}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập số tài khoản..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      {...register('accountName')}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập tên in hoa không dấu..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Chi nhánh (Không bắt buộc)</label>
                    <input
                      type="text"
                      {...register('branch')}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Chi nhánh ngân hàng..."
                    />
                  </div>
                </div>
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
