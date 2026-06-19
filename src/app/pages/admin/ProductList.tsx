import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { getAuthHeaders } from '../../context/AuthContext';

export function EquipmentList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEquipment = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all'
        ? `/api/equipments?locationId=${selectedClub}`
        : '/api/equipments?';
      const url = `${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tải danh sách thất bại');
      setEquipment(data?.data || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEquipment(1);
  }, [selectedClub]);

  const handleEdit = (id: string) => {
    navigate(`/admin/equipment/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;
    try {
      const res = await fetch(`/api/equipments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Xóa thiết bị thất bại');
      }
      toast.success('Xóa thiết bị thành công!');
      fetchEquipment(page);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredEquipment = equipment.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách thiết bị</h1>
          <p className="text-slate-600">Quản lý thiết bị phòng tập</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thiết bị, nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên thiết bị</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đơn giá</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số lượng</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Nhà cung cấp</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Địa chỉ</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">SĐT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Người mua</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Bảo hành (tháng)</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tổng tiền</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item: any) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.unitPrice?.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.address}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.purchaser}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.warranty_period}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{item.total?.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                        Không tìm thấy thiết bị nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchEquipment(p); }} />}
        </div>
      </div>
    </AdminLayout>
  );
}
