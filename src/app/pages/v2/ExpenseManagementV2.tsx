import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, Plus, Eye, Trash2, AlertTriangle, X, Save, RefreshCw,
    Wrench, Zap, Receipt, DollarSign, Search, Wallet, CalendarClock
} from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseItem {
    _id: string;
    category: string;
    categoryLabel?: string;
    description: string;
    amount: number;
    amountLabel?: string;
    date: string;
    dateLabel: string;
    note: string;
}

interface StatsData {
    totalCount: number;
    totalAmount: number;
    thisMonthAmount: number;
    amountByCategory: Record<string, number>;
    categories: { key: string; label: string; amount: number; formattedAmount: string }[];
}

interface MetaData {
    categories: { key: string; label: string }[];
}

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');

const CATEGORY_STYLES: Record<string, string> = {
    EQUIPMENT: 'bg-blue-100 text-blue-700',
    UTILITIES: 'bg-emerald-100 text-emerald-700',
    TAX: 'bg-orange-100 text-orange-700',
    OTHER: 'bg-purple-100 text-purple-700'
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    EQUIPMENT: <Wrench className="w-4 h-4" />,
    UTILITIES: <Zap className="w-4 h-4" />,
    TAX: <Receipt className="w-4 h-4" />,
    OTHER: <DollarSign className="w-4 h-4" />
};

const EMPTY_FORM = {
    category: 'EQUIPMENT',
    description: '',
    amount: '',
    date: toInputDate(new Date()),
    note: ''
};

export function ExpenseManagementV2() {
    const [items, setItems] = useState<ExpenseItem[]>([]);
    const [stats, setStats] = useState<StatsData>({
        totalCount: 0, totalAmount: 0, thisMonthAmount: 0,
        amountByCategory: {}, categories: []
    });
    const [meta, setMeta] = useState<MetaData>({ categories: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [busyId, setBusyId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ExpenseItem | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [detail, setDetail] = useState<ExpenseItem | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('limit', '200');
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
            const [listRes, statsRes] = await Promise.all([
                fetch(`${getApiUrl()}/api/v2/expenses?${params.toString()}`, { headers: getAuthHeaders() }),
                fetch(`${getApiUrl()}/api/v2/expenses/stats`, { headers: getAuthHeaders() })
            ]);
            const [listData, statsData] = await Promise.all([listRes.json(), statsRes.json()]);
            if (!listRes.ok) throw new Error(listData.message || 'Lỗi tải danh sách chi phí');
            setItems(listData.data || []);
            if (statsData?.data) setStats(statsData.data);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [categoryFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchAll(), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/v2/expenses/meta`, { headers: getAuthHeaders() });
                const data = await res.json();
                if (res.ok) setMeta(data.data);
            } catch { /* ignore */ }
        };
        fetchMeta();
    }, []);

    const runAction = async (url: string, method: string, body?: any, successMsg?: string) => {
        setBusyId(url);
        try {
            const res = await fetch(`${getApiUrl()}${url}`, {
                method,
                headers: getAuthHeaders(),
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Thao tác thất bại');
            toast.success(successMsg || data.message || 'Thành công!');
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Thao tác thất bại');
        } finally {
            setBusyId(null);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    };

    const openEdit = (item: ExpenseItem) => {
        setEditing(item);
        setForm({
            category: item.category,
            description: item.description,
            amount: String(item.amount),
            date: item.dateLabel || toInputDate(new Date()),
            note: item.note
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.description.trim()) {
            toast.error('Vui lòng nhập mô tả chi phí!');
            return;
        }
        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            toast.error('Số tiền phải lớn hơn 0!');
            return;
        }
        if (!form.date) {
            toast.error('Vui lòng chọn ngày!');
            return;
        }
        setSaving(true);
        try {
            const url = editing
                ? `/api/v2/expenses/${editing._id}`
                : `/api/v2/expenses`;
            const res = await fetch(`${getApiUrl()}${url}`, {
                method: editing ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...form, amount })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lưu thất bại');
            toast.success(data.message || 'Đã lưu khoản chi!');
            setShowForm(false);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item: ExpenseItem) => {
        if (window.confirm(`Xóa khoản chi "${item.description}" (${formatVnd(item.amount)}₫)?`)) {
            runAction(`/api/v2/expenses/${item._id}`, 'DELETE', undefined, 'Đã xóa khoản chi');
        }
    };

    const statCards = [
        { label: 'Tổng khoản chi', value: stats.totalCount, color: 'text-slate-900', icon: Wallet },
        { label: 'Tổng chi phí', value: formatVnd(stats.totalAmount), color: 'text-indigo-600', icon: DollarSign },
        { label: 'Chi phí tháng này', value: formatVnd(stats.thisMonthAmount), color: 'text-amber-600', icon: CalendarClock }
    ];

    const categoryLabel = (key: string) => meta.categories.find(c => c.key === key)?.label || key;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý chi phí V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Theo dõi các khoản chi phí vận hành phòng tập: sửa thiết bị, điện nước, thuế...</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Làm mới">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">
                            <Plus className="w-4 h-4" /> Thêm chi phí
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {statCards.map(card => (
                        <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-slate-400 uppercase">{card.label}</p>
                                <card.icon className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {stats.categories.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.categories.map(cat => (
                            <div key={cat.key} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <span className={`p-2.5 rounded-xl ${CATEGORY_STYLES[cat.key] || 'bg-slate-100 text-slate-500'}`}>
                                    {CATEGORY_ICONS[cat.key]}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">{cat.label}</p>
                                    <p className="text-lg font-black text-slate-900">{formatVnd(cat.amount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mô tả, ghi chú, số tiền..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả loại</option>
                            {meta.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">Mô Tả</th>
                                    <th className="p-4">Loại</th>
                                    <th className="p-4">Ngày</th>
                                    <th className="p-4">Số Tiền</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">Không có khoản chi nào</td>
                                    </tr>
                                ) : items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <button onClick={() => setDetail(item)} className="font-semibold text-slate-800 hover:text-indigo-600 text-left">
                                                {item.description}
                                            </button>
                                            {item.note && <div className="text-xs text-slate-400">{item.note}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${CATEGORY_STYLES[item.category] || 'bg-slate-100 text-slate-500'}`}>
                                                {item.categoryLabel || categoryLabel(item.category)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs">{item.dateLabel || new Date(item.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4 font-bold text-indigo-600">{formatVnd(item.amount)}₫</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => setDetail(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Chi tiết">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openEdit(item)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Sửa">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
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

            {showForm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Sửa khoản chi' : 'Thêm chi phí mới'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Loại chi phí *</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {meta.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mô tả *</label>
                                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Số tiền (VNĐ) *</label>
                                    <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ngày *</label>
                                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ghi chú</label>
                                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{detail.description}</h3>
                                <p className="text-xs text-slate-400">{detail.dateLabel || new Date(detail.date).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <button onClick={() => setDetail(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Loại</dt><dd className="font-semibold text-slate-800">{detail.categoryLabel || categoryLabel(detail.category)}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Số tiền</dt><dd className="font-semibold text-slate-800">{formatVnd(detail.amount)}₫</dd></div>
                            {detail.note && <div className="col-span-2"><dt className="text-xs text-slate-400 font-bold uppercase">Ghi chú</dt><dd className="font-semibold text-slate-800">{detail.note}</dd></div>}
                        </dl>
                        <div className="flex justify-end mt-5">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
