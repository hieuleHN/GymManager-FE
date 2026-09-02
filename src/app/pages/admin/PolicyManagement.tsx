import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface PolicyFormData {
  menuTitle: string;
  title: string;
  description: string;
}

interface Policy {
  _id: string;
  menuTitle: string;
  title: string;
  description: string;
  createdAt: string;
}

export function PolicyManagement() {
  const headers = getAuthHeaders();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const { register, handleSubmit: formSubmit, reset, formState: { errors, isSubmitting } } = useForm<PolicyFormData>({ defaultValues: { menuTitle: '', title: '', description: '' } });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPolicies = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/policies?page=${p}&limit=15`, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPolicies(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách chính sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(1); }, []);

  const openAdd = () => {
    setEditing(null);
    reset({ menuTitle: '', title: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (p: Policy) => {
    setEditing(p);
    reset({ menuTitle: p.menuTitle || '', title: p.title, description: p.description });
    setShowModal(true);
  };

  const onFormSubmit = async (data: PolicyFormData) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/policies/${editing._id}` : '/api/policies';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed');
      toast.success(editing ? 'Cập nhật chính sách thành công!' : 'Thêm chính sách thành công!');
      setShowModal(false);
      setPage(1); fetchPolicies(1);
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chính sách này?')) return;
    try {
      const res = await fetch(`/api/policies/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã xóa chính sách');
      fetchPolicies(page);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý chính sách</h1>
            <p className="text-slate-600">Quản lý các chính sách và quy định của phòng tập</p>
          </div>
          <Button variant="contained" startIcon={<Plus className="w-5 h-5" />} onClick={openAdd}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
            Thêm chính sách
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiêu đề menu</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiêu đề</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, index) => (
                    <tr key={policy._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-700">{policy.menuTitle || 'Khác'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{policy.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-md">{policy.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(policy)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(policy._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có chính sách nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchPolicies(p); }} />}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editing ? 'Sửa chính sách' : 'Thêm chính sách'}</h3>
            <form onSubmit={formSubmit(onFormSubmit)} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề menu <span className="text-red-500">*</span></label>
                <input type="text" {...register('menuTitle', { required: 'Vui lòng nhập tiêu đề menu' })}
                  placeholder="VD: Chính sách bảo mật"
                  className={`w-full p-3 border ${errors.menuTitle ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.menuTitle && <span className="text-red-500 text-sm mt-1">{errors.menuTitle.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
                <input type="text" {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                  className={`w-full p-3 border ${errors.title ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả <span className="text-red-500">*</span></label>
                <textarea {...register('description', { required: 'Vui lòng nhập mô tả' })}
                  rows={4} className={`w-full p-3 border ${errors.description ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outlined" onClick={() => setShowModal(false)}
                  sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
                  Hủy
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}
                  sx={{ flex: 1, bgcolor: '#4f46e5', textTransform: 'none', borderRadius: 2 }}>
                  {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
