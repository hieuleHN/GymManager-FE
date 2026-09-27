import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2, AlertTriangle, Check, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  description?: string;
  image?: string;
  importDate: string;
  expiryDate: string;
  location_id: string;
  reports?: Array<{
    _id: string;
    reason: string;
    reportedAt: string;
    status: string;
  }>;
}

export function ProductList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportListModal, setShowReportListModal] = useState(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ _id: string; reason: string; reportedAt: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${getApiUrl()}/api/products${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setProducts(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchProducts(1); }, [selectedClub]);

  const handleEdit = (id: string) => {
    navigate(`/admin/products/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        toast.success('Đã xóa sản phẩm');
        fetchProducts(page);
      } else {
        toast.error('Xóa thất bại');
      }
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleSell = async (product: Product) => {
    const qtyStr = prompt(`Nhập số lượng bán "${product.name}" (tồn kho: ${product.quantity}):`, '1');
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty < 1) {
      toast.error('Số lượng không hợp lệ');
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/products/${product._id}/sell`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã ghi nhận bán');
        fetchProducts(page);
      } else {
        toast.error(data.message || 'Lỗi ghi nhận bán');
      }
    } catch {
      toast.error('Lỗi ghi nhận bán');
    }
  };

  const handleReport = (product: Product) => {
    setSelectedProduct(product);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Vui lòng nhập lý do!');
      return;
    }
    if (!selectedProduct) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/products/${selectedProduct._id}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        toast.success('Đã gửi báo cáo');
        setShowReportModal(false);
        setReportReason('');
        setSelectedProduct(null);
        fetchProducts(page);
      } else {
        toast.error('Gửi báo cáo thất bại');
      }
    } catch {
      toast.error('Gửi báo cáo thất bại');
    }
  };

  const handleResolveReport = async (productId: string, reportId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/products/${productId}/report/${reportId}/resolve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success('Đã hoàn thành báo cáo');
        setShowReportDetailModal(false);
        setShowReportListModal(false);
        setSelectedReport(null);
        setSelectedProduct(null);
        fetchProducts(page);
      } else {
        toast.error('Hoàn thành báo cáo thất bại');
      }
    } catch {
      toast.error('Hoàn thành báo cáo thất bại');
    }
  };

  const handleViewReport = (product: Product, report: { _id: string; reason: string; reportedAt: string }) => {
    setSelectedProduct(product);
    setSelectedReport(report);
    setShowReportDetailModal(true);
  };

  const handleOpenReportList = (product: Product) => {
    setSelectedProduct(product);
    setShowReportListModal(true);
  };

  const pendingReports = (product: Product) =>
    product.reports?.filter(r => r.status === 'pending') || [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách sản phẩm</h1>
            <p className="text-slate-600">Quản lý sản phẩm nước uống và thực phẩm bổ sung</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus className="w-5 h-5" />}
            onClick={() => navigate('/admin/products/add')}
            sx={{
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Thêm sản phẩm
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ảnh</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đơn giá</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giá nhập</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tồn kho</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đã bán</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày nhập</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày hết hạn</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">Chưa có sản phẩm nào</td></tr>
                ) : products.map((product, index) => (
                  <tr key={product._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      {product.image ? (
                        <img src={`/${product.image}`} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">No img</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{(product.price ?? 0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{(product.costPrice ?? 0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.quantity ?? 0}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{product.sold ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.importDate ? new Date(product.importDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSell(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ghi nhận bán"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => handleReport(product)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Báo cáo hỏng/mất"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          {pendingReports(product).length > 0 && (
                            <button
                              onClick={() => handleOpenReportList(product)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="Danh sách báo cáo"
                            >
                              {pendingReports(product).length}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchProducts(p); }} />}
        </div>
      </div>

      {/* Report List Modal */}
      {showReportListModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowReportListModal(false); setSelectedProduct(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Danh sách báo cáo</h3>
              <button
                onClick={() => { setShowReportListModal(false); setSelectedProduct(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-600">Sản phẩm</p>
              <p className="text-lg font-semibold text-slate-900">{selectedProduct.name}</p>
            </div>
            {pendingReports(selectedProduct).length === 0 ? (
              <p className="text-center text-slate-500 py-4">Không có báo cáo nào đang chờ</p>
            ) : (
              <div className="space-y-3">
                {pendingReports(selectedProduct).map((report, idx) => (
                  <div key={report._id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">Báo cáo #{idx + 1}</p>
                        <p className="text-sm text-slate-700 line-clamp-2">{report.reason}</p>
                        {report.reportedAt && (
                          <p className="text-xs text-slate-400 mt-1">{new Date(report.reportedAt).toLocaleDateString('vi-VN')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleViewReport(selectedProduct, report)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleResolveReport(selectedProduct._id, report._id!)}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          Hoàn thành
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetailModal && selectedProduct && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedProduct(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Chi tiết báo cáo</h3>
              <button
                onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedProduct(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 mb-1">Sản phẩm</p>
              <p className="text-lg font-semibold text-slate-900">{selectedProduct.name}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">Lý do báo cáo</p>
              <p className="text-base bg-slate-50 rounded-xl p-4 text-slate-800">{selectedReport.reason}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedProduct(null); }}
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
                color="success"
                onClick={() => handleResolveReport(selectedProduct._id, selectedReport._id)}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Hoàn thành
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Báo cáo sản phẩm</h3>
            <p className="text-sm text-slate-600 mb-4">
              Sản phẩm: <span className="font-semibold text-slate-900">{selectedProduct?.name}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lý do (hàng hỏng hoặc mất)
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-40"
                placeholder="Nhập lý do báo cáo..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setSelectedProduct(null);
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
                onClick={handleSubmitReport}
                sx={{
                  flex: 1,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Gửi báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
