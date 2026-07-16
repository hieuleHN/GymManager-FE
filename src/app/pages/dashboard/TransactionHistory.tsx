import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { Download } from 'lucide-react';

export function TransactionHistory() {
  const [activeTab, setActiveTab] = useState('all');

  const transactions = [
    {
      id: 1,
      date: '01/05/2024',
      package: 'Gói tập PREMIUM',
      type: 'Gói phòng',
      amount: 2800000,
      method: 'VNPay',
      status: 'Thành công'
    },
    {
      id: 2,
      date: '15/05/2024',
      package: 'Whey Protein Gold Standard',
      type: 'Sản phẩm',
      amount: 1400000,
      method: 'Momo',
      status: 'Thành công'
    },
    {
      id: 3,
      date: '14/05/2024',
      package: 'Shaker Bottle 700ml',
      type: 'Sản phẩm',
      amount: 120000,
      method: 'Tiền mặt',
      status: 'Thành công'
    },
    {
      id: 4,
      date: '16/05/2024',
      package: 'Gói băng gối Mộc',
      type: 'Dịch vụ',
      amount: 500000,
      method: 'VNPay',
      status: 'Đang xử lý'
    },
  ];

  const tabs = [
    { id: 'all', name: 'Tất cả' },
    { id: 'package', name: 'Gói tập' },
    { id: 'product', name: 'Sản phẩm' },
    { id: 'service', name: 'Dịch vụ' }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const getFilteredTransactions = () => {
    if (activeTab === 'all') return transactions;
    const typeMap: { [key: string]: string } = {
      'package': 'Gói phòng',
      'product': 'Sản phẩm',
      'service': 'Dịch vụ'
    };
    return transactions.filter(t => t.type === typeMap[activeTab]);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử giao dịch</h1>
            <p className="text-slate-600">Theo dõi chi tiêu và thanh toán của bạn</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 inline-flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Nội dung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Số tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phương thức</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getFilteredTransactions().map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{transaction.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{transaction.package}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{transaction.type}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{formatPrice(transaction.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{transaction.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'Thành công'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm text-slate-600 mb-2">Tổng chi tiêu tháng này</h3>
            <p className="text-3xl font-bold text-slate-900">{formatPrice(4820000)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm text-slate-600 mb-2">Số giao dịch</h3>
            <p className="text-3xl font-bold text-indigo-600">{transactions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm text-slate-600 mb-2">Phương thức phổ biến</h3>
            <p className="text-3xl font-bold text-purple-600">VNPay</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
