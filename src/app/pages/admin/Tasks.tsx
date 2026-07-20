import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ke_toan: 'Kế toán',
  huan_luyen_vien: 'Huấn luyện viên',
  quan_ly: 'Quản lý',
  le_tan: 'Lễ tân',
};

interface Task {
  _id: string;
  name: string;
  salary: number;
  description?: string;
  isAdmin?: boolean;
  permissions?: string[];
}

export function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTasks = async (p = page) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs?page=${p}&limit=15`, { headers: getAuthHeaders() });
      const data = await res.json();
      setTasks(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => { fetchTasks(1); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        alert('Đã xóa công việc!');
        fetchTasks(page);
      }
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý công việc</h1>
            <p className="text-slate-600">Quản lý các vị trí công việc và mức lương</p>
          </div>
          <Button variant="contained" startIcon={<Plus className="w-5 h-5" />} onClick={() => navigate('/admin/jobs/add')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Admin</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Quyền</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{task.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{(task.salary ?? 0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${task.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {task.isAdmin ? 'Có' : 'Không'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(task.permissions?.length ? task.permissions : []).map(p => (
                          <span key={p} className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                            {ROLE_LABELS[p] || p}
                          </span>
                        ))}
                        {(!task.permissions || task.permissions.length === 0) && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(task._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Chưa có công việc nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchTasks(p); }} />
        </div>
      </div>
    </AdminLayout>
  );
}