import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Plus, Edit2, Trash2, Wrench, Wifi, Droplet, Zap, Receipt, Calendar, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface Expense {
  _id: string;
  category: 'equipment' | 'utilities' | 'tax' | 'other';
  description: string;
  amount: number;
  date: string;
  note?: string;
}

interface ExpenseFormData {
  category: 'equipment' | 'utilities' | 'tax' | 'other';
  description: string;
  amount: string;
  date: string;
  note: string;
}

export function ExpenseManagement() {
  const headers = getAuthHeaders();
  const { selectedClub, clubs } = useClub();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit: onFormSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    defaultValues: { category: 'equipment', description: '', amount: '', date: '', note: '' }
  });

  const fetchExpenses = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub && selectedClub !== 'all'
        ? `/api/expenses?locationId=${selectedClub}`
        : '/api/expenses';
      const url = `${base}${base.includes('?') ? '&' : '?'}page=${p}&limit=15`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setExpenses(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách chi phí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchExpenses(1); }, [selectedClub]);

  const getCategoryIcon = (category: Expense['category']) => {
    switch (category) {
      case 'equipment': return <Wrench className="w-5 h-5" />;
      case 'utilities': return <Zap className="w-5 h-5" />;
      case 'tax': return <Receipt className="w-5 h-5" />;
      case 'other': return <DollarSign className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: Expense['category']) => {
    switch (category) {
      case 'equipment': return 'Sửa thiết bị';
      case 'utilities': return 'Điện, nước, internet';
      case 'tax': return 'Thuế';
      case 'other': return 'Khác';
    }
  };

  const getCategoryColor = (category: Expense['category']) => {
    switch (category) {
      case 'equipment': return 'bg-blue-100 text-blue-700';
      case 'utilities': return 'bg-green-100 text-green-700';
      case 'tax': return 'bg-orange-100 text-orange-700';
      case 'other': return 'bg-purple-100 text-purple-700';
    }
  };

  const filteredExpenses = selectedCategory === 'all'
    ? expenses : expenses.filter(e => e.category === selectedCategory);

  const totalByCategory = {
    equipment: expenses.filter(e => e.category === 'equipment').reduce((sum, e) => sum + e.amount, 0),
    utilities: expenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
    tax: expenses.filter(e => e.category === 'tax').reduce((sum, e) => sum + e.amount, 0),
    other: expenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.amount, 0),
  };
  const totalExpenses = Object.values(totalByCategory).reduce((sum, v) => sum + v, 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const openAdd = () => {
    setEditing(null);
    reset();
    setShowModal(true);
  };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    reset({
      category: exp.category,
      description: exp.description,
      amount: exp.amount.toString(),
      date: exp.date ? exp.date.split('T')[0] : '',
      note: exp.note || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    try {
      const body: any = {
        category: data.category,
        description: data.description.trim(),
        amount: Number(data.amount),
        date: data.date,
        note: data.note,
      };
      if (!editing && selectedClub && selectedClub !== 'all') body.locationId = selectedClub;
      const url = editing ? `/api/expenses/${editing._id}` : '/api/expenses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      toast.success(editing ? 'Cập nhật chi phí thành công!' : 'Thêm chi phí thành công!');
      setShowModal(false);
      reset();
      setPage(1); fetchExpenses(1);
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã xóa chi phí');
      fetchExpenses();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý chi phí</h1>
            <p className="text-slate-600 mt-2">
              {selectedClub === 'all' ? 'Tất cả cơ sở' : clubs.find(c => c._id === selectedClub)?.address || 'Đã chọn'}
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            <Plus className="w-5 h-5" /> Thêm chi phí
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2"><DollarSign className="w-6 h-6" /><h3 className="font-semibold">Tổng chi phí</h3></div>
            <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          {(['equipment', 'utilities', 'tax', 'other'] as const).map(cat => (
            <div key={cat} className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className={`flex items-center gap-3 mb-2 ${getCategoryColor(cat).split(' ')[1]}`}>
                {getCategoryIcon(cat)}<h3 className="font-semibold text-slate-900">{getCategoryName(cat)}</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalByCategory[cat])}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Lọc theo loại:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="all">Tất cả</option>
              <option value="equipment">Sửa thiết bị</option>
              <option value="utilities">Điện, nước, internet</option>
              <option value="tax">Thuế</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách chi phí</h2>
            <p className="text-sm text-slate-600 mt-1">Hiển thị {filteredExpenses.length} / {expenses.length} khoản chi</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredExpenses.map((expense) => (
                <div key={expense._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getCategoryColor(expense.category)}`}>{getCategoryIcon(expense.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{expense.description}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(expense.category)}`}>{getCategoryName(expense.category)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(expense.date).toLocaleDateString('vi-VN')}</div>
                          <div className="text-2xl font-bold text-indigo-600">{formatCurrency(expense.amount)}</div>
                        </div>
                        {expense.note && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-2"><span className="font-semibold">Ghi chú:</span> {expense.note}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(expense)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(expense._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExpenses.length === 0 && <div className="p-8 text-center text-slate-500">Chưa có khoản chi nào</div>}
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchExpenses(p); }} />}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">{editing ? 'Sửa chi phí' : 'Thêm chi phí mới'}</h3>
            </div>
            <form onSubmit={onFormSubmit(onSubmit)}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Loại chi phí <span className="text-red-500">*</span></label>
                  <select {...register('category')}
                    className={`w-full px-4 py-3 border ${errors.category ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}>
                    <option value="equipment">Sửa thiết bị</option>
                    <option value="utilities">Điện, nước, internet</option>
                    <option value="tax">Thuế</option>
                    <option value="other">Khác</option>
                  </select>
                  {errors.category && <span className="text-red-500 text-sm mt-1">{errors.category.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả <span className="text-red-500">*</span></label>
                  <input type="text" {...register('description', { required: 'Vui lòng nhập mô tả' })}
                    className={`w-full px-4 py-3 border ${errors.description ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} />
                  {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                    <input type="number" {...register('amount', {
                      required: 'Vui lòng nhập số tiền',
                      validate: (value) => Number(value) > 0 || 'Số tiền phải lớn hơn 0'
                    })}
                      className={`w-full px-4 py-3 border ${errors.amount ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} />
                    {errors.amount && <span className="text-red-500 text-sm mt-1">{errors.amount.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ngày <span className="text-red-500">*</span></label>
                    <input type="date" {...register('date', { required: 'Vui lòng chọn ngày' })}
                      className={`w-full px-4 py-3 border ${errors.date ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} />
                    {errors.date && <span className="text-red-500 text-sm mt-1">{errors.date.message}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú</label>
                  <textarea {...register('note')}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm chi phí'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
