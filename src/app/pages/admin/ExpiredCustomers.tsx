import { AdminLayout } from '../../components/AdminLayout';
import { Search, Eye, X, Loader2, Package, Phone, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface AlertItem {
  _id: string;
  customer: any;
  packageName: string;
  end_date: string;
  daysLeft?: number;
  daysOverdue?: number;
  total_price: number;
}

export function ExpiredCustomers() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState<AlertItem[]>([]);
  const [selected, setSelected] = useState<AlertItem | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '';
      const res = await fetch(`${getApiUrl()}/api/customers/alerts${base}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu');
      setExpired(data.expired || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [selectedClub]);

  const filtered = expired.filter(item => {
    const c = item.customer || {};
    return (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm);
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Khách hàng hết hạn</h1>
          <p className="text-slate-600">Danh sách khách hàng đã hết hạn gói tập</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm theo tên, tài khoản, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tài khoản</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">SĐT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Gói tập</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày hết hạn</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Quá hạn</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.customer?.fullName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.customer?.account || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.customer?.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.packageName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.end_date).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">Quá {item.daysOverdue} ngày</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelected(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Chi tiết"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => navigate(`/admin/customers/${item.customer?._id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Gia hạn"><Package className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length===0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500">Không có khách hàng nào đã hết hạn</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Chi tiết</h2>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3"><Phone className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Khách hàng</p><p className="font-semibold text-slate-900">{selected.customer?.fullName} ({selected.customer?.account}) - {selected.customer?.phone}</p></div></div>
                <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3"><Package className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Gói</p><p className="font-semibold text-slate-900">{selected.packageName} - {selected.total_price?.toLocaleString('vi-VN')}đ</p></div></div>
                <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3"><Calendar className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Ngày hết hạn</p><p className="font-semibold text-slate-900">{new Date(selected.end_date).toLocaleDateString('vi-VN')} {selected.daysOverdue?`(Quá ${selected.daysOverdue} ngày)`: `(Còn ${selected.daysLeft} ngày)`}</p></div></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Đóng</button>
                <button onClick={() => { setSelected(null); if(selected.customer?._id) navigate(`/admin/customers/${selected.customer._id}/edit`); }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">Gia hạn ngay</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
