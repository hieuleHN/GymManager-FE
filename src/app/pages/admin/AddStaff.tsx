import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

interface Job {
  _id: string;
  name: string;
  salary: number;
}

export function AddStaff() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    account: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Nam',
    job: '',
    startDate: new Date().toISOString().split('T')[0],
    address: ''
  });

  useEffect(() => {
    fetch(`${getApiUrl()}/api/jobs`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const list = data.data || [];
        if (Array.isArray(list)) {
          setJobs(list);
          if (list.length > 0) setFormData(prev => ({ ...prev, job: list[0]._id }));
        }
      })
      .catch(() => {});
  }, []);

  const selectedJob = jobs.find(j => j._id === formData.job);
  const displaySalary = selectedJob?.salary || 0;

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = '';
    if (field === 'account' && !value) msg = 'Vui lòng nhập tài khoản';
    else if (field === 'fullName' && !value) msg = 'Vui lòng nhập họ tên';
    else if (field === 'email' && !value) msg = 'Vui lòng nhập email';
    else if (field === 'password' && !value) msg = 'Vui lòng nhập mật khẩu';
    else if (field === 'phone' && !value) msg = 'Vui lòng nhập số điện thoại';
    else if (field === 'job' && !value) msg = 'Vui lòng chọn công việc';
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrors: Record<string, string> = {};
    if (!formData.account) newErrors.account = 'Vui lòng nhập tài khoản';
    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!formData.phone) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.job) newErrors.job = 'Vui lòng chọn công việc';
    if (!selectedClub || selectedClub === 'all') newErrors.club = 'Bạn chưa chọn câu lạc bộ';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, baseSalary: displaySalary, locationId: selectedClub })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm nhân viên!');
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

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tài khoản <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={formData.account} onChange={(e) => handleChange('account', e.target.value)} onBlur={(e) => handleBlur('account', e.target.value)}
                  className={`w-full p-3 border ${errors.account ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} onBlur={(e) => handleBlur('fullName', e.target.value)}
                  className={`w-full p-3 border ${errors.fullName ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)} onBlur={(e) => handleBlur('email', e.target.value)}
                  className={`w-full p-3 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input type="password" required value={formData.password} onChange={(e) => handleChange('password', e.target.value)} onBlur={(e) => handleBlur('password', e.target.value)}
                  className={`w-full p-3 border ${errors.password ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input type="tel" required value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} onBlur={(e) => handleBlur('phone', e.target.value)}
                  className={`w-full p-3 border ${errors.phone ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới tính
                </label>
                <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} onBlur={(e) => handleBlur('gender', e.target.value)}
                  className={`w-full p-3 border ${errors.gender ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <select value={formData.job} onChange={(e) => handleChange('job', e.target.value)} onBlur={(e) => handleBlur('job', e.target.value)}
                  className={`w-full p-3 border ${errors.job ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.name}</option>
                  ))}
                </select>
                {errors.job && <p className="text-red-500 text-xs mt-1">{errors.job}</p>}
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
                <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} onBlur={(e) => handleBlur('startDate', e.target.value)}
                  className={`w-full p-3 border ${errors.startDate ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Địa chỉ
                </label>
                <textarea value={formData.address} onChange={(e) => handleChange('address', e.target.value)} rows={3}
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