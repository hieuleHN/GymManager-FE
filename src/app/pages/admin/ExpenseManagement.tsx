import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Plus, Edit2, Trash2, Wrench, Wifi, Droplet, Zap, Receipt, Calendar, Loader2, Package, Search, X } from 'lucide-react';
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
  locationId: string;
}

export function ExpenseManagement() {
  const { selectedClub, clubs } = useClub();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [importCost, setImportCost] = useState(0);
  const [equipmentCost, setEquipmentCost] = useState(0);
  const [summary, setSummary] = useState({ equipment: 0, utilities: 0, tax: 0, other: 0, all: 0, count: 0 });
  const [drilldown, setDrilldown] = useState<{ title: string; subtitle: string; columns: string[]; rows: any[] } | null>(null);
  const [drillSearch, setDrillSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);

  const { register, handleSubmit: onFormSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    defaultValues: { category: 'equipment', description: '', amount: '', date: '', note: '', locationId: '' }
  });

  const fetchExpenses = async (p = page, club?: string, cat?: string, search?: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '15');
      const clubVal = club ?? selectedClub;
      if (clubVal && clubVal !== 'all') params.set('locationId', clubVal);
      const catVal = cat ?? selectedCategory;
      if (catVal && catVal !== 'all') params.set('category', catVal);
      const searchVal = search ?? searchText;
      if (searchVal.trim()) params.set('search', searchVal.trim());
      const fromVal = from ?? dateFrom;
      const toVal = to ?? dateTo;
      if (fromVal) params.set('startDate', fromVal);
      if (toVal) params.set('endDate', toVal);
      const res = await fetch(`/api/expenses?${params.toString()}`, { headers: getAuthHeaders() });
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

  const fetchSummary = async (club?: string, search?: string, from?: string, to?: string) => {
    try {
      const params = new URLSearchParams();
      const clubVal = club ?? selectedClub;
      if (clubVal && clubVal !== 'all') params.set('locationId', clubVal);
      const searchVal = search ?? searchText;
      if (searchVal.trim()) params.set('search', searchVal.trim());
      const fromVal = from ?? dateFrom;
      const toVal = to ?? dateTo;
      if (fromVal) params.set('startDate', fromVal);
      if (toVal) params.set('endDate', toVal);
      const res = await fetch(`/api/expenses/summary?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data);
    } catch {}
  };

  useEffect(() => {
    setPage(1);
    fetchExpenses(1, selectedClub, selectedCategory, searchText, dateFrom, dateTo);
    fetchSummary(selectedClub, searchText, dateFrom, dateTo);
  }, [selectedClub, selectedCategory, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchExpenses(1, selectedClub, selectedCategory, searchText, dateFrom, dateTo);
      fetchSummary(selectedClub, searchText, dateFrom, dateTo);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const fetchImportCost = async () => {
      try {
        const base = selectedClub && selectedClub !== 'all'
          ? `/api/products?locationId=${selectedClub}`
          : '/api/products';
        const res = await fetch(base, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.data || [];
        setProducts(list);
        const total = list.reduce((sum: number, p: any) => sum + (p.costPrice || 0) * (p.importQuantity || p.quantity || 0), 0);
        setImportCost(total);
      } catch {}
    };
    fetchImportCost();
  }, [selectedClub]);

  useEffect(() => {
    const fetchEquipmentCost = async () => {
      try {
        const base = selectedClub && selectedClub !== 'all'
          ? `/api/equipments?locationId=${selectedClub}`
          : '/api/equipments';
        const res = await fetch(base, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.data || data || [];
        setEquipments(Array.isArray(list) ? list : []);
        const total = (Array.isArray(list) ? list : []).reduce((sum: number, e: any) => sum + (e.total || 0), 0);
        setEquipmentCost(total);
      } catch {}
    };
    fetchEquipmentCost();
  }, [selectedClub]);
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

  const filteredExpenses = expenses;

  const totalExpenses = summary.all + importCost + equipmentCost;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const drillFilteredRows = useMemo(() => {
    if (!drilldown) return [];
    if (!drillSearch.trim()) return drilldown.rows;
    const q = drillSearch.toLowerCase();
    return drilldown.rows.filter(row => Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q)));
  }, [drilldown, drillSearch]);

  const drillAllExpenses = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedClub && selectedClub !== 'all') params.set('locationId', selectedClub);
    return { params };
  }, [selectedClub]);

  const openDrillAll = async () => {
    try {
      const params = new URLSearchParams(drillAllExpenses.params);
      params.set('limit', '9999');
      const res = await fetch(`/api/expenses?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const rows = (data.data || []).map((e: any) => ({
        'Mô tả': e.description,
        'Loại': getCategoryName(e.category),
        'Số tiền': formatCurrency(e.amount),
        'Ngày': new Date(e.date).toLocaleDateString('vi-VN'),
        'Ghi chú': e.note || '—',
      }));
      setDrilldown({ title: 'Tất cả chi phí', subtitle: `${rows.length} khoản chi — Tổng: ${formatCurrency(summary.all)}`, columns: ['Mô tả', 'Loại', 'Số tiền', 'Ngày', 'Ghi chú'], rows });
      setDrillSearch('');
    } catch {}
  };

  const openDrillCategory = async (cat: string, label: string) => {
    try {
      const params = new URLSearchParams(drillAllExpenses.params);
      params.set('category', cat);
      params.set('limit', '9999');
      const res = await fetch(`/api/expenses?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const rows = (data.data || []).map((e: any) => ({
        'Mô tả': e.description,
        'Số tiền': formatCurrency(e.amount),
        'Ngày': new Date(e.date).toLocaleDateString('vi-VN'),
        'Ghi chú': e.note || '—',
      }));
      setDrilldown({ title: label, subtitle: `${rows.length} khoản chi — Tổng: ${formatCurrency(summary[cat as keyof typeof summary] || 0)}`, columns: ['Mô tả', 'Số tiền', 'Ngày', 'Ghi chú'], rows });
      setDrillSearch('');
    } catch {}
  };

  const openDrillImport = () => {
    const rows = products.map((p: any) => ({
      'Tên hàng': p.name || p.title || '—',
      'Giá vốn': formatCurrency(p.costPrice || 0),
      'Số lượng': p.importQuantity || p.quantity || 0,
      'Thành tiền': formatCurrency((p.costPrice || 0) * (p.importQuantity || p.quantity || 0)),
    }));
    setDrilldown({ title: 'Tiền nhập hàng', subtitle: `${rows.length} mặt hàng — Tổng: ${formatCurrency(importCost)}`, columns: ['Tên hàng', 'Giá vốn', 'Số lượng', 'Thành tiền'], rows });
    setDrillSearch('');
  };

  const openDrillEquipment = () => {
    const rows = equipments.map((e: any) => ({
      'Tên thiết bị': e.name || '—',
      'Nguyên giá': formatCurrency(e.total || 0),
      'Thời gian mua': e.createdAt ? new Date(e.createdAt).toLocaleDateString('vi-VN') : '—',
      'Tình trạng': e.status || 'active',
    }));
    setDrilldown({ title: 'Tiền thiết bị', subtitle: `${rows.length} thiết bị — Tổng: ${formatCurrency(equipmentCost)}`, columns: ['Tên thiết bị', 'Nguyên giá', 'Thời gian mua', 'Tình trạng'], rows });
    setDrillSearch('');
  };

  const openAdd = () => {
    setEditing(null);
    reset({ category: 'equipment', description: '', amount: '', date: '', note: '', locationId: selectedClub === 'all' ? '' : selectedClub });
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
      locationId: (exp as any).locationId || '',
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
      const clubId = data.locationId || selectedClub;
      if (clubId && clubId !== 'all') body.locationId = clubId;
      const url = editing ? `/api/expenses/${editing._id}` : '/api/expenses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || resData.message || 'Thao tác thất bại');
      toast.success(resData.message || (editing ? 'Cập nhật chi phí thành công!' : 'Thêm chi phí thành công!'));
      setShowModal(false);
      reset();
      setPage(1); fetchExpenses(1, selectedClub, selectedCategory, searchText, dateFrom, dateTo); fetchSummary(selectedClub, searchText, dateFrom, dateTo);
    } catch (e: any) {
      toast.error(e.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || resData.message || 'Xóa thất bại');
      toast.success(resData.message || 'Đã xóa chi phí');
      fetchExpenses(page, selectedClub, selectedCategory, searchText, dateFrom, dateTo); fetchSummary(selectedClub, searchText, dateFrom, dateTo);
    } catch (e: any) {
      toast.error(e.message || 'Xóa thất bại');
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

        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div onClick={openDrillAll}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3 mb-2"><DollarSign className="w-6 h-6" /><h3 className="font-semibold">Tổng chi phí</h3></div>
            <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          <div onClick={openDrillImport}
            className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3 mb-2 text-amber-600">
              <Package className="w-6 h-6" /><h3 className="font-semibold text-slate-900">Tiền nhập hàng</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(importCost)}</p>
          </div>
          <div onClick={openDrillEquipment}
            className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
              <Wrench className="w-6 h-6" /><h3 className="font-semibold text-slate-900">Tiền thiết bị</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(equipmentCost)}</p>
          </div>
          {(['equipment', 'utilities', 'tax', 'other'] as const).map(cat => (
            <div key={cat} onClick={() => openDrillCategory(cat, getCategoryName(cat))}
              className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all">
              <div className={`flex items-center gap-3 mb-2 ${getCategoryColor(cat).split(' ')[1]}`}>
                {getCategoryIcon(cat)}<h3 className="font-semibold text-slate-900">{getCategoryName(cat)}</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary[cat])}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Lọc:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="all">Tất cả loại</option>
              <option value="equipment">Sửa thiết bị</option>
              <option value="utilities">Điện, nước, internet</option>
              <option value="tax">Thuế</option>
              <option value="other">Khác</option>
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm theo mô tả, ghi chú..."
                className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              <span className="text-slate-400">—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            {(dateFrom || dateTo || searchText) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchText(''); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách chi phí</h2>
            <p className="text-sm text-slate-600 mt-1">Hiển thị {filteredExpenses.length} / {total} khoản chi{selectedCategory !== 'all' ? ` (lọc: ${getCategoryName(selectedCategory as any)})` : ''}</p>
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
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchExpenses(p, selectedClub, selectedCategory, searchText, dateFrom, dateTo); }} />}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Câu lạc bộ <span className="text-red-500">*</span></label>
                  <select {...register('locationId', { required: 'Vui lòng chọn câu lạc bộ' })}
                    className={`w-full px-4 py-3 border ${errors.locationId ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}>
                    <option value="">Chọn câu lạc bộ</option>
                    {clubs.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name || c.address}</option>
                    ))}
                  </select>
                  {errors.locationId && <span className="text-red-500 text-sm mt-1">{errors.locationId.message}</span>}
                </div>
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

      {drilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDrilldown(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-slate-100">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{drilldown.title}</h3>
                <p className="text-sm text-slate-500">{drilldown.subtitle}</p>
              </div>
              <button onClick={() => setDrilldown(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {drilldown.rows.length > 3 && (
              <div className="px-5 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                  {drillSearch && (
                    <button onClick={() => setDrillSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">
              {drillFilteredRows.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                      <tr>
                        {drilldown.columns.map(col => (
                          <th key={col} className={`py-2.5 px-3 text-slate-600 font-medium ${['Số tiền', 'Thành tiền', 'Giá vốn', 'Nguyên giá'].includes(col) ? 'text-right' : 'text-left'}`}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drillFilteredRows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                          {drilldown.columns.map(col => {
                            const isMoney = ['Số tiền', 'Thành tiền', 'Giá vốn', 'Nguyên giá'].includes(col);
                            return (
                              <td key={col} className={`py-2.5 px-3 ${isMoney ? 'text-right font-medium text-slate-800' : 'text-slate-700'}`}>
                                {row[col] ?? '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <p className="text-sm">{drillSearch ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-4">
              <button onClick={() => setDrilldown(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
