import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { useEffect, useState } from 'react';
import { Edit, Trash2, Pause, Play } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface Discipline {
  _id: string;
  name: string;
}

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  disciplineId: Discipline | string;
  features: string[];
  durations: { months: number; discount: number }[];
  is_active: boolean;
}

export function PackageList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const headers = getAuthHeaders();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDisciplines = async () => {
      try {
        const url = selectedClub && selectedClub !== 'all'
          ? `/api/disciplines?locationId=${selectedClub}`
          : '/api/disciplines';
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setDisciplines(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        // silent
      }
    };
    fetchDisciplines();
  }, [selectedClub]);

  const fetchPackages = async (disciplineId: string, p = page) => {
    setLoading(true);
    try {
      let url: string;
      if (disciplineId === 'all') {
        const base = selectedClub && selectedClub !== 'all'
          ? `/api/packages?locationId=${selectedClub}`
          : '/api/packages?';
        url = `${base}&page=${p}&limit=15`;
      } else {
        url = `/api/packages/by-discipline/${disciplineId}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPackages(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách gói tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPackages(selectedDiscipline, 1);
  }, [selectedDiscipline, selectedClub]);

  const handleDisciplineClick = (id: string) => {
    setSelectedDiscipline(id);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/packages/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói tập này?')) return;
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xóa gói tập');
      fetchPackages(selectedDiscipline, page);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const toggleStatus = async (pkg: PackageItem) => {
    const newActive = !pkg.is_active;
    try {
      const res = await fetch(`/api/packages/${pkg._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      toast.success(newActive ? 'Đã kích hoạt gói tập' : 'Đã tạm ngưng gói tập');
      fetchPackages(selectedDiscipline, page);
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const getDisciplineName = (disciplineId: Discipline | string): string => {
    if (typeof disciplineId === 'object' && disciplineId !== null && 'name' in disciplineId) {
      return (disciplineId as Discipline).name;
    }
    const found = disciplines.find(d => d._id === disciplineId);
    return found ? found.name : 'N/A';
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách gói tập</h1>
          <p className="text-slate-600">Quản lý các gói tập của phòng gym</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => handleDisciplineClick('all')}
            className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedDiscipline === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Tất cả
          </button>
          {disciplines.map((discipline) => (
            <button
              key={discipline._id}
              onClick={() => handleDisciplineClick(discipline._id)}
              className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedDiscipline === discipline._id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {discipline.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
            Đang tải...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4 pb-0 flex justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pkg.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pkg.is_active ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>

                <div className="p-6 pt-3">
                  <div className="mb-4">
                    <p className="text-sm text-indigo-600 font-semibold mb-1">
                      {getDisciplineName(pkg.disciplineId)}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-slate-900">
                        {pkg.unitPrice?.toLocaleString('vi-VN') || '0'}
                      </p>
                      <span className="text-slate-500">đ/tháng</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {(pkg.features || []).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEdit(pkg._id)}
                      className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Xóa</span>
                    </button>
                    <button
                      onClick={() => toggleStatus(pkg)}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                        pkg.is_active
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {pkg.is_active ? (
                        <><Pause className="w-4 h-4" /><span className="text-sm font-medium">Tạm ngưng</span></>
                      ) : (
                        <><Play className="w-4 h-4" /><span className="text-sm font-medium">Kích hoạt</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
                Chưa có gói tập nào
              </div>
            )}
          </div>
        )}
        {!loading && selectedDiscipline === 'all' && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchPackages(selectedDiscipline, p); }} />}
      </div>
    </AdminLayout>
  );
}
