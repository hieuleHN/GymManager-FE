import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Plus, Trash2, Undo2, Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ReturnItem {
    _id: string;
    productId: { _id: string; name: string; price: number } | string | null;
    productName: string;
    reason: string;
    quantity: number;
    returnDate: string;
    createdAt: string;
}

interface ProductOption {
    _id: string;
    name: string;
    quantity: number;
}

export function ProductReturnsV2() {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ productId: '', reason: '', quantity: '1' });
    const [modalError, setModalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReturns = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/returns?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách trả hàng');
            setReturns(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setProducts(data.data);
        } catch {}
    };

    useEffect(() => {
        fetchReturns();
        fetchProducts();
    }, []);

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const openAddModal = () => {
        setForm({ productId: '', reason: '', quantity: '1' });
        setModalError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!form.productId) {
            setModalError('Vui lòng chọn sản phẩm trả hàng');
            return;
        }
        if (!form.reason.trim()) {
            setModalError('Vui lòng nhập lý do trả hàng');
            return;
        }
        if (!form.quantity || Number(form.quantity) < 1) {
            setModalError('Số lượng phải lớn hơn 0');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/returns`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    productId: form.productId,
                    reason: form.reason,
                    quantity: Number(form.quantity)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Ghi nhận trả hàng thất bại');
            showBanner(data.message || 'Ghi nhận trả hàng thành công');
            setShowModal(false);
            fetchReturns();
            fetchProducts();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu trả hàng này?')) return;
        setDeleting(id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/returns/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            showBanner('Xóa phiếu trả hàng thành công');
            fetchReturns();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const getProductStock = (productId: string | null) => {
        if (!productId) return null;
        const product = products.find(p => p._id === productId);
        return product ? product.quantity : null;
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Trả Hàng V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Ghi nhận khách trả hàng, hoàn lại tồn kho sản phẩm</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/v2/products')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            <Undo2 className="w-4 h-4" /> Sản phẩm
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Nhập thông tin trả hàng
                        </button>
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

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">STT</th>
                                    <th className="p-4">Sản Phẩm</th>
                                    <th className="p-4">Lý Do Trả</th>
                                    <th className="p-4">Số Lượng</th>
                                    <th className="p-4">Tồn Kho Hiện Tại</th>
                                    <th className="p-4">Ngày Trả</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách...
                                            </div>
                                        </td>
                                    </tr>
                                ) : returns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-slate-400">
                                            Chưa có phiếu trả hàng nào
                                        </td>
                                    </tr>
                                ) : returns.map((item, index) => {
                                    const productId = typeof item.productId === 'object' && item.productId ? item.productId._id : item.productId;
                                    const stock = getProductStock(productId);
                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/50">
                                            <td className="p-4 text-slate-500">{index + 1}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.productName}</td>
                                            <td className="p-4 text-slate-600 max-w-xs">{item.reason}</td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">
                                                    +{item.quantity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">{stock !== null ? stock : '—'}</td>
                                            <td className="p-4 text-xs text-slate-500">
                                                {item.returnDate ? new Date(item.returnDate).toLocaleDateString('vi-VN') : ''}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        disabled={deleting === item._id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                        title="Xóa"
                                                    >
                                                        {deleting === item._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Nhập thông tin trả hàng</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sản Phẩm <span className="text-red-500">*</span></label>
                                <select
                                    value={form.productId}
                                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.name} (tồn kho: {product.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Lý Do Trả Hàng <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Nhập lý do trả hàng"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Lượng <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
