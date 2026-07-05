import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Search, Eye, Download } from 'lucide-react';
import { useState } from 'react';

const invoices = [
  {
    id: 'INV-001',
    customer: 'Nguyễn Văn A',
    service: 'Gói Gym Premium 12 tháng',
    amount: 2800000,
    date: '2024-05-20',
    dueDate: '2024-05-27',
    status: 'paid'
  },
  {
    id: 'INV-002',
    customer: 'Trần Thị B',
    service: 'Gói Yoga Standard 6 tháng',
    amount: 1500000,
    date: '2024-05-22',
    dueDate: '2024-05-29',
    status: 'pending'
  },
  {
    id: 'INV-003',
    customer: 'Lê Văn C',
    service: 'Gói Boxing Pro 3 tháng',
    amount: 1800000,
    date: '2024-05-15',
    dueDate: '2024-05-22',
    status: 'overdue'
  },
  {
    id: 'INV-004',
    customer: 'Phạm Thị D',
    service: 'PT 10 buổi',
    amount: 5000000,
    date: '2024-05-25',
    dueDate: '2024-06-01',
    status: 'paid'
  }
];

export function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý hóa đơn</h1>
          <p className="text-slate-600">Quản lý và theo dõi hóa đơn thanh toán</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hóa đơn, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Mã HĐ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Khách hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Dịch vụ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày tạo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Hạn thanh toán</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{invoice.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{invoice.customer}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{invoice.service}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {invoice.amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{invoice.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{invoice.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Tải về"
                        >
                          <Download className="w-4 h-4" />
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
