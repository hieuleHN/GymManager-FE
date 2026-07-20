import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface EditCustomerFormData {
  account: string;
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
}

export function EditCustomer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditCustomerFormData>({
    defaultValues: {
      account: '',
      fullName: '',
      gender: 'Nam',
      phone: '',
      email: '',
      address: '',
      idNumber: ''
    }
  });
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState('');
  const [idCardBackPreview, setIdCardBackPreview] = useState('');
  const [currentIdCardFront, setCurrentIdCardFront] = useState('');
  const [currentIdCardBack, setCurrentIdCardBack] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      const customer = data.data || data;
      reset({
        account: customer.account || '',
        fullName: customer.fullName || '',
        gender: customer.gender || 'Nam',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        idNumber: customer.idNumber || ''
      });
      if (customer.idCardFront) setCurrentIdCardFront(customer.idCardFront);
      if (customer.idCardBack) setCurrentIdCardBack(customer.idCardBack);
    } catch {
      toast.error('Không thể tải thông tin khách hàng');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchCustomer(); }, [id]);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFront(file);
      setIdCardFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardBack(file);
      setIdCardBackPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EditCustomerFormData) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('account', data.account);
      fd.append('fullName', data.fullName);
      fd.append('gender', data.gender);
      fd.append('phone', data.phone);
      fd.append('email', data.email);
      fd.append('address', data.address);
      fd.append('idNumber', data.idNumber);
      if (idCardFront) fd.append('idCardFront', idCardFront);
      if (idCardBack) fd.append('idCardBack', idCardBack);

      const res = await fetch(`${getApiUrl()}/api/customers/${id}`, {
        method: 'PUT',
        headers: { Authorization: (getAuthHeaders() as any).Authorization || '' },
        body: fd
      });
      if (res.ok) {
        toast.success('Cập nhật khách hàng thành công!');
        navigate('/admin/customers');
      } else {
        const err = await res.json();
        toast.error(err.error || err.message || 'Cập nhật thất bại');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa thông tin khách hàng</h1>
          <p className="text-slate-600">Cập nhật thông tin khách hàng</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('account', { required: 'Vui lòng nhập tài khoản' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.account ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Nhập tài khoản"
                />
                {errors.account && <span className="text-red-500 text-sm mt-1">{errors.account.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới tính
                </label>
                <select
                  {...register('gender')}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: {
                      value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
                      message: 'Số điện thoại không hợp lệ'
                    }
                  })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="0901234567"
                />
                {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email không hợp lệ'
                    }
                  })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="email@example.com"
                />
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số căn cước
                </label>
                <input
                  type="text"
                  {...register('idNumber')}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="001234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Địa chỉ
              </label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ảnh mặt trước căn cước
                </label>
                {currentIdCardFront && (
                  <div className="mb-3">
                    <img src={`${getApiUrl()}/uploads/customers/${currentIdCardFront}`} alt="Current front" className="w-full max-w-xs rounded-lg border" />
                    <p className="text-xs text-slate-400 mt-1">Ảnh hiện tại</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontChange}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {idCardFrontPreview && (
                  <img src={idCardFrontPreview} alt="Preview front" className="mt-2 w-full max-w-xs rounded-lg border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ảnh mặt sau căn cước
                </label>
                {currentIdCardBack && (
                  <div className="mb-3">
                    <img src={`${getApiUrl()}/uploads/customers/${currentIdCardBack}`} alt="Current back" className="w-full max-w-xs rounded-lg border" />
                    <p className="text-xs text-slate-400 mt-1">Ảnh hiện tại</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackChange}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {idCardBackPreview && (
                  <img src={idCardBackPreview} alt="Preview back" className="mt-2 w-full max-w-xs rounded-lg border" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/customers')}
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
