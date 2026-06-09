import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const returns = [
  {
    id: 1,
    productName: 'Nước tăng lực Red Bull',
    reason: 'Hết hạn sử dụng',
    quantity: 5,
    returnDate: '2024-05-20'
  },
  {
    id: 2,
    productName: 'Nước protein Whey',
    reason: 'Bao bì hỏng',
    quantity: 2,
    returnDate: '2024-05-18'
  },
  {
    id: 3,
    productName: 'Nước điện giải Pocari',
    reason: 'Không đúng loại đặt hàng',
    quantity: 10,
    returnDate: '2024-05-15'
  }
];

export function ProductReturns() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    reason: '',
    quantity: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (!formData.productName || !formData.reason || !formData.quantity) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    alert('Đã lưu thông tin trả hàng!');
    setShowAddModal(false);
    setFormData({ productName: '', reason: '', quantity: '' });
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
            onClick={() => setShowAddModal(true)}
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
                </tr>
              </thead>
              <tbody>
                {returns.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.reason}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.returnDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  onChange={(e) => handleChange('reason', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập lý do trả hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập số lượng"
                  min="1"
                />
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
                sx={{
                  flex: 1,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
