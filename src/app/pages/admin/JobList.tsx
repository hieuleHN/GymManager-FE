import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ke_toan: 'Kế toán',
  huan_luyen_vien: 'Huấn luyện viên',
  quan_ly: 'Quản lý',
  le_tan: 'Lễ tân',
};

interface Job {
  _id: string;
  name: string;
  description?: string;
  isAdmin?: boolean;
  permissions?: string[];
}

const fallbackJobs: Job[] = [];

export function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs?page=${p}&limit=15`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const data = await res.json();
      if (data.data) {
        setJobs(data.data);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        throw new Error('Dữ liệu không hợp lệ');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối đến server');
      setJobs(fallbackJobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(1); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        alert('Đã xóa công việc!');
        fetchJobs(page);
      }
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách công việc</h1>
            <p className="text-slate-600">Quản lý các vị trí công việc, mức lương và phân quyền</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outlined" startIcon={<RefreshCw className="w-5 h-5" />} onClick={fetchJobs}
              sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Plus className="w-5 h-5" />} onClick={() => navigate('/admin/jobs/add')}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
              Thêm công việc
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            {error} - <button onClick={fetchJobs} className="underline font-semibold">Thử lại</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên công việc</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Phân quyền</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Quyền</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{job.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{job.description || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${job.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {job.isAdmin ? 'Có quyền' : 'Không'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(job.permissions?.length ? job.permissions : []).map(p => (
                            <span key={p} className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                              {ROLE_LABELS[p] || p}
                            </span>
                          ))}
                          {(!job.permissions || job.permissions.length === 0) && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/admin/jobs/${job._id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(job._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Chưa có công việc nào. Hãy thêm công việc đầu tiên!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchJobs(p); }} />}
        </div>
      </div>
    </AdminLayout>
  );
}