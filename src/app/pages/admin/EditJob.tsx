import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

export function EditJob() {
  const navigate = useNavigate();
  const { id } = useParams();
  const headers = getAuthHeaders();

  const [formData, setFormData] = useState({ name: '', salary: '', description: '', isAdmin: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { headers });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setFormData({
          name: data.name || '',
          salary: data.salary?.toString() || '',
          description: data.description || '',
          isAdmin: data.isAdmin || false,
        });
      } catch {
        toast.error('Không tìm thấy công việc');
        navigate('/admin/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

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
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên công việc';
    if (!formData.salary || Number(formData.salary) <= 0) newErrors.salary = !formData.salary ? 'Vui lòng nhập tiền lương' : 'Tiền lương phải lớn hơn 0';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...formData, salary: Number(formData.salary) }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Cập nhật công việc thành công!');
      navigate('/admin/jobs');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa công việc</h1>
          <p className="text-slate-600">Cập nhật thông tin vị trí công việc</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên công việc <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                onBlur={(e) => handleBlur('name', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tiền lương <span className="text-red-500">*</span>
              </label>
              <input type="number" required value={formData.salary} onChange={(e) => handleChange('salary', e.target.value)}
                onBlur={(e) => handleBlur('salary', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.salary ? 'border-red-400' : 'border-slate-200'}`} min="0" />
              {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
              <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isAdmin" checked={formData.isAdmin} onChange={(e) => handleChange('isAdmin', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700">Công việc này có quyền quản trị</label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/jobs')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {submitting ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
