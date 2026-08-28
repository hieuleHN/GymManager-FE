import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { useForm } from 'react-hook-form';

interface CustomerFormData {
  account: string;
  password: string;
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
  registerDate: string;
}

export function CustomerRegister() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    defaultValues: {
      account: '',
      password: '',
      fullName: '',
      gender: 'Nam',
      phone: '',
      email: '',
      address: '',
      idNumber: '',
      registerDate: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: CustomerFormData) => {
    setError('');
    if (!selectedClub || selectedClub === 'all') {
      setError('Bạn chưa chọn câu lạc bộ');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => form.append(k, v));
      if (selectedClub && selectedClub !== 'all') form.append('locationId', selectedClub);

      const res = await fetch(`${getApiUrl()}/api/customers/register`, {
        method: 'POST',
        body: form
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Đăng ký thất bại!');
      alert('Đăng ký khách hàng thành công!');
      navigate('/admin/customers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký khách hàng</h1>
          <p className="text-slate-600">Thêm khách hàng mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tài khoản <span className="text-red-500">*</span></label>
                <input type="text" {...register('account', { required: 'Vui lòng nhập tài khoản' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.account ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.account && <span className="text-red-500 text-sm mt-1">{errors.account.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu <span className="text-red-500">*</span></label>
                <input type="password" {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' } })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                <input type="text" {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
                <select {...register('gender')}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" {...register('phone', { required: 'Vui lòng nhập số điện thoại', pattern: { value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'Số điện thoại không hợp lệ' } })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } })}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số căn cước</label>
                <input type="text" {...register('idNumber')}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày đăng ký</label>
                <input type="date" {...register('registerDate')}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                <textarea {...register('address')} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/customers')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
