import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const products = [
  {
    id: 1,
    name: 'Nước tăng lực Red Bull',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34c1a66a?auto=format&fit=crop&q=80&w=200',
    importDate: '2024-05-01',
    expiryDate: '2024-12-31'
  },
  {
    id: 2,
    name: 'Nước protein Whey',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=200',
    importDate: '2024-05-10',
    expiryDate: '2025-01-15'
  },
  {
    id: 3,
    name: 'Nước điện giải Pocari',
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=200',
    importDate: '2024-05-15',
    expiryDate: '2024-11-30'
  }
];

export function ProductList() {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [reportReason, setReportReason] = useState('');

  const handleEdit = (id: number) => {
    alert(`Sửa sản phẩm ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      alert(`Đã xóa sản phẩm ID: ${id}`);
    }
  };

  const handleReport = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setShowReportModal(true);
  };

  const handleSubmitReport = () => {
    if (!reportReason.trim()) {
      alert('Vui lòng nhập lý do!');
      return;
    }
    alert(`Đã ghi nhận: ${selectedProduct?.name}\nLý do: ${reportReason}`);
    setShowReportModal(false);
    setReportReason('');
    setSelectedProduct(null);
  };

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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày nhập</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày hết hạn</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.importDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.expiryDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReport(product)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Báo cáo hỏng/mất"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
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
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
