import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

const jobs = [
  {
    id: 1,
    name: 'Quản lý',
    salary: 15000000
  },
  {
    id: 2,
    name: 'Lễ tân',
    salary: 7000000
  },
  {
    id: 3,
    name: 'Huấn luyện viên',
    salary: 10000000
  },
  {
    id: 4,
    name: 'Kế toán',
    salary: 9000000
  },
  {
    id: 5,
    name: 'Bảo vệ',
    salary: 6000000
  }
];

export function JobList() {
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    alert(`Sửa công việc ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      alert(`Đã xóa công việc ID: ${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách công việc</h1>
            <p className="text-slate-600">Quản lý các vị trí công việc và mức lương</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus className="w-5 h-5" />}
            onClick={() => navigate('/admin/jobs/add')}
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên công việc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{job.name}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{job.salary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(job.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
