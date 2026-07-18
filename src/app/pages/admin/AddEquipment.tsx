import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
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

export function AddEquipment() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<EquipmentFormData>({
    defaultValues: {
      name: '',
      description: '',
      unitPrice: '',
      quantity: '',
      supplier: '',
      phone: '',
      address: '',
      purchaser: '',
      warranty_period: '12',
      total: ''
    }
  });

  const onSubmit = async (data: EquipmentFormData) => {
    setSubmitting(true);
    try {
      const body: any = {
        name: data.name.trim(),
        description: data.description.trim(),
        unitPrice: parseFloat(data.unitPrice),
        quantity: parseInt(data.quantity),
        supplier: data.supplier.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        purchaser: data.purchaser.trim(),
        warranty_period: parseInt(data.warranty_period) || 12
      };
      if (data.total) {
        body.total = parseFloat(data.total);
      }
      if (selectedClub !== 'all') {
        body.location_id = selectedClub;
      }

      const res = await fetch('/api/equipments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Thêm thiết bị thất bại!');

      toast.success('Thêm thiết bị thành công!');
      navigate('/admin/equipment');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Thêm thiết bị</h1>
          <p className="text-slate-600">Thêm thiết bị mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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
                  {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
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
                    type="number"
                    {...register('unitPrice', {
                      required: 'Vui lòng nhập đơn giá',
                      validate: (v) => Number(v) > 0 || 'Đơn giá phải lớn hơn 0'
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.unitPrice ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.unitPrice && <span className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('quantity', {
                      required: 'Vui lòng nhập số lượng',
                      validate: (v) => Number(v) > 0 || 'Số lượng phải lớn hơn 0'
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.quantity ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.quantity && <span className="text-red-500 text-sm mt-1">{errors.quantity.message}</span>}
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Người mua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('purchaser', { required: 'Vui lòng nhập người mua' })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.purchaser ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.purchaser && <span className="text-red-500 text-sm mt-1">{errors.purchaser.message}</span>}
                </div>
              </div>
            </div>

            {/* Right Column - Supplier Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin nhà cung cấp</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('supplier', { required: 'Vui lòng nhập nhà cung cấp' })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.supplier ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.supplier && <span className="text-red-500 text-sm mt-1">{errors.supplier.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                    rows={3}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.address && <span className="text-red-500 text-sm mt-1">{errors.address.message}</span>}
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

                <div className="pt-6 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tổng tiền
                  </label>
                  <input
                    type="number"
                    {...register('total')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập tổng tiền"
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
              {submitting ? 'Đang thêm...' : 'Thêm thiết bị'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
