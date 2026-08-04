import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Search, Plus, Edit, Trash2, Eye, Power, Loader2, AlertTriangle,
    CheckCircle2, X, Save, BadgePercent, Dumbbell, CalendarDays, Wallet
} from 'lucide-react';

const TYPE_FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'STANDARD', label: 'Tiêu chuẩn' },
    { key: 'COMBO', label: 'Combo' },
    { key: 'PT', label: 'PT' }
];

const TYPE_STYLES: Record<string, string> = {
    STANDARD: 'bg-indigo-100 text-indigo-700',
    COMBO: 'bg-amber-100 text-amber-700',
    PT: 'bg-emerald-100 text-emerald-700'
};

const TYPE_LABELS: Record<string, string> = {
    STANDARD: 'Tiêu chuẩn',
    COMBO: 'Combo',
    PT: 'PT'
};

interface PackageItem {
    _id: string;
    name: string;
    type: 'STANDARD' | 'COMBO' | 'PT';
    price: number;
    originalPrice: number;
    discountPercent: number;
    durationMonths: number;
    durationDays: number;
    ptSessionsPerMonth: number;
    isFullMonth: boolean;
    features: string[];
    description: string;
    image: string;
    status: 'ACTIVE' | 'INACTIVE';
    sold: number;
    totalRevenue: number;
    effectivePrice: number;
    durationLabel: string;
}

interface SummaryData {
    total: number;
    activeCount: number;
    inactiveCount: number;
    totalSold: number;
    totalRevenue: number;
    totalValue: number;
}

interface PackageForm {
    name: string;
    type: string;
    price: string;
    originalPrice: string;
    discountPercent: string;
    durationMonths: string;
    durationDays: string;
    ptSessionsPerMonth: string;
    isFullMonth: boolean;
    features: string;
    description: string;
    image: string;
}

const emptyForm: PackageForm = {
    name: '',
    type: 'STANDARD',
    price: '',
    originalPrice: '',
    discountPercent: '0',
    durationMonths: '1',
    durationDays: '30',
    ptSessionsPerMonth: '0',
    isFullMonth: false,
    features: '',
    description: '',
    image: ''
};

const resolveImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${getApiUrl()}/${image.replace(/^\/+/, '')}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');

export function PackageListV2() {
    const navigate = useNavigate();
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ total: 0, activeCount: 0, inactiveCount: 0, totalSold: 0, totalRevenue: 0, totalValue: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PackageForm>(emptyForm);
    const [modalError, setModalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchPackages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách gói tập');
            setPackages(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages/summary`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setSummary(data.data);
        } catch {}
    };

    const refreshAll = () => {
        fetchPackages();
        fetchSummary();
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch =
            pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || pkg.type === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || pkg.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const handleToggleStatus = async (pkg: PackageItem) => {
        const action = pkg.status === 'ACTIVE' ? 'tạm dừng' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${action} gói "${pkg.name}"?`)) return;
        setToggling(pkg._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages/${pkg._id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Thay đổi trạng thái thất bại');
            showBanner(data.message || 'Đã cập nhật trạng thái');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa gói tập "${name}"?`)) return;
        setDeleting(id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            showBanner('Xóa gói tập thành công');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setModalError('');
        setShowModal(true);
    };

    const openEditModal = (pkg: PackageItem) => {
        setEditingId(pkg._id);
        setForm({
            name: pkg.name,
            type: pkg.type,
            price: String(pkg.price ?? ''),
            originalPrice: String(pkg.originalPrice ?? ''),
            discountPercent: String(pkg.discountPercent ?? 0),
            durationMonths: String(pkg.durationMonths ?? 1),
            durationDays: String(pkg.durationDays ?? 30),
            ptSessionsPerMonth: String(pkg.ptSessionsPerMonth ?? 0),
            isFullMonth: !!pkg.isFullMonth,
            features: (pkg.features || []).join(', '),
            description: pkg.description || '',
            image: pkg.image || ''
        });
        setModalError('');
        setShowModal(true);
    };

    const handleSubmitModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!form.name.trim()) {
            setModalError('Vui lòng nhập tên gói tập');
            return;
        }
        if (form.price === '' || Number(form.price) < 0) {
            setModalError('Giá gói tập không hợp lệ');
            return;
        }
        if (Number(form.discountPercent) < 0 || Number(form.discountPercent) > 100) {
            setModalError('Phần trăm khuyến mãi phải trong khoảng 0 - 100');
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                name: form.name,
                type: form.type,
                price: Number(form.price),
                originalPrice: Number(form.originalPrice) || 0,
                discountPercent: Number(form.discountPercent) || 0,
                durationMonths: Number(form.durationMonths) || 0,
                durationDays: Number(form.durationDays) || 0,
                ptSessionsPerMonth: Number(form.ptSessionsPerMonth) || 0,
                isFullMonth: form.isFullMonth,
                features: form.features,
                description: form.description,
                image: form.image
            };
            const url = editingId
                ? `${getApiUrl()}/api/v2/packages/${editingId}`
                : `${getApiUrl()}/api/v2/packages`;
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || (editingId ? 'Cập nhật thất bại' : 'Thêm thất bại'));
            showBanner(data.message || (editingId ? 'Cập nhật gói tập thành công' : 'Thêm gói tập thành công'));
            setShowModal(false);
            refreshAll();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Gói tập V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Danh sách gói tập, khuyến mãi, đăng ký gói và theo dõi doanh thu</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/v2/packages/transactions')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            <Wallet className="w-4 h-4" /> Giao dịch
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Thêm gói tập
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng gói tập</p>
                        <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.activeCount} đang hoạt động</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tạm dừng</p>
                        <p className="text-3xl font-black text-amber-500">{summary.inactiveCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã đăng ký</p>
                        <p className="text-3xl font-black text-indigo-600">{summary.totalSold}</p>
                        <p className="text-xs text-slate-400 mt-1">lượt đăng ký gói</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Doanh thu</p>
                        <p className="text-3xl font-black text-emerald-600">{formatVnd(summary.totalRevenue)}đ</p>
                    </div>
                </div>

                {banner && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">{banner}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc mô tả gói tập..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        {TYPE_FILTERS.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setTypeFilter(item.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${typeFilter === item.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border-0 focus:outline-none"
                        >
                            <option value="ALL">Mọi trạng thái</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="INACTIVE">Tạm dừng</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">STT</th>
                                    <th className="p-4">Ảnh</th>
                                    <th className="p-4">Gói Tập</th>
                                    <th className="p-4">Loại</th>
                                    <th className="p-4">Giá</th>
                                    <th className="p-4">KM</th>
                                    <th className="p-4">Thời Hạn</th>
                                    <th className="p-4">PT</th>
                                    <th className="p-4">Đã ĐK</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="p-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPackages.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="p-10 text-center text-slate-400">
                                            Không tìm thấy gói tập nào
                                        </td>
                                    </tr>
                                ) : filteredPackages.map((pkg, index) => (
                                    <tr key={pkg._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-500">{index + 1}</td>
                                        <td className="p-4">
                                            {pkg.image ? (
                                                <img
                                                    src={resolveImageUrl(pkg.image)}
                                                    alt={pkg.name}
                                                    className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <Dumbbell className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">
                                            {pkg.name}
                                            <div className="text-xs text-slate-400 font-normal max-w-[220px] truncate">{pkg.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[pkg.type] || 'bg-slate-100 text-slate-500'}`}>
                                                {TYPE_LABELS[pkg.type] || pkg.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800">{formatVnd(pkg.effectivePrice ?? pkg.price)}đ</span>
                                            {(pkg.originalPrice || 0) > (pkg.effectivePrice ?? 0) && (
                                                <div className="text-xs text-slate-400 line-through">{formatVnd(pkg.originalPrice)}đ</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {(pkg.discountPercent || 0) > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">
                                                    <BadgePercent className="w-3.5 h-3.5" /> {pkg.discountPercent}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                                                <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {pkg.durationLabel}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {pkg.ptSessionsPerMonth > 0 ? `${pkg.ptSessionsPerMonth} buổi/tháng` : '—'}
                                        </td>
                                        <td className="p-4 font-semibold text-indigo-600">{pkg.sold ?? 0}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pkg.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {pkg.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/admin/v2/packages/${pkg._id}`)}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(pkg)}
                                                    disabled={toggling === pkg._id}
                                                    className={`p-2 rounded-lg disabled:opacity-50 ${pkg.status === 'ACTIVE'
                                                        ? 'text-amber-600 hover:bg-amber-50'
                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    title={pkg.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                                                >
                                                    {toggling === pkg._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Power className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(pkg)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pkg._id, pkg.name)}
                                                    disabled={deleting === pkg._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {deleting === pkg._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
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

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowModal(false); setEditingId(null); }}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingId ? 'Sửa gói tập' : 'Thêm gói tập'}
                            </h3>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitModal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tên Gói Tập <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Loại Gói</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="STANDARD">Gói tiêu chuẩn</option>
                                        <option value="COMBO">Gói combo</option>
                                        <option value="PT">Gói PT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Giá Bán (đ) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Giá Gốc (đ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.originalPrice}
                                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Khuyến Mãi (%)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={form.discountPercent}
                                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Thời Hạn (tháng)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.durationMonths}
                                        onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hoặc Số Ngày</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.durationDays}
                                        onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Buổi PT / Tháng</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.ptSessionsPerMonth}
                                        onChange={(e) => setForm({ ...form, ptSessionsPerMonth: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.isFullMonth}
                                    onChange={(e) => setForm({ ...form, isFullMonth: e.target.checked })}
                                    className="w-4 h-4 accent-indigo-600"
                                />
                                Trọn tháng (không giới hạn ngày nghỉ)
                            </label>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tính Năng (phân cách bằng dấu phẩy)</label>
                                <textarea
                                    rows={2}
                                    value={form.features}
                                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                                    placeholder="Phòng gym, Yoga, Tập luyện tự do..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mô Tả</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">URL Ảnh</label>
                                <input
                                    type="text"
                                    value={form.image}
                                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingId(null); }}
                                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {submitting ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Thêm Gói Tập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
