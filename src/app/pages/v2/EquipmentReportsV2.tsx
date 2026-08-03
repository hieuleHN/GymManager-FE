import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, AlertTriangle, CheckCircle2, XCircle, Wrench, RefreshCw, Search,
    CalendarDays, Boxes, UserRound, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportRecord {
    _id: string;
    reportCode: string;
    reportType: string;
    affectedQuantity: number;
    reason: string;
    note: string;
    status: 'PENDING' | 'RESOLVED';
    reportedAt: string;
    resolvedAt: string | null;
    resolvedBy: string;
    equipmentId: string;
    equipmentCode: string;
    equipmentName: string;
}

interface MetaData {
    reportTypes: { key: string; label: string }[];
    reportStatuses: { key: string; label: string }[];
}

const REPORT_TYPE_STYLES: Record<string, string> = {
    DAMAGE: 'bg-red-100 text-red-700',
    MAINTENANCE: 'bg-amber-100 text-amber-700',
    MISSING_PART: 'bg-sky-100 text-sky-700',
    CLEANING: 'bg-emerald-100 text-emerald-700'
};

const toDateKey = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

export function EquipmentReportsV2() {
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [meta, setMeta] = useState<MetaData>({ reportTypes: [], reportStatuses: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'ALL') params.append('reportType', typeFilter);
            if (statusFilter !== 'ALL') params.append('status', statusFilter);
            if (dateFilter) params.append('date', dateFilter);
            const res = await fetch(`${getApiUrl()}/api/v2/equipment/reports?${params.toString()}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách báo cáo');
            setReports(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [typeFilter, statusFilter, dateFilter]);

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

    const handleResolve = async (report: ReportRecord) => {
        if (!window.confirm(`Đánh dấu đã xử lý báo cáo "${report.reportCode}" của ${report.equipmentName}?`)) return;
        setBusyId(report._id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/equipment/${report.equipmentId}/reports/${report._id}/resolve`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ resolvedBy: 'Lễ tân' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xử lý thất bại');
            toast.success(data.message || 'Đã xử lý báo cáo!');
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Xử lý thất bại');
        } finally {
            setBusyId(null);
        }
    };

    const reportTypeLabel = (key: string) => meta.reportTypes.find(r => r.key === key)?.label || key;
    const reportStatusLabel = (key: string) => meta.reportStatuses.find(s => s.key === key)?.label || key;

    const pendingCount = reports.filter(r => r.status === 'PENDING').length;
    const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;

    const filtered = reports.filter(r =>
        (r.equipmentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.equipmentCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reportCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Báo cáo thiết bị V2</h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi và xử lý các báo cáo hỏng hóc, bảo trì thiết bị</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng báo cáo</p>
                        <p className="text-3xl font-black text-slate-900">{reports.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đang xử lý</p>
                        <p className="text-3xl font-black text-amber-500">{pendingCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã xử lý</p>
                        <p className="text-3xl font-black text-emerald-600">{resolvedCount}</p>
                    </div>
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
                                placeholder="Tìm mã, thiết bị, lý do..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả loại</option>
                            {meta.reportTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">Tất cả trạng thái</option>
                            {meta.reportStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); setDateFilter(''); setSearchTerm(''); }} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200" title="Làm mới">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-4">Mã Báo Cáo</th>
                                    <th className="p-4">Thiết Bị</th>
                                    <th className="p-4">Loại</th>
                                    <th className="p-4">Số Lượng</th>
                                    <th className="p-4">Lý Do</th>
                                    <th className="p-4">Ngày Báo</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">Không có báo cáo nào</td>
                                    </tr>
                                ) : filtered.map(report => (
                                    <tr key={report._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono text-xs font-bold text-indigo-600">{report.reportCode}</td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800">{report.equipmentName}</span>
                                            <div className="text-xs text-slate-400 font-mono">{report.equipmentCode}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${REPORT_TYPE_STYLES[report.reportType] || 'bg-slate-100 text-slate-500'}`}>
                                                {reportTypeLabel(report.reportType)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-bold">{report.affectedQuantity}</td>
                                        <td className="p-4">
                                            <p className="text-xs text-slate-600 max-w-[220px] truncate">{report.reason}</p>
                                        </td>
                                        <td className="p-4 text-xs">{toDateKey(new Date(report.reportedAt))}</td>
                                        <td className="p-4">
                                            {report.status === 'PENDING' ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    {reportStatusLabel('PENDING')}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                    {reportStatusLabel('RESOLVED')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {report.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleResolve(report)}
                                                    disabled={busyId === report._id}
                                                    className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    {busyId === report._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    Xử lý
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 bg-white border border-slate-100 rounded-2xl px-4 py-3">
                    <span className="flex items-center gap-1.5"><Wrench className="w-4 h-4 text-amber-500" /> Báo cáo được tạo từ trang danh sách thiết bị</span>
                    <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> Hỏng hóc</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã xử lý</span>
                </div>
            </div>
        </AdminLayout>
    );
}
