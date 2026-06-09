import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Search, Edit, Trash2, Eye, X } from 'lucide-react';
import { useState } from 'react';

const customers = [
  {
    id: 1,
    fullName: 'Nguyễn Văn A',
    account: 'nguyenvana',
    gender: 'Nam',
    phone: '0901234567',
    registerDate: '2024-01-15',
    email: 'nguyenvana@email.com',
    discipline: 'Gym',
    duration: '12 tháng',
    remaining: '8 tháng',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    idNumber: '001234567890',
    idImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
    hometown: 'Hà Nội',
    address: '123 Đường ABC, Quận 1, TP.HCM'
  },
  {
    id: 2,
    fullName: 'Trần Thị B',
    account: 'tranthib',
    gender: 'Nữ',
    phone: '0907654321',
    registerDate: '2024-02-20',
    email: 'tranthib@email.com',
    discipline: 'Yoga',
    duration: '6 tháng',
    remaining: '2 tháng',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    idNumber: '001234567891',
    idImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
    hometown: 'Đà Nẵng',
    address: '456 Đường XYZ, Quận 2, TP.HCM'
  },
  {
    id: 3,
    fullName: 'Lê Văn C',
    account: 'levanc',
    gender: 'Nam',
    phone: '0909876543',
    registerDate: '2023-12-10',
    email: 'levanc@email.com',
    discipline: 'Boxing',
    duration: '3 tháng',
    remaining: '0 ngày',
    status: 'expired',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    idNumber: '001234567892',
    idImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
    hometown: 'Huế',
    address: '789 Đường DEF, Quận 3, TP.HCM'
  },
  {
    id: 4,
    fullName: 'Phạm Thị D',
    account: 'phamthid',
    gender: 'Nữ',
    phone: '0903456789',
    registerDate: '2024-03-05',
    email: 'phamthid@email.com',
    discipline: 'Pilates',
    duration: '12 tháng',
    remaining: '10 tháng',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    idNumber: '001234567893',
    idImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
    hometown: 'Cần Thơ',
    address: '321 Đường GHI, Quận 4, TP.HCM'
  }
];

export function CustomerList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleEdit = (id: number) => {
    alert(`Sửa khách hàng ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      alert(`Đã xóa khách hàng ID: ${id}`);
    }
  };

  const handleViewDetail = (customer: typeof customers[0]) => {
    setSelectedCustomer(customer);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách khách hàng</h1>
          <p className="text-slate-600">Quản lý thông tin khách hàng</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, tài khoản, số điện thoại..."
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Họ và tên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tài khoản</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giới tính</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Bộ môn</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời gian</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Còn lại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.fullName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.account}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.gender}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.registerDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.discipline}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.duration}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.remaining}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        customer.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {customer.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(customer)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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

        {/* Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Chi tiết khách hàng</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex justify-center">
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.fullName}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-100"
                  />
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Họ và tên</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.fullName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Tài khoản</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.account}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Giới tính</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.gender}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Số điện thoại</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.phone}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.email}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Quê quán</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.hometown}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl md:col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Địa chỉ</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.address}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Số căn cước</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.idNumber}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Ngày đăng ký</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.registerDate}</p>
                  </div>
                </div>

                {/* ID Card Image */}
                <div>
                  <p className="text-sm text-slate-600 mb-2">Ảnh căn cước</p>
                  <img
                    src={selectedCustomer.idImage}
                    alt="ID Card"
                    className="w-full rounded-xl border border-slate-200"
                  />
                </div>

                {/* Package Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <p className="text-sm text-indigo-600 mb-1">Bộ môn</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.discipline}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <p className="text-sm text-indigo-600 mb-1">Thời gian</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.duration}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <p className="text-sm text-indigo-600 mb-1">Còn lại</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.remaining}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
