import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    CheckCircle2, AlertTriangle, Loader2, Search, CalendarCheck2, Users,
    UserX, UserCheck, ScanLine, Clock, History, Phone, X, Check
} from 'lucide-react';

interface AttendanceRecord {
    _id: string;
    customerName: string;
    customerPhone: string;
    packageName: string;
    checkInTime: string;
    timeLabel: string;
    method: 'QR' | 'MANUAL';
    status: string;
}

interface MemberStatus {
    customerId: string;
    customerName: string;
    customerPhone: string;
    packageName: string;
    membershipId: string;
    remainingDays: number;
    checkedIn: boolean;
    checkInTime: string | null;
    attendanceId: string | null;
}

interface SummaryData {
    total: number;
    activeMembersCount: number;
    notCheckedIn: number;
    rate: number;
}

interface TrendItem {
    date: string;
    label: string;
    count: number;
}

interface LookupPackage {
    _id: string;
    packageName: string;
    status: string;
    paymentStatus: string;
    endDate: string;
    remainingDays: number;
    valid: boolean;
}

interface LookupResult {
    customerName: string;
    customerPhone: string;
    customerId: string | null;
    memberships: LookupPackage[];
}

export function AttendanceV2() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [members, setMembers] = useState<MemberStatus[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ total: 0, activeMembersCount: 0, notCheckedIn: 0, rate: 0 });
    const [trend, setTrend] = useState<TrendItem[]>([]);
    const [phone, setPhone] = useState('');
    const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [lookuping, setLookuping] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [recordsRes, membersRes, summaryRes, trendRes] = await Promise.all([
                fetch(`${getApiUrl()}/api/v2/attendance/today`, { headers: getAuthHeaders() }),
                fetch(`${getApiUrl()}/api/v2/attendance/members-status`, { headers: getAuthHeaders() }),
                fetch(`${getApiUrl()}/api/v2/attendance/summary`, { headers: getAuthHeaders() }),
                fetch(`${getApiUrl()}/api/v2/attendance/trend?days=7`, { headers: getAuthHeaders() })
            ]);
            const [recordsData, membersData, summaryData, trendData] = await Promise.all([
                recordsRes.json(), membersRes.json(), summaryRes.json(), trendRes.json()
            ]);
            if (!recordsRes.ok) throw new Error(recordsData.message || 'Lỗi tải dữ liệu điểm danh');
            setRecords(recordsData.data || []);
            setMembers(membersData.data || []);
            if (summaryData?.data) setSummary(summaryData.data);
            if (trendData?.data) setTrend(trendData.data);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const isValidPhone = (value: string) => /^0\d{9,10}$/.test(value.trim());

    const handleLookup = async () => {
        const phoneValue = phone.trim();
        setLookupError('');
        setLookupResult(null);
        if (!phoneValue) {
            setLookupError('Vui lòng nhập số điện thoại hội viên');
            return;
        }
        if (!isValidPhone(phoneValue)) {
            setLookupError('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10-11 chữ số)');
            return;
        }
        setLookuping(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance/lookup`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ phone: phoneValue })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không tìm thấy hội viên');
            setLookupResult(data.data);
        } catch (err: any) {
            setLookupError(err.message);
        } finally {
            setLookuping(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!lookupResult) return;
        setLookupError('');
        setConfirming(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance/check-in`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ customerPhone: lookupResult.customerPhone, method: 'MANUAL' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Điểm danh thất bại');
            showBanner(data.message || 'Điểm danh thành công');
            setPhone('');
            setLookupResult(null);
            fetchAll();
        } catch (err: any) {
            setLookupError(err.message);
        } finally {
            setConfirming(false);
        }
    };

    const handleUndoCheckIn = async (record: AttendanceRecord) => {
        if (!window.confirm(`Hủy bản ghi điểm danh của "${record.customerName}" lúc ${record.timeLabel}?`)) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/attendance/${record._id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Hủy thất bại');
            showBanner('Đã xóa bản ghi điểm danh');
            fetchAll();
        } catch (err: any) {
            window.alert(err.message);
        }
    };

    const filteredMembers = members.filter(m =>
        m.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.customerPhone?.includes(searchTerm) ||
        m.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const maxTrendCount = Math.max(...trend.map(item => item.count), 1);
    const hasValidPackage = !!lookupResult?.memberships.some(m => m.valid);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Điểm danh hội viên V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Điểm danh hôm nay, theo dõi hội viên đã đến phòng tập</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/v2/attendance/history')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                        <History className="w-4 h-4" /> Lịch sử điểm danh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Điểm danh hôm nay</p>
                        <p className="text-3xl font-black text-emerald-600">{summary.total}</p>
                        <p className="text-xs text-slate-400 mt-1">lượt điểm danh</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Xem điểm danh</p>
                        <p className="text-3xl font-black text-emerald-600">{summary.total}</p>
                        <p className="text-xs text-slate-400 mt-1">Xem điểm danh</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Hội viên hoạt động</p>
                        <p className="text-3xl font-black text-slate-900">{summary.activeMembersCount}</p>
                        <p className="text-xs text-slate-400 mt-1">có gói còn hiệu lực</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Chưa điểm danh</p>
                        <p className="text-3xl font-black text-amber-500">{summary.notCheckedIn}</p>
                        <p className="text-xs text-slate-400 mt-1">hội viên chưa đến</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tỷ lệ điểm danh</p>
                        <p className="text-3xl font-black text-indigo-600">{summary.rate}%</p>
                        <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${summary.rate}%` }} />
                        </div>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                                <ScanLine className="w-4 h-4 text-indigo-500" /> Điểm danh thủ công
                            </h2>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="Nhập số điện thoại hội viên..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="Nhập số điện thoại hội viên(rõ ràng chi tiết)..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={handleLookup}
                                    disabled={lookuping}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-900 disabled:opacity-60 transition-all"
                                >
                                    {lookuping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    {lookuping ? 'Đang tra cứu...' : 'Tra cứu'}
                                </button>
                            </div>

                            {lookupError && (
                                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" /> {lookupError}
                                </div>
                            )}

                            {lookupResult && (
                                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-slate-900">{lookupResult.customerName}</p>
                                            <p className="text-xs text-slate-400">{lookupResult.customerPhone}</p>
                                        </div>
                                        <button
                                            onClick={() => { setLookupResult(null); setLookupError(''); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
                                            title="Đóng"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        {lookupResult.memberships.map(m => (
                                            <div key={m._id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{m.packageName}</p>
                                                    <p className="text-xs text-slate-400">
                                                        Hết hạn: {new Date(m.endDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.valid
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {m.valid ? `Còn ${m.remainingDays} ngày` : 'Hết hiệu lực'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {hasValidPackage ? (
                                        <button
                                            onClick={handleConfirmCheckIn}
                                            disabled={confirming}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                        >
                                            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                            {confirming ? 'Đang xử lý...' : 'Xác nhận điểm danh'}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                                            <UserX className="w-4 h-4" /> Hội viên không có gói tập còn hiệu lực
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-slate-400 mt-3">
                                Hệ thống tự kiểm tra gói tập còn hiệu lực & chặn điểm danh trùng trong ngày.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-500" /> Điểm danh hôm nay
                                </h2>
                                <span className="text-xs font-semibold text-slate-400">{records.length} bản ghi</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                                        <tr>
                                            <th className="p-4">Thời Gian</th>
                                            <th className="p-4">Hội Viên</th>
                                            <th className="p-4">Gói Tập</th>
                                            <th className="p-4">Hình Thức</th>
                                            <th className="p-4 text-center">Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...
                                                </td>
                                            </tr>
                                        ) : records.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                                    Chưa có hội viên nào điểm danh hôm nay
                                                </td>
                                            </tr>
                                        ) : records.map(record => (
                                            <tr key={record._id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-800">{record.timeLabel}</td>
                                                <td className="p-4">
                                                    <span className="font-semibold text-slate-800">{record.customerName}</span>
                                                    <div className="text-xs text-slate-400">{record.customerPhone}</div>
                                                </td>
                                                <td className="p-4 text-xs">{record.packageName || '—'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${record.method === 'QR'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {record.method === 'QR' ? 'Quét QR' : 'Nhập tay'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleUndoCheckIn(record)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Xóa bản ghi"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                                <CalendarCheck2 className="w-4 h-4 text-indigo-500" /> Điểm danh 7 ngày gần nhất
                            </h2>
                            <div className="flex items-end gap-3 h-32">
                                {trend.map(item => (
                                    <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700">{item.count}</span>
                                        <div
                                            className="w-full bg-indigo-500 rounded-t-lg min-h-[4px]"
                                            style={{ height: `${Math.max(6, (item.count / maxTrendCount) * 100)}%` }}
                                            title={`${item.label}: ${item.count} lượt`}
                                        />
                                        <span className="text-[10px] text-slate-400 font-semibold">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Hội viên đang hoạt động
                            </h2>
                            <div className="relative mt-3">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm hội viên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="max-h-[540px] overflow-y-auto divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin inline" />
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">Không có hội viên nào</div>
                            ) : filteredMembers.map(member => (
                                <div key={member.membershipId} className="p-4 flex items-center gap-3 hover:bg-slate-50/50">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${member.checkedIn
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {member.checkedIn ? <Check className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-800 text-sm truncate">{member.customerName}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {member.packageName} · còn {member.remainingDays} ngày
                                        </p>
                                    </div>
                                    {member.checkedIn ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shrink-0">
                                            {member.checkInTime}
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 shrink-0">
                                            Chưa đến
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
