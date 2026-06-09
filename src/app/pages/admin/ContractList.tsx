import { AdminLayout } from '../../components/AdminLayout';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const contracts = [
  {
    id: 1,
    packageName: 'PREMIUM - Gym',
    createdDate: '2024-01-15',
    lastUpdate: '2024-05-20'
  },
  {
    id: 2,
    packageName: 'STANDARD - Yoga',
    createdDate: '2024-02-01',
    lastUpdate: '2024-05-18'
  },
  {
    id: 3,
    packageName: 'VIP - Boxing',
    createdDate: '2024-03-10',
    lastUpdate: '2024-05-15'
  }
];

export function ContractList() {
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/admin/contracts/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      alert(`Đã xóa hợp đồng ID: ${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách hợp đồng</h1>
          <p className="text-slate-600">Quản lý hợp đồng gắn liền với từng gói tập</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên gói tập</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày tạo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cập nhật gần nhất</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, index) => (
                  <tr key={contract.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{contract.packageName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contract.createdDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contract.lastUpdate}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(contract.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
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
    </AdminLayout>
  );
}
