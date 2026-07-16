import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

export function AddJob() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    description: '',
    isAdmin: false
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string, value: any) => {
    const msg = !value || (field === 'salary' && Number(value) <= 0)
      ? field === 'name' ? 'Vui lòng nhập tên công việc'
      : field === 'salary' ? (!value ? 'Vui lòng nhập tiền lương' : 'Tiền lương phải lớn hơn 0')
      : ''
      : '';
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Vui lòng nhập tên công việc';
    if (!formData.salary) newErrors.salary = 'Vui lòng nhập tiền lương';
    else if (Number(formData.salary) <= 0) newErrors.salary = 'Tiền lương phải lớn hơn 0';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, salary: Number(formData.salary) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm công việc!');
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

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên công việc <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={(e) => handleBlur('name', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} placeholder="VD: Huấn luyện viên" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tiền lương <span className="text-red-500">*</span>
              </label>
              <input type="number" required value={formData.salary} onChange={(e) => handleChange('salary', e.target.value)} onBlur={(e) => handleBlur('salary', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.salary ? 'border-red-400' : 'border-slate-200'}`} placeholder="VD: 10000000" min="0" />
              {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
              <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mô tả công việc..." />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isAdmin" checked={formData.isAdmin} onChange={(e) => handleChange('isAdmin', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700">Công việc này có quyền quản trị (phân quyền)</label>
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