import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Discipline {
  _id: string;
  name: string;
}

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  disciplineId: Discipline | string;
  contractA: string;
  contractB: string;
  contractTerms: string;
  features: string[];
  durations: { months: number; discount: number }[];
  createdAt: string;
  updatedAt: string;
}

export function ContractList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const headers = getAuthHeaders();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  const fetchPackages = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub && selectedClub !== 'all'
        ? `/api/packages?locationId=${selectedClub}`
        : '/api/packages?';
      const url = `${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPackages(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplines();
    setPage(1); fetchPackages(1);
  }, [selectedClub]);

  const getDisciplineName = (disciplineId: Discipline | string): string => {
    if (typeof disciplineId === 'object' && disciplineId !== null && 'name' in disciplineId) {
      return (disciplineId as Discipline).name;
    }
    const found = disciplines.find(d => d._id === disciplineId);
    return found ? found.name : 'N/A';
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/contracts/${id}/edit`);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách chính sách</h1>
          <p className="text-slate-600">Quản lý chính sách & điều khoản dịch vụ</p>
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên gói tập</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đơn giá</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Bộ môn</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cam kết A</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cam kết B</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Điều khoản</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày tạo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày cập nhật gần nhất</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, index) => (
                    <tr key={pkg._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{pkg.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {pkg.unitPrice?.toLocaleString('vi-VN') || '0'}đ
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getDisciplineName(pkg.disciplineId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={pkg.contractA}>
                        {pkg.contractA || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={pkg.contractB}>
                        {pkg.contractB || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={pkg.contractTerms}>
                        {pkg.contractTerms || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(pkg._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {packages.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                        Chưa có gói tập nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchPackages(p); }} />}
        </div>
      </div>
    </AdminLayout>
  );
}
