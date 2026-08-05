import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    ArrowLeft, Search, Edit, Trash2, Loader2, AlertTriangle, CheckCircle2,
    X, Save, CalendarDays, Clock, Filter, ScanLine, PencilLine
} from 'lucide-react';

const STATUS_FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'SUCCESS', label: 'Hợp lệ' },
    { key: 'FAILED', label: 'Không hợp lệ' }
];

const METHOD_FILTERS = [
    { key: 'ALL', label: 'Mọi hình thức' },
    { key: 'QR', label: 'Quét QR' },
    { key: 'MANUAL', label: 'Nhập tay' }
];

const STATUS_STYLES: Record<string, string> = {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    MANUAL: 'bg-indigo-100 text-indigo-700',
    FAILED: 'bg-red-100 text-red-700'
};

const STATUS_LABELS: Record<string, string> = {
    SUCCESS: 'Thành công',
    MANUAL: 'Thủ công',
    FAILED: 'Không hợp lệ'
};

const METHOD_LABELS: Record<string, string> = {
    QR: 'Quét QR',
    MANUAL: 'Nhập tay'
};

interface HistoryRecord {
    _id: string;
    customerName: string;
    customerPhone: string;
    packageName: string;
    checkInTime: string;
    dateLabel: string;
    timeLabel: string;
    method: 'QR' | 'MANUAL';
    status: 'SUCCESS' | 'MANUAL' | 'FAILED';
    note: string;
}

const formatDate = (value: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
const toDateTimeLocal = (value: string) => {
    if (!value) return '';
    const d = new Date(value);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${value.slice(0, 10)}T${hh}:${mm}`;
};

export function AttendanceHistoryV2() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [methodFilter, setMethodFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const [showEdit, setShowEdit] = useState<HistoryRecord | null>(null);
    const [editForm, setEditForm] = useState({ checkInTime: '', note: '', status: 'SUCCESS' });
    const [modalError, setModalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance?limit=200`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch sử điểm danh');
            setRecords(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredRecords = records.filter(record => {
        const matchesSearch =
            record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.customerPhone?.includes(searchTerm) ||
            record.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
        const matchesMethod = methodFilter === 'ALL' || record.method === methodFilter;
        const matchesDate = !dateFilter || record.dateLabel === dateFilter;
        return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });

    const successCount = filteredRecords.filter(r => r.status === 'SUCCESS' || r.status === 'MANUAL').length;
    const failedCount = filteredRecords.filter(r => r.status === 'FAILED').length;
    const qrCount = filteredRecords.filter(r => r.method === 'QR').length;
    const manualCount = filteredRecords.filter(r => r.method === 'MANUAL').length;

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const openEditModal = (record: HistoryRecord) => {
        setEditForm({
            checkInTime: toDateTimeLocal(record.checkInTime),
            note: record.note || '',
            status: record.status
        });
        setModalError('');
        setShowEdit(record);
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEdit) return;
        setModalError('');
        setSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance/${showEdit._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    checkInTime: editForm.checkInTime,
                    note: editForm.note,
                    status: editForm.status
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');
            showBanner('Cập nhật bản ghi điểm danh thành công');
            setShowEdit(null);
            fetchHistory();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa bản ghi điểm danh này?')) return;
        setDeleting(id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            showBanner('Xóa bản ghi điểm danh thành công');
            fetchHistory();
        } catch (err: any) {
            window.alert(err.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <button
                    onClick={() => navigate('/admin/v2/attendance')}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại điểm danh
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lịch sử điểm danh V2</h1>
                    <p className="text-slate-500 text-sm mt-1">Tra cứu và quản lý toàn bộ bản ghi điểm danh của hội viên</p>
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng bản ghi</p>
                        <p className="text-3xl font-black text-slate-900">{filteredRecords.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Hợp lệ</p>
                        <p className="text-3xl font-black text-emerald-600">{successCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Thông tin</p>
                        <p className="text-3xl font-black text-emerald-600">{successCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Không hợp lệ</p>
                        <p className="text-3xl font-black text-red-500">{failedCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quét QR / Nhập tay</p>
                        <p className="text-3xl font-black text-indigo-600">{qrCount}<span className="text-base text-slate-400"> / {manualCount}</span></p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm hội viên, SĐT hoặc gói..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto items-center">
                        <div className="relative">
                            <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {dateFilter && (
                                <button
                                    onClick={() => setDateFilter('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            {METHOD_FILTERS.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setMethodFilter(item.key)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${methodFilter === item.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            {STATUS_FILTERS.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setStatusFilter(item.key)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${statusFilter === item.key
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">STT</th>
                                    <th className="p-4">Hội Viên</th>
                                    <th className="p-4">Gói Tập</th>
                                    <th className="p-4">Ngày</th>
                                    <th className="p-4">Thời Gian</th>
                                    <th className="p-4">Hình Thức</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4">Ghi Chú</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="p-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải lịch sử...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-10 text-center text-slate-400">
                                            Không tìm thấy bản ghi điểm danh nào
                                        </td>
                                    </tr>
                                ) : filteredRecords.map((record, index) => (
                                    <tr key={record._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-500">{index + 1}</td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800">{record.customerName}</span>
                                            <div className="text-xs text-slate-400">{record.customerPhone}</div>
                                        </td>
                                        <td className="p-4 text-xs">{record.packageName || '—'}</td>
                                        <td className="p-4 text-xs text-slate-500">{formatDate(record.checkInTime)}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {record.timeLabel}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                                <ScanLine className="w-3.5 h-3.5 text-slate-400" /> {METHOD_LABELS[record.method] || record.method}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[record.status] || 'bg-slate-100 text-slate-500'}`}>
                                                {STATUS_LABELS[record.status] || record.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 max-w-[160px] truncate">{record.note || '—'}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(record)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Sửa"
                                                >
                                                    <PencilLine className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record._id)}
                                                    disabled={deleting === record._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {deleting === record._id ? (
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

            {showEdit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowEdit(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Sửa bản ghi điểm danh</h3>
                            <button onClick={() => setShowEdit(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Hội viên <span className="font-bold text-slate-800">{showEdit.customerName}</span> · {showEdit.customerPhone}
                        </p>

                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Thời Gian Điểm Danh</label>
                                <input
                                    type="datetime-local"
                                    value={editForm.checkInTime}
                                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Trạng Thái</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="SUCCESS">Hợp lệ</option>
                                    <option value="FAILED">Không hợp lệ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ghi Chú</label>
                                <textarea
                                    rows={2}
                                    value={editForm.note}
                                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEdit(null)}
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
                                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );

}
