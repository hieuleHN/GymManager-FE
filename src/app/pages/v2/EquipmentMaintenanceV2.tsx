import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, AlertTriangle, CheckCircle2, Wrench, RefreshCw, CalendarClock,
    CalendarDays, Boxes, MapPin, X, Save
} from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceItem {
    _id: string;
    equipmentCode: string;
    name: string;
    category: string;
    categoryLabel?: string;
    location: string;
    condition: string;
    conditionLabel?: string;
    lastMaintenanceDate: string | null;
    lastMaintenanceLabel: string;
    nextMaintenanceDate: string | null;
    nextMaintenanceLabel: string;
    daysRemaining: number | null;
    overdue: boolean;
}

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

export function EquipmentMaintenanceV2() {
    const [items, setItems] = useState<MaintenanceItem[]>([]);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<MaintenanceItem | null>(null);
    const [newDate, setNewDate] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/equipment/maintenance?days=${days}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch bảo trì');
            setItems(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [days]);

    const openEdit = (item: MaintenanceItem) => {
        setEditing(item);
        setNewDate(item.nextMaintenanceDate ? toInputDate(new Date(item.nextMaintenanceDate)) : '');
    };

    const handleSave = async () => {
        if (!editing) return;
        if (!newDate) {
            toast.error('Vui lòng chọn ngày bảo trì tới!');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/equipment/${editing._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ nextMaintenanceDate: newDate })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lưu thất bại');
            toast.success('Đã cập nhật lịch bảo trì!');
            setEditing(null);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async (item: MaintenanceItem) => {
        if (!window.confirm(`Xác nhận đã hoàn thành bảo trì "${item.name}" hôm nay?`)) return;
        setSaving(true);
        try {
            const today = toInputDate(new Date());
            const res = await fetch(`${getApiUrl()}/api/v2/equipment/${item._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ lastMaintenanceDate: today, nextMaintenanceDate: '' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');
            toast.success(`Đã ghi nhận bảo trì "${item.name}"!`);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Cập nhật thất bại');
        } finally {
            setSaving(false);
        }
    };

    const overdueCount = items.filter(i => i.overdue).length;
    const dueSoonCount = items.filter(i => !i.overdue && (i.daysRemaining ?? 0) <= 7).length;
    const upcomingCount = items.filter(i => !i.overdue && (i.daysRemaining ?? 0) > 7).length;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lịch bảo trì thiết bị V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Những thiết bị cần bảo trì trong khoảng thời gian chọn</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Làm mới">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            {[30, 60, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${days === d ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                                >
                                    {d} ngày
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quá hạn</p>
                        <p className="text-3xl font-black text-red-600">{overdueCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đến hạn ≤ 7 ngày</p>
                        <p className="text-3xl font-black text-amber-500">{dueSoonCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sắp tới</p>
                        <p className="text-3xl font-black text-emerald-600">{upcomingCount}</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <CalendarClock className="w-4 h-4 text-indigo-500" /> Danh sách cần bảo trì ({items.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">Thiết Bị</th>
                                    <th className="p-4">Danh Mục</th>
                                    <th className="p-4">Vị Trí</th>
                                    <th className="p-4">Bảo Trì Lần Trước</th>
                                    <th className="p-4">Bảo Trì Tới</th>
                                    <th className="p-4">Còn Lại</th>
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
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            Không có thiết bị nào cần bảo trì trong {days} ngày tới
                                        </td>
                                    </tr>
                                ) : items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800">{item.name}</span>
                                            <div className="text-xs text-slate-400 font-mono">{item.equipmentCode}</div>
                                        </td>
                                        <td className="p-4 text-xs">{item.categoryLabel || item.category}</td>
                                        <td className="p-4 text-xs flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-slate-300" /> {item.location || '—'}
                                        </td>
                                        <td className="p-4 text-xs">{item.lastMaintenanceLabel || '—'}</td>
                                        <td className="p-4 text-xs font-bold">{item.nextMaintenanceLabel || '—'}</td>
                                        <td className="p-4">
                                            {item.overdue ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Quá hạn</span>
                                            ) : (item.daysRemaining ?? 0) <= 7 ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{item.daysRemaining} ngày</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{item.daysRemaining} ngày</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Lên lịch bảo trì tới">
                                                    <CalendarDays className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleComplete(item)} disabled={saving} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Đã bảo trì xong">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 bg-white border border-slate-100 rounded-2xl px-4 py-3">
                    <span className="flex items-center gap-1.5"><Wrench className="w-4 h-4 text-indigo-500" /> Lên lịch bảo trì mới</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ghi nhận đã bảo trì</span>
                    <span className="ml-auto text-slate-400">Dữ liệu lấy từ API /api/v2/equipment/maintenance</span>
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Lên lịch bảo trì</h3>
                                <p className="text-sm text-slate-500">{editing.name} · {editing.equipmentCode}</p>
                            </div>
                            <button onClick={() => setEditing(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                                <CalendarClock className="w-3.5 h-3.5" /> Ngày bảo trì tới
                            </label>
                            <input
                                type="date"
                                min={toInputDate(new Date())}
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Lần bảo trì trước: {editing.lastMaintenanceLabel || 'chưa có'}</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu lịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
