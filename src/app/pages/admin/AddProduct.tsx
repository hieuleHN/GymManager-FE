import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface AddProductFormData {
  name: string;
  price: string;
  costPrice: string;
  quantity: string;
  description: string;
  importDate: string;
  expiryDate: string;
}

export function AddProduct() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch
  } = useForm<AddProductFormData>();

  const costPrice = Number(watch('costPrice')) || 0;
  const quantity = Number(watch('quantity')) || 0;
  const calculatedTotal = costPrice * quantity;

  const onSubmit = async () => {
    const formData = getValues();
    if (selectedClub === 'all') {
      toast.error('Vui lòng chọn cơ sở!');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('price', String(Number(formData.price)));
      fd.append('costPrice', String(Number(formData.costPrice || 0)));
      fd.append('quantity', String(Number(formData.quantity)));
      fd.append('description', formData.description);
      fd.append('importDate', formData.importDate);
      fd.append('expiryDate', formData.expiryDate);
      fd.append('location_id', selectedClub);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { Authorization: (getAuthHeaders() as any).Authorization || '' },
        body: fd
      });
      if (res.ok) {
        toast.success('Thêm sản phẩm thành công!');
        navigate('/admin/products');
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || 'Thêm sản phẩm thất bại');
      }
    } catch {
      toast.error('Thêm sản phẩm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Thêm sản phẩm</h1>
          <p className="text-slate-600">Nhập thông tin sản phẩm mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ảnh sản phẩm
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Vui lòng nhập tên sản phẩm' })}
                className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.name ? 'border-red-500' : 'border-slate-200')}
                placeholder="VD: Nước tăng lực Red Bull"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giá nhập
                </label>
                <input
                  type="number"
                  {...register('costPrice', {
                    validate: (value) => !value || Number(value) >= 0 || 'Giá nhập phải >= 0'
                  })}
                  className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.costPrice ? 'border-red-500' : 'border-slate-200')}
                  placeholder="VD: 10000"
                />
                {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('price', {
                    required: 'Vui lòng nhập đơn giá',
                    validate: (value) => Number(value) > 0 || 'Đơn giá phải lớn hơn 0'
                  })}
                  className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.price ? 'border-red-500' : 'border-slate-200')}
                  placeholder="VD: 15000"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('quantity', {
                    required: 'Vui lòng nhập số lượng',
                    validate: (value) => Number(value) > 0 || 'Số lượng phải lớn hơn 0'
                  })}
                  className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.quantity ? 'border-red-500' : 'border-slate-200')}
                  placeholder="VD: 100"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tổng tiền nhập hàng
              </label>
              <input
                type="text"
                readOnly
                value={calculatedTotal > 0 ? calculatedTotal.toLocaleString('vi-VN') + 'đ' : ''}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold"
                placeholder="Giá nhập × Số lượng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mô tả sản phẩm (không bắt buộc)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('importDate', { required: 'Vui lòng nhập ngày nhập' })}
                  className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.importDate ? 'border-red-500' : 'border-slate-200')}
                />
                {errors.importDate && <p className="text-red-500 text-sm mt-1">{errors.importDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày hết hạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('expiryDate', { required: 'Vui lòng nhập ngày hết hạn' })}
                  className={"w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (errors.expiryDate ? 'border-red-500' : 'border-slate-200')}
                />
                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/products')}
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
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
