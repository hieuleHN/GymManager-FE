import { AdminLayout } from '../../components/AdminLayout';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

const staff = [
  {
    id: 1,
    name: 'Nguyễn Văn X',
    job: 'Quản lý',
    email: 'quanly@zenfitness.com',
    phone: '0901111111',
    gender: 'Nam',
    workShift: 'Ca ngày',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    startDate: '2023-01-15',
    status: 'active'
  },
  {
    id: 2,
    name: 'Trần Thị Y',
    job: 'Lễ tân',
    email: 'letan@zenfitness.com',
    phone: '0902222222',
    gender: 'Nữ',
    workShift: 'Ca sáng (6h-12h)',
    address: '456 Lê Lợi, Q1, TP.HCM',
    startDate: '2023-06-01',
    status: 'active'
  },
  {
    id: 3,
    name: 'Lê Văn Z',
    job: 'Huấn luyện viên',
    email: 'hlv1@zenfitness.com',
    phone: '0903333333',
    gender: 'Nam',
    workShift: 'Ca chiều (12h-18h)',
    address: '789 Trần Hưng Đạo, Q5, TP.HCM',
    startDate: '2023-03-20',
    status: 'active'
  },
  {
    id: 4,
    name: 'Phạm Thị T',
    job: 'Kế toán',
    email: 'ketoan@zenfitness.com',
    phone: '0904444444',
    gender: 'Nữ',
    workShift: 'Ca tối (18h-22h)',
    address: '321 Võ Văn Tần, Q3, TP.HCM',
    startDate: '2023-02-10',
    status: 'active'
  }
];

export function StaffList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staff.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id: number) => {
    alert(`Sửa nhân viên ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      alert(`Đã xóa nhân viên ID: ${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách nhân viên</h1>
          <p className="text-slate-600">Quản lý thông tin nhân viên</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, chức vụ, email..."
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Công việc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giới tính</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời gian làm việc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Địa chỉ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person, index) => (
                  <tr key={person.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{person.job}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.gender}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.workShift}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{person.address}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(person.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
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
