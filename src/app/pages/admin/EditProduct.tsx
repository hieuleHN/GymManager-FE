import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface ProductFormData {
  name: string;
  price: string;
  quantity: string;
  description: string;
  importDate: string;
  expiryDate: string;
}

export function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedClub } = useClub();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      const product = data.data || data;
      reset({
        name: product.name || '',
        price: String(product.price ?? ''),
        quantity: String(product.quantity ?? ''),
        description: product.description || '',
        importDate: product.importDate ? product.importDate.split('T')[0] : '',
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : ''
      });
      if (product.image) setCurrentImage(product.image);
    } catch {
      toast.error('Không thể tải thông tin sản phẩm');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchProduct(); }, [id]);

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('price', String(Number(data.price)));
      fd.append('quantity', String(Number(data.quantity)));
      fd.append('description', data.description);
      fd.append('importDate', data.importDate);
      fd.append('expiryDate', data.expiryDate);
      if (selectedClub !== 'all') fd.append('location_id', selectedClub);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: (getAuthHeaders() as any).Authorization || '' },
        body: fd
      });
      if (res.ok) {
        toast.success('Cập nhật sản phẩm thành công!');
        navigate('/admin/products');
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa sản phẩm</h1>
          <p className="text-slate-600">Cập nhật thông tin sản phẩm</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ảnh sản phẩm
              </label>
              {currentImage && (
                <div className="mb-3">
                  <img src={`/${currentImage}`} alt="Current" className="w-24 h-24 object-cover rounded-lg border" />
                  <p className="text-xs text-slate-400 mt-1">Ảnh hiện tại</p>
                </div>
              )}
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
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {errors.price && <span className="text-red-500 text-sm mt-1">{errors.price.message}</span>}
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
                {errors.quantity && <span className="text-red-500 text-sm mt-1">{errors.quantity.message}</span>}
              </div>
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
                {errors.importDate && <span className="text-red-500 text-sm mt-1">{errors.importDate.message}</span>}
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
                {errors.expiryDate && <span className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</span>}
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
                {submitting ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
