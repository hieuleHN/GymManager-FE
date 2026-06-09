import { useState } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Wrench, Wifi, Droplet, Zap, Receipt, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface Expense {
  id: string;
  category: 'equipment' | 'utilities' | 'tax' | 'other';
  description: string;
  amount: number;
  date: string;
  note?: string;
}

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      category: 'equipment',
      description: 'Sửa máy chạy bộ số 5',
      amount: 2500000,
      date: '2026-06-01',
      note: 'Thay thế băng chuyền và động cơ'
    },
    {
      id: '2',
      category: 'utilities',
      description: 'Tiền điện tháng 5/2026',
      amount: 15000000,
      date: '2026-06-02'
    },
    {
      id: '3',
      category: 'utilities',
      description: 'Tiền nước tháng 5/2026',
      amount: 3000000,
      date: '2026-06-02'
    },
    {
      id: '4',
      category: 'utilities',
      description: 'Tiền internet tháng 5/2026',
      amount: 1500000,
      date: '2026-06-02'
    },
    {
      id: '5',
      category: 'tax',
      description: 'Thuế VAT tháng 5/2026',
      amount: 8000000,
      date: '2026-06-03'
    },
    {
      id: '6',
      category: 'other',
      description: 'Mua thiết bị vệ sinh',
      amount: 500000,
      date: '2026-06-04',
      note: 'Nước lau sàn, khăn lau'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getCategoryIcon = (category: Expense['category']) => {
    switch (category) {
      case 'equipment':
        return <Wrench className="w-5 h-5" />;
      case 'utilities':
        return <Zap className="w-5 h-5" />;
      case 'tax':
        return <Receipt className="w-5 h-5" />;
      case 'other':
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: Expense['category']) => {
    switch (category) {
      case 'equipment':
        return 'Sửa thiết bị';
      case 'utilities':
        return 'Điện, nước, internet';
      case 'tax':
        return 'Thuế';
      case 'other':
        return 'Khác';
    }
  };

  const getCategoryColor = (category: Expense['category']) => {
    switch (category) {
      case 'equipment':
        return 'bg-blue-100 text-blue-700';
      case 'utilities':
        return 'bg-green-100 text-green-700';
      case 'tax':
        return 'bg-orange-100 text-orange-700';
      case 'other':
        return 'bg-purple-100 text-purple-700';
    }
  };

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const totalByCategory = {
    equipment: expenses.filter(e => e.category === 'equipment').reduce((sum, e) => sum + e.amount, 0),
    utilities: expenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
    tax: expenses.filter(e => e.category === 'tax').reduce((sum, e) => sum + e.amount, 0),
    other: expenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.amount, 0)
  };

  const totalExpenses = Object.values(totalByCategory).reduce((sum, val) => sum + val, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý chi phí</h1>
          <p className="text-slate-600 mt-2">Theo dõi và quản lý các khoản chi phí của phòng gym</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Thêm chi phí
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6" />
            <h3 className="font-semibold">Tổng chi phí</h3>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2 text-blue-600">
            <Wrench className="w-6 h-6" />
            <h3 className="font-semibold text-slate-900">Sửa thiết bị</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalByCategory.equipment)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2 text-green-600">
            <Zap className="w-6 h-6" />
            <h3 className="font-semibold text-slate-900">Điện, nước, internet</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalByCategory.utilities)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2 text-orange-600">
            <Receipt className="w-6 h-6" />
            <h3 className="font-semibold text-slate-900">Thuế</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalByCategory.tax)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2 text-purple-600">
            <DollarSign className="w-6 h-6" />
            <h3 className="font-semibold text-slate-900">Chi phí khác</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalByCategory.other)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Lọc theo loại:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="equipment">Sửa thiết bị</option>
            <option value="utilities">Điện, nước, internet</option>
            <option value="tax">Thuế</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Danh sách chi phí</h2>
          <p className="text-sm text-slate-600 mt-1">
            Hiển thị {filteredExpenses.length} / {expenses.length} khoản chi
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${getCategoryColor(expense.category)}`}>
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{expense.description}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                        {getCategoryName(expense.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(expense.date).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                    {expense.note && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-2">
                        <span className="font-semibold">Ghi chú:</span> {expense.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Thêm chi phí mới</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Loại chi phí</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="equipment">Sửa thiết bị</option>
                  <option value="utilities">Điện, nước, internet</option>
                  <option value="tax">Thuế</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập mô tả chi phí"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ngày</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                Thêm chi phí
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
