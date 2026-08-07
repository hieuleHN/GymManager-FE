import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { Search, UserPlus, Edit, Trash2, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    PT: 'PT / Huấn luyện viên',
    RECEPTIONIST: 'Lễ tân',
    STAFF: 'Nhân viên'
};

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface WorkShift {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    note?: string;
    dayLabel?: string;
}

interface StaffItem {
    _id: string;
    account: string;
    fullName: string;
    email: string;
    phone: string;
    gender: string;
    role: string;
    permissions: string[];
    workSchedule: WorkShift[];
    startDate: string;
    address: string;
    baseSalary: number;
    status: 'ACTIVE' | 'INACTIVE';
}

interface SummaryData {
    total: number;
    active: number;
    inactive: number;
}

export function StaffListV2() {
    const navigate = useNavigate();
    const { selectedClub } = useClub();
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ total: 0, active: 0, inactive: 0 });
    const [roles, setRoles] = useState<string[]>(['ADMIN', 'MANAGER', 'PT', 'RECEPTIONIST', 'STAFF']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/staff/roles`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data?.roles) setRoles(data.data.roles);
        } catch {}
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/staff/summary`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data?.data) setSummary(data.data);
        } catch {}
    };

    const fetchStaff = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/staff?limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải danh sách nhân viên');
            setStaff(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchRoles();
        fetchSummary();
    }, [selectedClub]);

    const filteredStaff = staff.filter(person => {
        const matchesSearch =
            person.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.phone?.includes(searchTerm) ||
            person.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || person.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
        setDeleting(id);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/staff/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
            fetchStaff();
            fetchSummary();
        } catch (err: any) {
            window.alert(err.message || 'Xóa nhân viên thất bại');
        } finally {
            setDeleting(null);
        }
    };

    const formatWorkSchedule = (schedule: WorkShift[]) => {
        if (!schedule || schedule.length === 0) return 'Chưa phân ca';
        return schedule.map(shift => {
            const day = DAY_LABELS[shift.dayOfWeek] || 'CN';
            return `${day} ${shift.startTime}-${shift.endTime}`;
        }).join(' · ');
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Nhân viên V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Danh sách nhân viên, vai trò, lịch làm và phân quyền</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/v2/staff/add')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
                    >
                        <UserPlus className="w-4 h-4" /> Thêm nhân viên
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng nhân viên</p>
                        <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đang hoạt động</p>
                        <p className="text-3xl font-black text-emerald-600">{summary.active}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ngừng hoạt động</p>
                        <p className="text-3xl font-black text-red-500">{summary.inactive}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên, tài khoản, email, số điện thoại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        <button
                            onClick={() => setSelectedRole('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedRole === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Tất cả
                        </button>
                        {roles.map(role => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedRole === role
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {ROLE_LABELS[role] || role}
                            </button>
                        ))}
                    </div>
                </div>

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
                                    <th className="p-4">Nhân Viên</th>
                                    <th className="p-4">Tài Khoản</th>
                                    <th className="p-4">Vai Trò</th>
                                    <th className="p-4">Số Điện Thoại</th>
                                    <th className="p-4">Lịch Làm</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400">
                                            Không tìm thấy nhân viên nào
                                        </td>
                                    </tr>
                                ) : filteredStaff.map((person, index) => (
                                    <tr key={person._id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-500">{index + 1}</td>
                                        <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                                                {person.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div>{person.fullName}</div>
                                                <div className="text-xs text-slate-400 font-normal">{person.email}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-600">{person.account}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                                {ROLE_LABELS[person.role] || person.role}
                                            </span>
                                        </td>
                                        <td className="p-4">{person.phone}</td>
                                        <td className="p-4">
                                            {person.workSchedule && person.workSchedule.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md border text-xs font-medium text-slate-600">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {formatWorkSchedule(person.workSchedule)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Chưa phân ca</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${person.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {person.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/v2/staff/${person._id}/edit`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person._id)}
                                                    disabled={deleting === person._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {deleting === person._id ? (
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
        </AdminLayout>
    );
}
