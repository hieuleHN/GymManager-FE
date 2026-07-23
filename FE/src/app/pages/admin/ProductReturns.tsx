import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface ProductReturn {
  _id: string;
  productName: string;
  reason: string;
  quantity: number;
  returnDate: string;
  locationId: string;
}

export function ProductReturns() {
  const { selectedClub } = useClub();
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    reason: '',
    quantity: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReturns = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${getApiUrl()}/api/product-returns${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setReturns(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách trả hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchReturns(1); }, [selectedClub]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/product-returns/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        toast.success('Đã xóa');
        fetchReturns(page);
      } else {
        toast.error('Xóa thất bại');
      }
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleBlur = (field: string) => {
    let error = '';
    if (field === 'reason' && !formData.reason.trim()) error = 'Vui lòng nhập lý do trả hàng';
    else if (field === 'quantity' && (!formData.quantity || Number(formData.quantity) <= 0)) error = 'Số lượng phải lớn hơn 0';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.reason.trim()) newErrors.reason = 'Vui lòng nhập lý do trả hàng';
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = 'Số lượng phải lớn hơn 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    if (selectedClub === 'all') {
      toast.error('Vui lòng chọn cơ sở!');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        productName: formData.productName,
        reason: formData.reason,
        quantity: Number(formData.quantity),
        locationId: selectedClub
      };
      const res = await fetch(`${getApiUrl()}/api/product-returns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success('Đã lưu thông tin trả hàng!');
        setShowAddModal(false);
        setFormData({ productName: '', reason: '', quantity: '' });
        setPage(1); fetchReturns(1);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lưu thất bại');
      }
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Khách trả hàng</h1>
            <p className="text-slate-600">Danh sách các lần khách trả hàng</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus className="w-5 h-5" />}
            onClick={() => { setFormData({ productName: '', reason: '', quantity: '' }); setErrors({}); setShowAddModal(true); }}
            sx={{
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Nhập thông tin
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên mặt hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Lý do trả hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số lượng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày trả</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
                ) : returns.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chưa có lần trả hàng nào</td></tr>
                ) : returns.map((item, index) => (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.reason}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.returnDate ? new Date(item.returnDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchReturns(p); }} />}
        </div>
      </div>

      {/* Add Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Nhập thông tin trả hàng</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên mặt hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => handleChange('productName', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tên mặt hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lý do khách trả hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => { handleChange('reason', e.target.value); setErrors(prev => ({ ...prev, reason: '' })); }}
                  onBlur={() => handleBlur('reason')}
                  rows={3}
                  className={`w-full p-3 border ${errors.reason ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Nhập lý do trả hàng"
                />
                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => { handleChange('quantity', e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }}
                  onBlur={() => handleBlur('quantity')}
                  className={`w-full p-3 border ${errors.quantity ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Nhập số lượng"
                  min="1"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ productName: '', reason: '', quantity: '' });
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
                onClick={handleSubmit}
                disabled={submitting}
                sx={{
                  flex: 1,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
