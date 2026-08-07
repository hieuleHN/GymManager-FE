import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, Search, Plus, Eye, Power, Trash2, AlertTriangle, CheckCircle2, X, Save,
    RefreshCw, Wrench, Boxes, Banknote, CalendarClock, Settings2, UserRound
} from 'lucide-react';
import { toast } from 'sonner';

interface EquipmentItem {
    _id: string;
    equipmentCode: string;
    name: string;
    category: string;
    categoryLabel?: string;
    brand: string;
    model: string;
    quantity: number;
    inUse: number;
    damaged: number;
    underMaintenance: number;
    availableQuantity: number;
    unitPrice: number;
    totalValue: number;
    supplier: string;
    supplierPhone: string;
    supplierAddress: string;
    purchaser: string;
    location: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    statusLabel?: string;
    condition: 'GOOD' | 'MAINTENANCE' | 'DAMAGED' | 'REPAIRING';
    conditionLabel?: string;
    warrantyExpired?: boolean;
    warrantyMonths: number;
    pendingReportCount: number;
    purchaseDateLabel: string;
    nextMaintenanceDate: string | null;
    description: string;
}

interface StatsData {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    damagedCount: number;
    maintenanceDueCount: number;
    pendingReportCount: number;
    activeCount: number;
}

interface MetaData {
    categories: { key: string; label: string }[];
    statuses: { key: string; label: string }[];
    conditions: { key: string; label: string }[];
    reportTypes: { key: string; label: string }[];
}

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');

const CONDITION_STYLES: Record<string, string> = {
    GOOD: 'bg-emerald-100 text-emerald-700',
    MAINTENANCE: 'bg-amber-100 text-amber-700',
    DAMAGED: 'bg-red-100 text-red-700',
    REPAIRING: 'bg-sky-100 text-sky-700'
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    INACTIVE: 'bg-slate-100 text-slate-500',
    DISCONTINUED: 'bg-red-100 text-red-700'
};

const EMPTY_FORM = {
    name: '',
    category: 'OTHER',
    brand: '',
    model: '',
    quantity: '1',
    inUse: '0',
    damaged: '0',
    underMaintenance: '0',
    unitPrice: '0',
    supplier: '',
    supplierPhone: '',
    supplierAddress: '',
    purchaser: '',
    purchaseDate: toInputDate(new Date()),
    warrantyMonths: '12',
    location: '',
    nextMaintenanceDate: '',
    description: ''
};

export function EquipmentListV2() {
    const [items, setItems] = useState<EquipmentItem[]>([]);
    const [stats, setStats] = useState<StatsData>({ totalItems: 0, totalQuantity: 0, totalValue: 0, damagedCount: 0, maintenanceDueCount: 0, pendingReportCount: 0, activeCount: 0 });
    const [meta, setMeta] = useState<MetaData>({ categories: [], statuses: [], conditions: [], reportTypes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [conditionFilter, setConditionFilter] = useState('ALL');
    const [busyId, setBusyId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<EquipmentItem | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [detail, setDetail] = useState<EquipmentItem | null>(null);
    const [adjustTarget, setAdjustTarget] = useState<EquipmentItem | null>(null);
    const [adjust, setAdjust] = useState({ quantity: '1', inUse: '0', damaged: '0', underMaintenance: '0' });
    const [reportTarget, setReportTarget] = useState<EquipmentItem | null>(null);
    const [report, setReport] = useState({ reportType: 'DAMAGE', affectedQuantity: '1', reason: '', note: '' });
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('limit', '200');
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
            if (statusFilter !== 'ALL') params.append('status', statusFilter);
            if (conditionFilter !== 'ALL') params.append('condition', conditionFilter);
            const [listRes, statsRes] = await Promise.all([
                fetch(`${getApiUrl()}/api/v2/equipment?${params.toString()}`, { headers: getAuthHeaders() }),
                fetch(`${getApiUrl()}/api/v2/equipment/stats`, { headers: getAuthHeaders() })
            ]);
            const [listData, statsData] = await Promise.all([listRes.json(), statsRes.json()]);
            if (!listRes.ok) throw new Error(listData.message || 'Lỗi tải danh sách thiết bị');
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
    }, [categoryFilter, statusFilter, conditionFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchAll(), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/v2/equipment/meta`, { headers: getAuthHeaders() });
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

    const openEdit = (item: EquipmentItem) => {
        setEditing(item);
        setForm({
            name: item.name,
            category: item.category,
            brand: item.brand,
            model: item.model,
            quantity: String(item.quantity),
            inUse: String(item.inUse),
            damaged: String(item.damaged),
            underMaintenance: String(item.underMaintenance),
            unitPrice: String(item.unitPrice),
            supplier: item.supplier,
            supplierPhone: item.supplierPhone,
            supplierAddress: item.supplierAddress,
            purchaser: item.purchaser,
            purchaseDate: item.purchaseDateLabel || toInputDate(new Date()),
            warrantyMonths: String(item.warrantyMonths ?? 12),
            location: item.location,
            nextMaintenanceDate: item.nextMaintenanceDate ? toInputDate(new Date(item.nextMaintenanceDate)) : '',
            description: item.description
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Vui lòng nhập tên thiết bị!');
            return;
        }
        setSaving(true);
        try {
            const url = editing
                ? `/api/v2/equipment/${editing._id}`
                : `/api/v2/equipment`;
            const res = await fetch(`${getApiUrl()}${url}`, {
                method: editing ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lưu thất bại');
            toast.success(data.message || 'Đã lưu thiết bị!');
            setShowForm(false);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const openAdjust = (item: EquipmentItem) => {
        setAdjustTarget(item);
        setAdjust({
            quantity: String(item.quantity),
            inUse: String(item.inUse),
            damaged: String(item.damaged),
            underMaintenance: String(item.underMaintenance)
        });
    };

    const handleAdjust = () => {
        if (!adjustTarget) return;
        runAction(`/api/v2/equipment/${adjustTarget._id}/adjust-quantity`, 'POST', {
            quantity: parseInt(adjust.quantity) || 0,
            inUse: parseInt(adjust.inUse) || 0,
            damaged: parseInt(adjust.damaged) || 0,
            underMaintenance: parseInt(adjust.underMaintenance) || 0
        });
        setAdjustTarget(null);
    };

    const openReport = (item: EquipmentItem) => {
        setReportTarget(item);
        setReport({ reportType: 'DAMAGE', affectedQuantity: '1', reason: '', note: '' });
    };

    const handleReport = () => {
        if (!reportTarget) return;
        if (!report.reason.trim()) {
            toast.error('Vui lòng nhập lý do báo cáo!');
            return;
        }
        runAction(`/api/v2/equipment/${reportTarget._id}/reports`, 'POST', {
            reportType: report.reportType,
            affectedQuantity: parseInt(report.affectedQuantity) || 1,
            reason: report.reason.trim(),
            note: report.note
        });
        setReportTarget(null);
    };

    const handleToggleStatus = (item: EquipmentItem) => {
        const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (window.confirm(`${item.status === 'ACTIVE' ? 'Tạm ngừng' : 'Kích hoạt lại'} thiết bị "${item.name}"?`)) {
            runAction(`/api/v2/equipment/${item._id}/status`, 'PATCH', { status: next });
        }
    };

    const handleDelete = (item: EquipmentItem) => {
        if (window.confirm(`Xóa vĩnh viễn thiết bị "${item.name}"?`)) {
            runAction(`/api/v2/equipment/${item._id}`, 'DELETE', undefined, 'Đã xóa thiết bị');
        }
    };

    const statCards = [
        { label: 'Loại thiết bị', value: stats.totalItems, color: 'text-indigo-600', icon: Boxes },
        { label: 'Tổng số lượng', value: stats.totalQuantity, color: 'text-slate-900', icon: Boxes },
        { label: 'Giá trị tài sản', value: formatVnd(stats.totalValue), color: 'text-emerald-600', icon: Banknote },
        { label: 'Báo cáo chờ xử lý', value: stats.pendingReportCount, color: 'text-amber-600', icon: Wrench }
    ];

    const categoryLabel = (key: string) => meta.categories.find(c => c.key === key)?.label || key;
    const conditionLabel = (key: string) => meta.conditions.find(c => c.key === key)?.label || key;
    const statusLabel = (key: string) => meta.statuses.find(s => s.key === key)?.label || key;
    const reportTypeLabel = (key: string) => meta.reportTypes.find(r => r.key === key)?.label || key;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý thiết bị V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Theo dõi số lượng, tình trạng và báo cáo hỏng hóc thiết bị phòng tập</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Làm mới">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">
                            <Plus className="w-4 h-4" /> Thêm thiết bị
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                placeholder="Tìm mã, tên, thương hiệu, nhà cung cấp..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả danh mục</option>
                            {meta.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả trạng thái</option>
                            {meta.statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả tình trạng</option>
                            {meta.conditions.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">Thiết Bị</th>
                                    <th className="p-4">Danh Mục</th>
                                    <th className="p-4">Số Lượng</th>
                                    <th className="p-4">Giá</th>
                                    <th className="p-4">Tình Trạng</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">Không có thiết bị nào</td>
                                    </tr>
                                ) : items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <button onClick={() => setDetail(item)} className="font-semibold text-slate-800 hover:text-indigo-600 text-left">
                                                {item.name}
                                            </button>
                                            <div className="text-xs text-slate-400 font-mono">{item.equipmentCode}</div>
                                        </td>
                                        <td className="p-4 text-xs">{item.categoryLabel || categoryLabel(item.category)}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{item.availableQuantity}<span className="text-slate-400 font-normal">/{item.quantity}</span></div>
                                            <div className="text-[10px] text-slate-400">
                                                dùng {item.inUse} · bảo trì {item.underMaintenance} · hỏng {item.damaged}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs">{formatVnd(item.unitPrice)}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${CONDITION_STYLES[item.condition] || 'bg-slate-100 text-slate-500'}`}>
                                                {item.conditionLabel || conditionLabel(item.condition)}
                                            </span>
                                            {item.pendingReportCount > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                                    {item.pendingReportCount} báo cáo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-500'}`}>
                                                {item.statusLabel || statusLabel(item.status)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => setDetail(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Chi tiết">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openEdit(item)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Sửa">
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openAdjust(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Điều chỉnh số lượng">
                                                    <Boxes className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openReport(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Báo cáo">
                                                    <Wrench className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(item)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Bật/tắt">
                                                    <Power className="w-4 h-4" />
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
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{editing ? `Sửa thiết bị ${editing.equipmentCode}` : 'Thêm thiết bị mới'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tên thiết bị *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Danh mục</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {meta.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Thương hiệu</label>
                                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Model</label>
                                    <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Số lượng</label>
                                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đơn giá (VNĐ)</label>
                                <input type="number" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nhà cung cấp</label>
                                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vị trí đặt</label>
                                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ngày mua</label>
                                <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bảo hành (tháng)</label>
                                <input type="number" min="0" value={form.warrantyMonths} onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Lần bảo trì tới</label>
                                <input type="date" value={form.nextMaintenanceDate} onChange={(e) => setForm({ ...form, nextMaintenanceDate: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mô tả</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thiết bị
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {adjustTarget && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Điều chỉnh số lượng</h3>
                        <p className="text-sm text-slate-500 mb-4">{adjustTarget.name} · {adjustTarget.equipmentCode}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tổng số lượng</label>
                                <input type="number" min="1" value={adjust.quantity} onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đang sử dụng</label>
                                <input type="number" min="0" value={adjust.inUse} onChange={(e) => setAdjust({ ...adjust, inUse: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hỏng hóc</label>
                                <input type="number" min="0" value={adjust.damaged} onChange={(e) => setAdjust({ ...adjust, damaged: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bảo trì</label>
                                <input type="number" min="0" value={adjust.underMaintenance} onChange={(e) => setAdjust({ ...adjust, underMaintenance: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Số lượng sẵn sàng = tổng − đang dùng − hỏng − bảo trì.</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setAdjustTarget(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy</button>
                            <button onClick={handleAdjust} className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700">Lưu điều chỉnh</button>
                        </div>
                    </div>
                </div>
            )}

            {reportTarget && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Báo cáo thiết bị</h3>
                        <p className="text-sm text-slate-500 mb-4">{reportTarget.name} · {reportTarget.equipmentCode}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Loại báo cáo</label>
                                <select value={report.reportType} onChange={(e) => setReport({ ...report, reportType: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    {meta.reportTypes.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Số lượng</label>
                                <input type="number" min="1" max={report.reportType === 'DAMAGE' || report.reportType === 'MAINTENANCE' ? reportTarget.availableQuantity : reportTarget.quantity} value={report.affectedQuantity} onChange={(e) => setReport({ ...report, affectedQuantity: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Lý do *</label>
                            <textarea rows={2} value={report.reason} onChange={(e) => setReport({ ...report, reason: e.target.value })} placeholder="Mô tả sự cố..." className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div className="mt-3">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ghi chú</label>
                            <input value={report.note} onChange={(e) => setReport({ ...report, note: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setReportTarget(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy</button>
                            <button onClick={handleReport} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700">
                                <Wrench className="w-4 h-4" /> Gửi báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{detail.name}</h3>
                                <p className="text-xs text-slate-400 font-mono">{detail.equipmentCode}</p>
                            </div>
                            <button onClick={() => setDetail(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Danh mục</dt><dd className="font-semibold text-slate-800">{detail.categoryLabel || categoryLabel(detail.category)}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Tình trạng</dt><dd className="font-semibold text-slate-800">{detail.conditionLabel || conditionLabel(detail.condition)}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Trạng thái</dt><dd className="font-semibold text-slate-800">{detail.statusLabel || statusLabel(detail.status)}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Vị trí</dt><dd className="font-semibold text-slate-800">{detail.location || '—'}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Số lượng</dt><dd className="font-semibold text-slate-800">{detail.availableQuantity}/{detail.quantity} sẵn sàng</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Ngày mua</dt><dd className="font-semibold text-slate-800">{detail.purchaseDateLabel || '—'}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Bảo hành</dt><dd className="font-semibold text-slate-800">{detail.warrantyExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}</dd></div>
                            <div><dt className="text-xs text-slate-400 font-bold uppercase">Giá trị</dt><dd className="font-semibold text-slate-800 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> {formatVnd(detail.unitPrice)}</dd></div>
                            {detail.description && <div className="col-span-2"><dt className="text-xs text-slate-400 font-bold uppercase">Mô tả</dt><dd className="font-semibold text-slate-800">{detail.description}</dd></div>}
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
