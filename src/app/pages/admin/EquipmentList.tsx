import { AdminLayout } from '../../components/AdminLayout';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

const equipment = [
  {
    id: 1,
    name: 'Máy chạy bộ Technogym',
    description: 'Máy chạy bộ cao cấp với màn hình cảm ứng',
    price: 85000000,
    quantity: 10,
    supplier: 'Technogym Vietnam',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    phone: '0281234567',
    purchaseDate: '2024-01-15',
    total: 850000000
  },
  {
    id: 2,
    name: 'Ghế tập đẩy ngực',
    description: 'Ghế tập đẩy ngực chuyên nghiệp',
    price: 15000000,
    quantity: 5,
    supplier: 'Life Fitness',
    address: '456 Lê Lợi, Q1, TP.HCM',
    phone: '0287654321',
    purchaseDate: '2024-02-20',
    total: 75000000
  },
  {
    id: 3,
    name: 'Tạ đĩa Olympic',
    description: 'Bộ tạ đĩa Olympic 200kg',
    price: 8000000,
    quantity: 20,
    supplier: 'Gym Equipment VN',
    address: '789 Trần Hưng Đạo, Q5, TP.HCM',
    phone: '0289876543',
    purchaseDate: '2024-03-10',
    total: 160000000
  }
];

export function EquipmentList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id: number) => {
    alert(`Sửa thiết bị ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      alert(`Đã xóa thiết bị ID: ${id}`);
    }
  };

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
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên thiết bị</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mô tả</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giá tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số lượng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Người cung cấp</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Địa chỉ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày mua hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tổng tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.price.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.address}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.purchaseDate}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{item.total.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
