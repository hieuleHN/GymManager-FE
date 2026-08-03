import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Search, Plus, Edit, Trash2, ShoppingBag, PackagePlus, Undo2, Loader2, AlertTriangle, CheckCircle2, X, Save } from 'lucide-react';

const STOCK_FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'IN_STOCK', label: 'Còn hàng' },
    { key: 'LOW_STOCK', label: 'Sắp hết' },
    { key: 'OUT_OF_STOCK', label: 'Hết hàng' }
];

const STOCK_STYLES: Record<string, string> = {
    IN_STOCK: 'bg-emerald-100 text-emerald-700',
    LOW_STOCK: 'bg-amber-100 text-amber-700',
    OUT_OF_STOCK: 'bg-red-100 text-red-700'
};

const STOCK_LABELS: Record<string, string> = {
    IN_STOCK: 'Còn hàng',
    LOW_STOCK: 'Sắp hết',
    OUT_OF_STOCK: 'Hết hàng'
};

interface ProductItem {
    _id: string;
    name: string;
    price: number;
    costPrice: number;
    quantity: number;
    sold: number;
    lowStockThreshold: number;
    description: string;
    image: string;
    importDate: string;
    expiryDate: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface SummaryData {
    total: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
}

interface ProductForm {
    name: string;
    price: string;
    costPrice: string;
    quantity: string;
    lowStockThreshold: string;
    description: string;
    image: string;
    expiryDate: string;
}

const emptyForm: ProductForm = {
    name: '',
    price: '',
    costPrice: '',
    quantity: '0',
    lowStockThreshold: '5',
    description: '',
    image: '',
    expiryDate: ''
};

const resolveImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${getApiUrl()}/${image.replace(/^\/+/, '')}`;
};

export function ProductListV2() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ total: 0, totalStock: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [modalError, setModalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách sản phẩm');
            setProducts(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/summary`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setSummary(data.data);
        } catch {}
    };

    const refreshAll = () => {
        fetchProducts();
        fetchSummary();
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = stockFilter === 'ALL' || product.stockStatus === stockFilter;
        return matchesSearch && matchesStock;
    });

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const handleSell = async (product: ProductItem) => {
        const qtyStr = window.prompt(`Nhập số lượng bán "${product.name}" (tồn kho: ${product.quantity}):`, '1');
        if (!qtyStr) return;
        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty < 1) {
            window.alert('Số lượng không hợp lệ');
            return;
        }
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/${product._id}/sell`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ quantity: qty })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Bán sản phẩm thất bại');
            showBanner(data.message || 'Đã ghi nhận bán');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        }
    };

    const handleRestock = async (product: ProductItem) => {
        const qtyStr = window.prompt(`Nhập số lượng nhập thêm cho "${product.name}":`, '1');
        if (!qtyStr) return;
        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty < 1) {
            window.alert('Số lượng không hợp lệ');
            return;
        }
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/${product._id}/restock`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ quantity: qty })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Nhập kho thất bại');
            showBanner(data.message || 'Đã nhập thêm hàng');
            refreshAll();
        } catch (err: any) {
            window.alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        setDeleting(id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/products/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            showBanner('Xóa sản phẩm thành công');
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

    const openEditModal = (product: ProductItem) => {
        setEditingId(product._id);
        setForm({
            name: product.name,
            price: String(product.price ?? ''),
            costPrice: String(product.costPrice ?? ''),
            quantity: String(product.quantity ?? ''),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
            description: product.description || '',
            image: product.image || '',
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
        });
        setModalError('');
        setShowModal(true);
    };

    const handleSubmitModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!form.name.trim()) {
            setModalError('Vui lòng nhập tên sản phẩm');
            return;
        }
        if (form.price === '' || Number(form.price) < 0) {
            setModalError('Giá bán không hợp lệ');
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                name: form.name,
                price: Number(form.price),
                costPrice: Number(form.costPrice) || 0,
                quantity: Number(form.quantity) || 0,
                lowStockThreshold: Number(form.lowStockThreshold) || 5,
                description: form.description,
                image: form.image,
                expiryDate: form.expiryDate || null
            };
            const url = editingId
                ? `${getApiUrl()}/api/v2/products/${editingId}`
                : `${getApiUrl()}/api/v2/products`;
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || (editingId ? 'Cập nhật thất bại' : 'Thêm thất bại'));
            showBanner(data.message || (editingId ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công'));
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
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Sản phẩm V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Danh sách sản phẩm, quản lý tồn kho và trả hàng</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/v2/products/returns')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            <Undo2 className="w-4 h-4" /> Trả hàng
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Thêm sản phẩm
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng sản phẩm</p>
                        <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng tồn kho</p>
                        <p className="text-3xl font-black text-indigo-600">{summary.totalStock}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.totalValue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sắp hết hàng</p>
                        <p className="text-3xl font-black text-amber-500">{summary.lowStockCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Hết hàng</p>
                        <p className="text-3xl font-black text-red-500">{summary.outOfStockCount}</p>
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
                            placeholder="Tìm tên hoặc mô tả sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        {STOCK_FILTERS.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setStockFilter(item.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${stockFilter === item.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">STT</th>
                                    <th className="p-4">Ảnh</th>
                                    <th className="p-4">Sản Phẩm</th>
                                    <th className="p-4">Đơn Giá</th>
                                    <th className="p-4">Giá Nhập</th>
                                    <th className="p-4">Tồn Kho</th>
                                    <th className="p-4">Đã Bán</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4">Hạn Dùng</th>
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
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-10 text-center text-slate-400">
                                            Không tìm thấy sản phẩm nào
                                        </td>
                                    </tr>
                                ) : filteredProducts.map((product, index) => (
                                    <tr key={product._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-500">{index + 1}</td>
                                        <td className="p-4">
                                            {product.image ? (
                                                <img
                                                    src={resolveImageUrl(product.image)}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">Ảnh</div>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">
                                            {product.name}
                                            <div className="text-xs text-slate-400 font-normal max-w-[220px] truncate">{product.description}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700">{(product.price ?? 0).toLocaleString('vi-VN')}đ</td>
                                        <td className="p-4 text-slate-500">{(product.costPrice ?? 0).toLocaleString('vi-VN')}đ</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${product.quantity === 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                                                {product.quantity ?? 0}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-green-600">{product.sold ?? 0}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STOCK_STYLES[product.stockStatus] || 'bg-slate-100 text-slate-500'}`}>
                                                {STOCK_LABELS[product.stockStatus] || product.stockStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">
                                            {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('vi-VN') : 'Không'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleSell(product)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Ghi nhận bán (trừ tồn kho)"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRestock(product)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    title="Nhập thêm hàng"
                                                >
                                                    <PackagePlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    disabled={deleting === product._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {deleting === product._id ? (
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
                                {editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
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
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tên Sản Phẩm <span className="text-red-500">*</span></label>
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Đơn Giá (đ) <span className="text-red-500">*</span></label>
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Giá Nhập (đ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.costPrice}
                                        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tồn Kho</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ngưỡng Cảnh Báo</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.lowStockThreshold}
                                        onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hạn Sử Dụng</label>
                                <input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
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
                                    {submitting ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Thêm Sản Phẩm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
