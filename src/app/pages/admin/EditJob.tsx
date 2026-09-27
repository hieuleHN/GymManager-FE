import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
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

export function EditJob() {
  const navigate = useNavigate();
  const { id } = useParams();
  const headers = getAuthHeaders();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<JobFormData>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { headers });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        reset({
          name: data.name || '',
          description: data.description || '',
          isAdmin: data.isAdmin || false,
        });
        setSelectedPermission(data.permissions?.[0] || '');
      } catch {
        toast.error('Không tìm thấy công việc');
        navigate('/admin/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const onSubmit = async (data: JobFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...data, permissions: selectedPermission ? [selectedPermission] : [] }),
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên công việc <span className="text-red-500">*</span>
              </label>
              <input type="text"
                {...register('name', {
                  required: 'Vui lòng nhập tên công việc',
                  validate: (value) => value.trim() !== '' || 'Vui lòng nhập tên công việc'
                })}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
              {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
              <textarea {...register('description')} rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
