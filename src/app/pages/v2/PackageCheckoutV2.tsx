import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Dumbbell,
    UserRound, Phone, Mail, ShoppingCart, Wallet, CreditCard, Banknote, Minus, Plus
} from 'lucide-react';

interface CheckoutPackage {
    _id: string;
    name: string;
    type: 'STANDARD' | 'COMBO' | 'PT';
    price: number;
    discountPercent: number;
    effectivePrice: number;
    durationLabel: string;
    ptSessionsPerMonth: number;
    image: string;
    status: 'ACTIVE' | 'INACTIVE';
}

const PAYMENT_OPTIONS = [
    { key: 'CASH', label: 'Tiền mặt', icon: Banknote },
    { key: 'TRANSFER', label: 'Chuyển khoản', icon: CreditCard },
    { key: 'CARD', label: 'Quẹt thẻ', icon: CreditCard }
];

const resolveImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${getApiUrl()}/${image.replace(/^\/+/, '')}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');

export function PackageCheckoutV2() {
    const navigate = useNavigate();
    const { id: paramId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const packageId = paramId || searchParams.get('package') || '';

    const [pkg, setPkg] = useState<CheckoutPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        paymentMethod: 'CASH',
        quantity: '1',
        note: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!packageId) {
            setError('Thiếu mã gói tập. Vui lòng quay lại chọn gói.');
            setLoading(false);
            return;
        }
        fetch(`${getApiUrl()}/api/v2/packages/${packageId}`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (!data?.data) throw new Error(data?.message || 'Không tìm thấy gói tập');
                setPkg(data.data);
            })
            .catch((err: any) => setError(err.message || 'Không thể tải thông tin gói tập'))
            .finally(() => setLoading(false));
    }, [packageId]);

    const quantity = parseInt(form.quantity) || 1;
    const unitPrice = pkg?.effectivePrice ?? pkg?.price ?? 0;
    const totalPrice = unitPrice * (quantity < 1 ? 1 : quantity);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.customerName.trim()) {
            setError('Vui lòng nhập tên khách hàng');
            return;
        }
        if (!form.customerPhone.trim()) {
            setError('Vui lòng nhập số điện thoại khách hàng');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/packages/${packageId}/checkout`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    customerName: form.customerName,
                    customerPhone: form.customerPhone,
                    customerEmail: form.customerEmail,
                    paymentMethod: form.paymentMethod,
                    quantity: quantity,
                    note: form.note
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đăng ký gói thất bại');
            setSuccess(data.message || 'Đăng ký gói tập thành công');
            setForm({ customerName: '', customerPhone: '', customerEmail: '', paymentMethod: 'CASH', quantity: '1', note: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="max-w-7xl mx-auto py-20 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" /> <span className="ml-2">Đang tải thông tin gói tập...</span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                <button
                    onClick={() => navigate(packageId ? `/admin/v2/packages/${packageId}` : '/admin/v2/packages')}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đăng ký gói tập V2</h1>
                    <p className="text-slate-500 text-sm mt-1">Nhập thông tin khách hàng và hoàn tất thanh toán</p>
                </div>

                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-semibold">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {!pkg && error && !success && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-slate-500 font-semibold">{error}</p>
                        <button
                            onClick={() => navigate('/admin/v2/packages')}
                            className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
                        >
                            Chọn gói tập
                        </button>
                    </div>
                )}

                {pkg && (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                                <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                    <UserRound className="w-4 h-4 text-indigo-500" /> Thông tin khách hàng
                                </h2>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Họ và Tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={form.customerName}
                                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Nguyễn Văn A"
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
                                            placeholder="0987654321"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={form.customerEmail}
                                            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="khachhang@gmail.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                                <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-indigo-500" /> Phương thức thanh toán
                                </h2>
                                <div className="grid grid-cols-3 gap-3">
                                    {PAYMENT_OPTIONS.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, paymentMethod: option.key })}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.paymentMethod === option.key
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Lượng</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, quantity: String(Math.max(1, quantity - 1)) })}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.quantity}
                                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                            className="w-20 text-center px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, quantity: String(quantity + 1) })}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs text-slate-400">từ 1 đến 12 tháng / gói</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ghi Chú</label>
                                    <textarea
                                        rows={2}
                                        value={form.note}
                                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ghi chú thêm (nếu có)..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-4">
                                <h2 className="text-sm font-bold text-slate-700 uppercase mb-4">Tóm tắt đơn hàng</h2>
                                <div className="flex gap-4 items-center">
                                    {pkg.image ? (
                                        <img
                                            src={resolveImageUrl(pkg.image)}
                                            alt={pkg.name}
                                            className="w-16 h-16 object-cover rounded-xl border border-slate-100"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                                            <Dumbbell className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-slate-800">{pkg.name}</p>
                                        <p className="text-xs text-slate-400">{pkg.durationLabel}{pkg.ptSessionsPerMonth > 0 ? ` · ${pkg.ptSessionsPerMonth} buổi PT/tháng` : ''}</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Đơn giá</span>
                                        <span className="font-semibold text-slate-800">{formatVnd(unitPrice)}đ</span>
                                    </div>
                                    {(pkg.discountPercent || 0) > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Khuyến mãi</span>
                                            <span className="font-semibold">-{pkg.discountPercent}%</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số lượng</span>
                                        <span className="font-semibold text-slate-800">x {quantity}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                        <span className="font-bold text-slate-700">Tổng cộng</span>
                                        <span className="text-xl font-black text-indigo-600">{formatVnd(totalPrice)}đ</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || pkg.status !== 'ACTIVE'}
                                    className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
                                </button>
                                {pkg.status !== 'ACTIVE' && (
                                    <p className="mt-3 text-xs text-center text-red-500 font-semibold">Gói này đang tạm dừng, không thể đăng ký.</p>
                                )}
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
