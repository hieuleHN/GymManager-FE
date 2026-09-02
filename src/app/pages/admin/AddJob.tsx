import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';

const ROLE_OPTIONS = [
  { value: 'ke_toan', label: 'Kế toán' },
  { value: 'huan_luyen_vien', label: 'Huấn luyện viên' },
  { value: 'quan_ly', label: 'Quản lý' },
  { value: 'le_tan', label: 'Lễ tân' },
];

interface JobFormData {
  name: string;
  description: string;
  isAdmin: boolean;
  permissions: string[];
}

export function AddJob() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>('');

  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>();

  const onSubmit = async (data: JobFormData) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, permissions: selectedPermission ? [selectedPermission] : [] })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Lỗi thêm công việc!');
      alert('Thêm công việc thành công!');
      navigate('/admin/jobs');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Thêm công việc</h1>
          <p className="text-slate-600">Tạo vị trí công việc mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên công việc <span className="text-red-500">*</span>
              </label>
              <input type="text" {...register('name', { required: 'Vui lòng nhập tên công việc' })}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} placeholder="VD: Huấn luyện viên" />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
              <textarea {...register('description')} rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mô tả công việc..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quyền</label>
              <select value={selectedPermission} onChange={e => setSelectedPermission(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">-- Chọn quyền --</option>
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/jobs')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {loading ? 'Đang xử lý...' : 'Thêm công việc'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
