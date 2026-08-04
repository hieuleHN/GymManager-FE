import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Search, Plus, Eye, Power, Trash2, Loader2, AlertTriangle, CheckCircle2, X, Save,
    RefreshCw, UserRound, Dumbbell, CalendarDays, Wallet, Phone, Mail, Banknote, HandCoins, MessageSquareQuote
} from 'lucide-react';

const STATUS_FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'ACTIVE', label: 'Đang hoạt động' },
    { key: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
    { key: 'EXPIRED', label: 'Đã hết hạn' },
    { key: 'CANCELLED', label: 'Đã hủy' }
];

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    EXPIRING_SOON: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500'
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    EXPIRING_SOON: 'Sắp hết hạn',
    EXPIRED: 'Đã hết hạn',
    CANCELLED: 'Đã hủy'
};

const PAYMENT_STYLES: Record<string, string> = {
    PAID: 'bg-emerald-50 text-emerald-600',
    PENDING: 'bg-amber-50 text-amber-600',
    CANCELLED: 'bg-slate-100 text-slate-500'
};

const PAYMENT_LABELS: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PENDING: 'Chờ thanh toán',
    CANCELLED: 'Đã hủy'
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: 'Tiền mặt',
    TRANSFER: 'Chuyển khoản',
    CARD: 'Thẻ'
};

interface PackageOption {
    _id: string;
    name: string;
    durationMonths: number;
    durationDays: number;
    ptSessionsPerMonth: number;
    effectivePrice: number;
    price: number;
}

interface Membership {
    _id: string;
    membershipCode: string;
    customerId: any;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    packageId: any;
    packageName: string;
    packageType: string;
    durationMonths: number;
    ptSessionsPerMonth: number;
    usedSessions: number;
    sessionsLeft: number;
    startDate: string;
    endDate: string;
    totalPrice: number;
    paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
    paymentMethod: string;
    paidAt: string | null;
    note: string;
    status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';
    remainingDays: number;
    progressPercent: number;
    createdAt: string;
}

interface SummaryData {
    total: number;
    activeCount: number;
    expiringCount: number;
    expiredCount: number;
    cancelledCount: number;
    pendingPaymentCount: number;
    totalRevenue: number;
    totalCustomers: number;
}

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');
const formatDate = (value: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export function MyPackagesV2() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ total: 0, activeCount: 0, expiringCount: 0, expiredCount: 0, cancelledCount: 0, pendingPaymentCount: 0, totalRevenue: 0, totalCustomers: 0 });
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [showRegister, setShowRegister] = useState(false);
    const [showDetail, setShowDetail] = useState<Membership | null>(null);
    const [showExtend, setShowExtend] = useState<Membership | null>(null);
    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        packageId: '',
        durationMonths: '1',
        startDate: new Date().toISOString().split('T')[0],
        totalPrice: '',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        note: ''
    });
    const [extendForm, setExtendForm] = useState({ addMonths: '1', additionalPrice: '' });
    const [modalError, setModalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchMemberships = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách gói hội viên');
            setMemberships(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/summary`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setSummary(data.data);
        } catch {}
    };

    const fetchPackages = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setPackages(data.data.filter((pkg: any) => pkg.status === 'ACTIVE'));
        } catch {}
    };

    const refreshAll = () => {
        fetchMemberships();
        fetchSummary();
        fetchPackages();
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const filteredMemberships = memberships.filter(m => {
        const matchesSearch =
            m.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.customerPhone?.includes(searchTerm) ||
            m.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.membershipCode || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
        const matchesPayment = paymentFilter === 'ALL' || m.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const handleRefreshStatus = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/refresh-status`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');
            showBanner(data.message || 'Đã cập nhật trạng thái gói hội viên');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    const openRegisterModal = () => {
        setForm({
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            packageId: '',
            durationMonths: '1',
            startDate: new Date().toISOString().split('T')[0],
            totalPrice: '',
            paymentStatus: 'PAID',
            paymentMethod: 'CASH',
            note: ''
        });
        setModalError('');
        setShowRegister(true);
    };

    const handlePackageSelect = (packageId: string) => {
        const selected = packages.find(pkg => pkg._id === packageId);
        setForm(prev => ({
            ...prev,
            packageId,
            durationMonths: selected && selected.durationMonths > 0 ? String(selected.durationMonths) : prev.durationMonths,
            totalPrice: selected ? String(selected.effectivePrice ?? selected.price ?? '') : prev.totalPrice
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!form.customerName.trim()) {
            setModalError('Vui lòng nhập tên hội viên');
            return;
        }
        if (!form.customerPhone.trim()) {
            setModalError('Vui lòng nhập số điện thoại hội viên');
            return;
        }
        if (!form.packageId) {
            setModalError('Vui lòng chọn gói tập');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/register`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    customerName: form.customerName,
                    customerPhone: form.customerPhone,
                    customerEmail: form.customerEmail,
                    packageId: form.packageId,
                    durationMonths: Number(form.durationMonths) || 1,
                    startDate: form.startDate,
                    totalPrice: Number(form.totalPrice) || 0,
                    paymentStatus: form.paymentStatus,
                    paymentMethod: form.paymentMethod,
                    note: form.note
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
            showBanner(data.message || 'Đăng ký gói hội viên thành công');
            setShowRegister(false);
            refreshAll();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (membership: Membership) => {
        if (!window.confirm(`Hủy gói "${membership.packageName}" của "${membership.customerName}"?`)) return;
        setBusyId(membership._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/cancel`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Hủy gói thất bại');
            showBanner(data.message || 'Đã hủy gói hội viên');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleConfirmPayment = async (membership: Membership) => {
        if (!window.confirm(`Xác nhận đã thanh toán gói "${membership.packageName}" của "${membership.customerName}"?`)) return;
        setBusyId(membership._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/payment`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xác nhận thất bại');
            showBanner(data.message || 'Đã xác nhận thanh toán');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleDeductSession = async (membership: Membership) => {
        if (!window.confirm(`Trừ 1 buổi PT cho gói "${membership.packageName}" của "${membership.customerName}"?`)) return;
        setBusyId(membership._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/pt-sessions/deduct`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Trừ buổi PT thất bại');
            showBanner(data.message || 'Đã trừ 1 buổi PT');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (membership: Membership) => {
        if (!window.confirm(`Xóa vĩnh viễn gói "${membership.packageName}" của "${membership.customerName}"?`)) return;
        setBusyId(membership._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            showBanner('Xóa gói hội viên thành công');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleExtend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showExtend) return;
        setModalError('');
        setSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${showExtend._id}/extend`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    addMonths: Number(extendForm.addMonths) || 1,
                    additionalPrice: Number(extendForm.additionalPrice) || 0
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gia hạn thất bại');
            showBanner(data.message || 'Gia hạn thành công');
            setShowExtend(null);
            refreshAll();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openExtendModal = (membership: Membership) => {
        setExtendForm({ addMonths: '1', additionalPrice: '' });
        setModalError('');
        setShowExtend(membership);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gói Hội Viên V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Theo dõi gói tập của hội viên, hạn sử dụng, buổi PT và thanh toán</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRefreshStatus}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 disabled:opacity-60 transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Cập nhật trạng thái
                        </button>
                        <button
                            onClick={openRegisterModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Đăng ký gói
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng đăng ký</p>
                        <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.totalCustomers} hội viên</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đang hoạt động</p>
                        <p className="text-3xl font-black text-emerald-600">{summary.activeCount}</p>
                        <p className="text-xs text-amber-500 mt-1">{summary.expiringCount} sắp hết hạn</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã hết hạn / Hủy</p>
                        <p className="text-3xl font-black text-red-500">{summary.expiredCount}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.cancelledCount} đã hủy</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Doanh thu đã thu</p>
                        <p className="text-3xl font-black text-indigo-600">{formatVnd(summary.totalRevenue)}đ</p>
                        <p className="text-xs text-amber-500 mt-1">{summary.pendingPaymentCount} đang chờ thanh toán</p>
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
                            placeholder="Tìm hội viên, SĐT, gói hoặc mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto items-center">
                        {STATUS_FILTERS.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setStatusFilter(item.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === item.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border-0 focus:outline-none"
                        >
                            <option value="ALL">Mọi thanh toán</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="PENDING">Chờ thanh toán</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">Mã</th>
                                    <th className="p-4">Hội Viên</th>
                                    <th className="p-4">Gói Tập</th>
                                    <th className="p-4">Thời Hạn</th>
                                    <th className="p-4">Còn Lại</th>
                                    <th className="p-4">Buổi PT</th>
                                    <th className="p-4">Tổng Tiền</th>
                                    <th className="p-4">Thanh Toán</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="p-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMemberships.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-10 text-center text-slate-400">
                                            Không tìm thấy gói hội viên nào
                                        </td>
                                    </tr>
                                ) : filteredMemberships.map(m => (
                                    <tr key={m._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono text-xs font-bold text-indigo-600">{m.membershipCode || '—'}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{m.customerName}</div>
                                            <div className="text-xs text-slate-400">{m.customerPhone}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700">{m.packageName}</td>
                                        <td className="p-4 text-xs text-slate-500">
                                            <div>{formatDate(m.startDate)}</div>
                                            <div className="text-slate-400">→ {formatDate(m.endDate)}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800">{m.remainingDays} ngày</span>
                                            <div className="mt-1 w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${m.status === 'EXPIRED' || m.status === 'CANCELLED' ? 'bg-red-400' : m.status === 'EXPIRING_SOON' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                    style={{ width: `${m.progressPercent}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {m.ptSessionsPerMonth > 0 ? (
                                                <span className="text-xs font-semibold">
                                                    <span className="text-emerald-600 font-bold">{m.sessionsLeft}</span>
                                                    <span className="text-slate-400"> / {m.ptSessionsPerMonth * m.durationMonths} còn lại</span>
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{formatVnd(m.totalPrice)}đ</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STYLES[m.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>
                                                {PAYMENT_LABELS[m.paymentStatus] || m.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[m.status] || 'bg-slate-100 text-slate-500'}`}>
                                                {STATUS_LABELS[m.status] || m.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => setShowDetail(m)}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {m.ptSessionsPerMonth > 0 && (
                                                    <button
                                                        onClick={() => handleDeductSession(m)}
                                                        disabled={busyId === m._id || m.status === 'CANCELLED'}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                                        title="Trừ 1 buổi PT"
                                                    >
                                                        <Dumbbell className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {m.paymentStatus === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleConfirmPayment(m)}
                                                        disabled={busyId === m._id}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                                                        title="Xác nhận thanh toán"
                                                    >
                                                        <HandCoins className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {m.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => openExtendModal(m)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                        title="Gia hạn"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {m.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleCancel(m)}
                                                        disabled={busyId === m._id}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50"
                                                        title="Hủy gói"
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(m)}
                                                    disabled={busyId === m._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {busyId === m._id ? (
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

            {showRegister && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowRegister(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Đăng ký gói cho hội viên</h3>
                            <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> {modalError}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tên Hội Viên <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={form.customerName}
                                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Điện Thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        value={form.customerPhone}
                                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={form.customerEmail}
                                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Chọn Gói Tập <span className="text-red-500">*</span></label>
                                <select
                                    value={form.packageId}
                                    onChange={(e) => handlePackageSelect(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Chọn gói tập --</option>
                                    {packages.map(pkg => (
                                        <option key={pkg._id} value={pkg._id}>
                                            {pkg.name} — {formatVnd(pkg.effectivePrice ?? pkg.price)}đ / {pkg.durationMonths > 0 ? `${pkg.durationMonths} tháng` : `${pkg.durationDays} ngày`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Tháng</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.durationMonths}
                                        onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ngày Bắt Đầu</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tổng Tiền (đ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.totalPrice}
                                        onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Phương Thức TT</label>
                                    <select
                                        value={form.paymentMethod}
                                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="CASH">Tiền mặt</option>
                                        <option value="TRANSFER">Chuyển khoản</option>
                                        <option value="CARD">Thẻ</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Trạng Thái Thanh Toán</label>
                                <div className="flex gap-2">
                                    {['PAID', 'PENDING'].map(key => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setForm({ ...form, paymentStatus: key })}
                                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${form.paymentStatus === key
                                                ? key === 'PAID'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-amber-500 text-white'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            {key === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ghi Chú</label>
                                <textarea
                                    rows={2}
                                    value={form.note}
                                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRegister(false)}
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
                                    {submitting ? 'Đang lưu...' : 'Đăng ký gói'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showExtend && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowExtend(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Gia hạn gói</h3>
                            <button onClick={() => setShowExtend(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Gói <span className="font-bold text-slate-800">{showExtend.packageName}</span> của{' '}
                            <span className="font-bold text-slate-800">{showExtend.customerName}</span> hiện hết hạn ngày{' '}
                            <span className="font-semibold text-slate-700">{formatDate(showExtend.endDate)}</span>.
                        </p>

                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> {modalError}
                            </div>
                        )}

                        <form onSubmit={handleExtend} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Tháng Gia Hạn</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={extendForm.addMonths}
                                        onChange={(e) => setExtendForm({ ...extendForm, addMonths: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Tiền Thêm (đ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={extendForm.additionalPrice}
                                        onChange={(e) => setExtendForm({ ...extendForm, additionalPrice: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowExtend(null)}
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
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowDetail(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Chi tiết gói hội viên</h3>
                            <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black">
                                    {showDetail.customerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{showDetail.customerName}</p>
                                    <p className="text-xs text-indigo-500 font-mono font-semibold">{showDetail.membershipCode || showDetail._id}</p>
                                </div>
                                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[showDetail.status]}`}>
                                    {STATUS_LABELS[showDetail.status]}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" /> {showDetail.customerPhone}
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" /> {showDetail.customerEmail || '—'}
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Dumbbell className="w-4 h-4 text-slate-400" /> {showDetail.packageName}
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <CalendarDays className="w-4 h-4 text-slate-400" /> {showDetail.durationMonths} tháng
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Wallet className="w-4 h-4 text-slate-400" /> {formatVnd(showDetail.totalPrice)}đ
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Banknote className="w-4 h-4 text-slate-400" /> {PAYMENT_METHOD_LABELS[showDetail.paymentMethod] || showDetail.paymentMethod}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Bắt đầu</span>
                                    <span className="font-semibold text-slate-700">{formatDate(showDetail.startDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Hết hạn</span>
                                    <span className="font-semibold text-slate-700">{formatDate(showDetail.endDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Còn lại</span>
                                    <span className="font-bold text-slate-800">{showDetail.remainingDays} ngày</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${showDetail.status === 'EXPIRED' || showDetail.status === 'CANCELLED' ? 'bg-red-400' : showDetail.status === 'EXPIRING_SOON' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${showDetail.progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {showDetail.ptSessionsPerMonth > 0 && (
                                <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-4">
                                    <div>
                                        <p className="text-xs text-emerald-600 font-semibold uppercase">Buổi PT</p>
                                        <p className="text-lg font-black text-emerald-700">
                                            {showDetail.sessionsLeft} <span className="text-xs font-semibold">/ {showDetail.ptSessionsPerMonth * showDetail.durationMonths} còn lại</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-600 font-semibold uppercase">Đã dùng</p>
                                        <p className="text-lg font-black text-emerald-700">{showDetail.usedSessions}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-amber-50 rounded-xl p-4">
                                <div>
                                    <p className="text-xs text-amber-600 font-semibold uppercase">Thanh toán</p>
                                    <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STYLES[showDetail.paymentStatus]}`}>
                                        {PAYMENT_LABELS[showDetail.paymentStatus]}
                                    </span>
                                </div>
                                {showDetail.paidAt && (
                                    <div className="text-right">
                                        <p className="text-xs text-amber-600 font-semibold uppercase">Đã thanh toán lúc</p>
                                        <p className="text-sm font-semibold text-slate-700">{formatDate(showDetail.paidAt)}</p>
                                    </div>
                                )}
                            </div>

                            {showDetail.note && (
                                <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                                    <MessageSquareQuote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    {showDetail.note}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100">
                            {showDetail.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => { const m = showDetail; setShowDetail(null); openExtendModal(m); }}
                                    className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-200 transition-all"
                                >
                                    Gia hạn
                                </button>
                            )}
                            <button
                                onClick={() => setShowDetail(null)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

