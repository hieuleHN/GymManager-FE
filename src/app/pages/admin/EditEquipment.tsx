import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { getAuthHeaders } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface EquipmentFormData {
  name: string;
  description: string;
  unitPrice: string;
  quantity: string;
  supplier: string;
  phone: string;
  address: string;
  purchaser: string;
  warranty_period: string;
  total: string;
}

export function EditEquipment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState('');

  const {
    register,
    handleSubmit: formHandleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EquipmentFormData>();

  const unitPrice = Number(watch('unitPrice')) || 0;
  const quantity = Number(watch('quantity')) || 0;
  const calculatedTotal = unitPrice * quantity;

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setPriceDisplay(raw ? Number(raw).toLocaleString('vi-VN') : '');
    setValue('unitPrice', raw, { shouldValidate: true });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/equipments/${id}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const item = data?.data || data;
        const price = item.unitPrice?.toString() || '';
        setPriceDisplay(price ? Number(price).toLocaleString('vi-VN') : '');
        reset({
          name: item.name || '',
          description: item.description || '',
          unitPrice: price,
          quantity: item.quantity?.toString() || '',
          warranty_period: item.warranty_period?.toString() || '12',
          total: item.total?.toString() || '',
          supplier: item.supplier || '',
          phone: item.phone || '',
          address: item.address || '',
          purchaser: item.purchaser || ''
        });
      })
      .catch(() => {
        toast.error('Tải thông tin thiết bị thất bại!');
        navigate('/admin/equipment');
      })
      .finally(() => setLoading(false));
  }, [id, reset, navigate]);

  const handleSubmit = async (data: EquipmentFormData) => {
    setSubmitting(true);
    try {
      const body: any = {
        name: data.name.trim(),
        description: data.description.trim(),
        unitPrice: parseFloat(data.unitPrice),
        quantity: parseInt(data.quantity),
        warranty_period: parseInt(data.warranty_period) || 12,
        total: calculatedTotal,
        supplier: data.supplier?.trim() || '',
        phone: data.phone?.trim() || '',
        address: data.address?.trim() || '',
        purchaser: data.purchaser?.trim() || ''
      };
      if (selectedClub !== 'all') {
        body.location_id = selectedClub;
      }

      const res = await fetch(`/api/equipments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Cập nhật thiết bị thất bại!');

      toast.success('Cập nhật thiết bị thành công!');
      navigate('/admin/equipment');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chỉnh sửa thiết bị</h1>
          <p className="text-slate-600">Cập nhật thông tin thiết bị</p>
        </div>

        <form onSubmit={formHandleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Equipment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin thiết bị</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên thiết bị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Vui lòng nhập tên thiết bị' })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name?.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Đơn giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={priceDisplay}
                    onChange={(e) => formatPriceInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.unitPrice ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <input type="hidden" {...register('unitPrice', {
                    required: 'Vui lòng nhập đơn giá',
                    validate: (value) => Number(value) > 0 || 'Đơn giá phải lớn hơn 0'
                  })} />
                  {errors.unitPrice && <span className="text-red-500 text-sm mt-1">{errors.unitPrice?.message}</span>}
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
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.quantity ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.quantity && <span className="text-red-500 text-sm mt-1">{errors.quantity?.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thời gian bảo hành (tháng)
                  </label>
                  <input
                    type="number"
                    {...register('warranty_period')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Supplier Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin nhà cung cấp</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    {...register('supplier')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Người mua
                  </label>
                  <input
                    type="text"
                    {...register('purchaser')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate('/admin/equipment')}
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
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
