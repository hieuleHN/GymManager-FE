import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { getAuthHeaders } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function EditEquipment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/equipments/${id}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const item = data?.data || data;
        setFormData({
          name: item.name || '',
          description: item.description || '',
          unitPrice: item.unitPrice?.toString() || '',
          quantity: item.quantity?.toString() || '',
          supplier: item.supplier || '',
          phone: item.phone || '',
          address: item.address || '',
          purchaser: item.purchaser || '',
          warranty_period: item.warranty_period?.toString() || '12',
          total: item.total?.toString() || ''
        });
      })
      .catch((err) => {
        toast.error('Tải thông tin thiết bị thất bại!');
        navigate('/admin/equipment');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = '';
    if (!value && (field === 'name' || field === 'supplier' || field === 'phone' || field === 'address' || field === 'purchaser')) {
      const labels: Record<string, string> = { name: 'tên thiết bị', supplier: 'nhà cung cấp', phone: 'số điện thoại', address: 'địa chỉ', purchaser: 'người mua' };
      msg = 'Vui lòng nhập ' + labels[field];
    } else if ((field === 'unitPrice' || field === 'quantity') && (!value || Number(value) <= 0)) {
      msg = !value ? 'Vui lòng nhập ' + (field === 'unitPrice' ? 'đơn giá' : 'số lượng') : (field === 'unitPrice' ? 'Đơn giá' : 'Số lượng') + ' phải lớn hơn 0';
    }
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên thiết bị';
    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) newErrors.unitPrice = !formData.unitPrice ? 'Vui lòng nhập đơn giá' : 'Đơn giá phải lớn hơn 0';
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = !formData.quantity ? 'Vui lòng nhập số lượng' : 'Số lượng phải lớn hơn 0';
    if (!formData.supplier.trim()) newErrors.supplier = 'Vui lòng nhập nhà cung cấp';
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.purchaser.trim()) newErrors.purchaser = 'Vui lòng nhập người mua';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const body: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        unitPrice: parseFloat(formData.unitPrice),
        quantity: parseInt(formData.quantity),
        supplier: formData.supplier.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        purchaser: formData.purchaser.trim(),
        warranty_period: parseInt(formData.warranty_period) || 12
      };
      if (formData.total) {
        body.total = parseFloat(formData.total);
      }
      if (selectedClub !== 'all') {
        body.location_id = selectedClub;
      }

      const res = await fetch(`/api/equipments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thiết bị thất bại!');

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

        <form onSubmit={handleSubmit}>
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
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name', formData.name)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
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
                    required
                    value={formData.unitPrice}
                    onChange={(e) => handleChange('unitPrice', e.target.value)}
                    onBlur={() => handleBlur('unitPrice', formData.unitPrice)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.unitPrice ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    onBlur={() => handleBlur('quantity', formData.quantity)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.quantity ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thời gian bảo hành (tháng)
                  </label>
                  <input
                    type="number"
                    value={formData.warranty_period}
                    onChange={(e) => handleChange('warranty_period', e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Người mua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purchaser}
                    onChange={(e) => handleChange('purchaser', e.target.value)}
                    onBlur={() => handleBlur('purchaser', formData.purchaser)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.purchaser ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.purchaser && <p className="text-red-500 text-sm mt-1">{errors.purchaser}</p>}
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
                    required
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    onBlur={() => handleBlur('supplier', formData.supplier)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.supplier ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    onBlur={() => handleBlur('address', formData.address)}
                    rows={3}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
                    onBlur={() => handleBlur('phone', formData.phone)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tổng tiền
                  </label>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={(e) => handleChange('total', e.target.value)}
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
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
