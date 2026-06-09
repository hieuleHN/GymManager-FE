import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function AddJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    salary: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thêm công việc thành công!');
    navigate('/admin/jobs');
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên công việc <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: Huấn luyện viên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tiền lương <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => handleChange('salary', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: 10000000"
                min="0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/jobs')}
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
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Thêm công việc
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
