import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    ArrowLeft, Loader2, AlertTriangle, CheckCircle2, BadgePercent,
    CalendarDays, Dumbbell, Layers, Wallet, ShoppingCart, UserRound, Check
} from 'lucide-react';

const TYPE_STYLES: Record<string, string> = {
    STANDARD: 'bg-indigo-100 text-indigo-700',
    COMBO: 'bg-amber-100 text-amber-700',
    PT: 'bg-emerald-100 text-emerald-700'
};

const TYPE_LABELS: Record<string, string> = {
    STANDARD: 'Gói tiêu chuẩn',
    COMBO: 'Gói combo',
    PT: 'Gói PT'
};

interface PackageDetail {
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
    createdAt: string;
}

const resolveImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${getApiUrl()}/${image.replace(/^\/+/, '')}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString('vi-VN');

export function PackageDetailV2() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [pkg, setPkg] = useState<PackageDetail | null>(null);
    const [related, setRelated] = useState<PackageDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');
        fetch(`${getApiUrl()}/api/v2/packages/${id}`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (!data?.data) throw new Error(data?.message || 'Không tìm thấy gói tập');
                setPkg(data.data);
                return fetch(`${getApiUrl()}/api/v2/packages/${id}/related`, { headers: getAuthHeaders() });
            })
            .then(res => res.json())
            .then(data => {
                if (data?.data) setRelated(data.data);
            })
            .catch((err: any) => setError(err.message || 'Không thể tải thông tin gói tập'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleBuy = () => {
        navigate(`/admin/v2/packages/${id}/checkout`);
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

    if (error || !pkg) {
        return (
            <AdminLayout>
                <div className="max-w-7xl mx-auto py-20 flex flex-col items-center gap-4">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                    <p className="text-slate-500 font-semibold">{error || 'Không tìm thấy gói tập'}</p>
                    <button
                        onClick={() => navigate('/admin/v2/packages')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <button
                    onClick={() => navigate('/admin/v2/packages')}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách gói tập
                </button>

                {banner && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">{banner}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        <div className="lg:col-span-2 bg-slate-50 p-8 flex items-center justify-center">
                            {pkg.image ? (
                                <img
                                    src={resolveImageUrl(pkg.image)}
                                    alt={pkg.name}
                                    className="w-full max-w-sm h-64 object-cover rounded-2xl border border-slate-200"
                                />
                            ) : (
                                <div className="w-full max-w-sm h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <Dumbbell className="w-12 h-12" />
                                    <span className="text-sm font-semibold">Chưa có hình ảnh</span>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-3 p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[pkg.type] || 'bg-slate-100 text-slate-500'}`}>
                                        {TYPE_LABELS[pkg.type] || pkg.type}
                                    </span>
                                    <h1 className="text-3xl font-black text-slate-900 mt-3">{pkg.name}</h1>
                                    <p className="text-slate-500 mt-2 leading-relaxed">{pkg.description || 'Chưa có mô tả chi tiết.'}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${pkg.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {pkg.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                                </span>
                            </div>

                            <div className="mt-6 flex items-end gap-3">
                                <p className="text-4xl font-black text-indigo-600">{formatVnd(pkg.effectivePrice)}đ</p>
                                {(pkg.originalPrice || 0) > (pkg.effectivePrice ?? 0) && (
                                    <p className="text-lg text-slate-400 line-through pb-1">{formatVnd(pkg.originalPrice)}đ</p>
                                )}
                                {(pkg.discountPercent || 0) > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold mb-1">
                                        <BadgePercent className="w-3.5 h-3.5" /> Giảm {pkg.discountPercent}%
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <CalendarDays className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Thời hạn</p>
                                    <p className="text-lg font-black text-slate-800">{pkg.durationLabel}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Buổi PT</p>
                                    <p className="text-lg font-black text-slate-800">{pkg.ptSessionsPerMonth > 0 ? `${pkg.ptSessionsPerMonth}/tháng` : 'Tự do'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <UserRound className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Đã đăng ký</p>
                                    <p className="text-lg font-black text-slate-800">{pkg.sold ?? 0}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <Wallet className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Doanh thu</p>
                                    <p className="text-lg font-black text-slate-800">{formatVnd(pkg.totalRevenue)}đ</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Tính năng gói</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {(pkg.features || []).length > 0 ? (
                                        pkg.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                {feature}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400">Chưa có tính năng nào.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={handleBuy}
                                    disabled={pkg.status !== 'ACTIVE'}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ShoppingCart className="w-4 h-4" /> Mua / Đăng ký gói này
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/v2/packages/${pkg._id}/edit`)}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Chỉnh sửa gói
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {related.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Gói tập liên quan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {related.map(item => (
                                <button
                                    key={item._id}
                                    onClick={() => navigate(`/admin/v2/packages/${item._id}`)}
                                    className="bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-md transition-all"
                                >
                                    {item.image && (
                                        <img
                                            src={resolveImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-24 object-cover rounded-xl mb-3"
                                        />
                                    )}
                                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                    <p className="text-indigo-600 font-black mt-2 text-sm">{formatVnd(item.effectivePrice)}đ</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
