import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { useForm } from 'react-hook-form';

interface Job {
  _id: string;
  name: string;
  salary: number;
}

interface StaffFormData {
  account: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  job: string;
  startDate: string;
  address: string;
}

export function AddStaff() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<StaffFormData>({
    defaultValues: {
      account: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
      gender: 'Nam',
      job: '',
      startDate: new Date().toISOString().split('T')[0],
      address: ''
    }
  });

  useEffect(() => {
    fetch(`${getApiUrl()}/api/jobs`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const list = data.data || [];
        if (Array.isArray(list)) {
          setJobs(list);
          if (list.length > 0) setValue('job', list[0]._id);
        }
      })
      .catch(() => {});
  }, [setValue]);

  const watchJob = watch('job');
  const selectedJob = jobs.find(j => j._id === watchJob);
  const displaySalary = selectedJob?.salary || 0;

  const onSubmit = async (data: StaffFormData) => {
    setError('');
    const club = selectedClub;
    if (!club || club === 'all') {
      setError('Bạn chưa chọn câu lạc bộ');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, baseSalary: displaySalary, locationId: club })
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Lỗi thêm nhân viên!');
      alert('Thêm nhân viên thành công!');
      navigate('/admin/staff');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Thêm nhân viên</h1>
          <p className="text-slate-600">Thêm nhân viên mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tài khoản <span className="text-red-500">*</span>
                </label>
                <input type="text" {...register('account', { required: 'Vui lòng nhập tài khoản' })}
                  className={`w-full p-3 border ${errors.account ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.account && <span className="text-red-500 text-sm mt-1">{errors.account.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input type="text" {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                  className={`w-full p-3 border ${errors.fullName ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' } })}
                  className={`w-full p-3 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input type="password" {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' } })}
                  className={`w-full p-3 border ${errors.password ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input type="tel" {...register('phone', { required: 'Vui lòng nhập số điện thoại', validate: value => /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(value) || 'Số điện thoại không hợp lệ' })}
                  className={`w-full p-3 border ${errors.phone ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới tính
                </label>
                <select {...register('gender')}
                  className={`w-full p-3 border ${errors.gender ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && <span className="text-red-500 text-sm mt-1">{errors.gender.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <select {...register('job', { required: 'Vui lòng chọn công việc' })}
                  className={`w-full p-3 border ${errors.job ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.name}</option>
                  ))}
                </select>
                {errors.job && <span className="text-red-500 text-sm mt-1">{errors.job.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lương theo chức vụ
                </label>
                <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-indigo-600 font-bold text-lg">
                  {displaySalary.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input type="date" {...register('startDate')}
                  className={`w-full p-3 border ${errors.startDate ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.startDate && <span className="text-red-500 text-sm mt-1">{errors.startDate.message}</span>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Địa chỉ
                </label>
                <textarea {...register('address')} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/staff')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {loading ? 'Đang xử lý...' : 'Thêm nhân viên'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
