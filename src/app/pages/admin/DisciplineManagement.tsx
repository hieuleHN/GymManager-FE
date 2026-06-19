import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Discipline {
  _id: string;
  name: string;
  description: string;
}

export function DisciplineManagement() {
  const { selectedClub } = useClub();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Discipline | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const headers = getAuthHeaders();

  const fetchDisciplines = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub && selectedClub !== 'all'
        ? `/api/disciplines?locationId=${selectedClub}`
        : '/api/disciplines?';
      const url = `${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDisciplines(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách bộ môn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDisciplines(1);
  }, [selectedClub]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const openAddModal = () => {
    setEditTarget(null);
    setFormData({ name: '', description: '' });
    setErrors({});
    setShowAddModal(true);
  };

  const openEditModal = (discipline: Discipline) => {
    setEditTarget(discipline);
    setFormData({ name: discipline.name, description: discipline.description });
    setErrors({});
    setShowAddModal(true);
  };

  const handleBlur = (field: string) => {
    let error = '';
    if (field === 'name' && !formData.name.trim()) error = 'Vui lòng nhập tên bộ môn';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên bộ môn';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    if (selectedClub === 'all') {
      toast.error('Bạn chưa chọn câu lạc bộ');
      return;
    }
    setSubmitting(true);
    try {
      if (editTarget) {
        const res = await fetch(`/api/disciplines/${editTarget._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...formData, locationId: selectedClub }),
        });
        const errData = !res.ok ? await res.json().catch(() => null) : null;
        if (!res.ok) throw new Error(errData?.error || 'Update failed');
        toast.success('Cập nhật bộ môn thành công!');
      } else {
        const res = await fetch('/api/disciplines', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...formData, locationId: selectedClub }),
        });
        const errData = !res.ok ? await res.json().catch(() => null) : null;
        if (!res.ok) throw new Error(errData?.error || 'Create failed');
        toast.success('Thêm bộ môn thành công!');
      }
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      setEditTarget(null);
      fetchDisciplines(page);
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ môn này?')) return;
    try {
      const res = await fetch(`/api/disciplines/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xóa bộ môn');
      fetchDisciplines(page);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý bộ môn</h1>
            <p className="text-slate-600">Quản lý các bộ môn giảng dạy</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus className="w-5 h-5" />}
            onClick={openAddModal}
            sx={{
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Thêm bộ môn
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên bộ môn</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplines.map((discipline, index) => (
                    <tr key={discipline._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{discipline.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-md">{discipline.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(discipline)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(discipline._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {disciplines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Chưa có bộ môn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchDisciplines(p); }} />}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {editTarget ? 'Sửa bộ môn' : 'Thêm bộ môn'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên bộ môn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { handleChange('name', e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                  onBlur={() => handleBlur('name')}
                  className={`w-full p-3 border ${errors.name ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Nhập tên bộ môn"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập mô tả bộ môn"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                disabled={submitting}
                onClick={() => {
                  setShowAddModal(false);
                  setEditTarget(null);
                  setFormData({ name: '', description: '' });
                }}
                sx={{
                  flex: 1,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                disabled={submitting}
                onClick={handleSubmit}
                sx={{
                  flex: 1,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                {editTarget ? 'Cập nhật' : 'Thêm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
