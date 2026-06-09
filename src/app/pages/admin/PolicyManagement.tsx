import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

const policies = [
  {
    id: 1,
    title: 'Quy định về trang phục',
    description: 'Hội viên phải mặc trang phục thể thao khi tập luyện, mang giày thể thao sạch sẽ và không được đi dép lào trong khu vực tập.'
  },
  {
    id: 2,
    title: 'Quy định về vệ sinh',
    description: 'Vui lòng lau sạch thiết bị sau khi sử dụng, không xả rác bừa bãi và giữ gìn vệ sinh chung của phòng tập.'
  },
  {
    id: 3,
    title: 'Quy định về an toàn',
    description: 'Luôn tuân thủ hướng dẫn của HLV, sử dụng thiết bị đúng cách và không gây nguy hiểm cho bản thân và người khác.'
  },
  {
    id: 4,
    title: 'Quy định về thời gian',
    description: 'Giờ hoạt động từ 6h sáng đến 22h tối các ngày trong tuần. Hội viên cần check-in trước khi vào khu vực tập.'
  }
];

export function PolicyManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    alert('Thêm chính sách thành công!');
    setShowAddModal(false);
    setFormData({ title: '', description: '' });
  };

  const handleEdit = (id: number) => {
    alert(`Sửa chính sách ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa chính sách này?')) {
      alert(`Đã xóa chính sách ID: ${id}`);
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
            Thêm chính sách
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiêu đề</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy, index) => (
                  <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{policy.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">{policy.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(policy.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Thêm chính sách</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tiêu đề chính sách"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập mô tả chính sách"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ title: '', description: '' });
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
                Thêm
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
