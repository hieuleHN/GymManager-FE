import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Save, ArrowLeft, CheckCircle2, AlertTriangle, Plus, Trash2, Loader2 } from 'lucide-react';

const DEFAULT_ROLES = ['ADMIN', 'MANAGER', 'PT', 'RECEPTIONIST', 'STAFF'];
const DEFAULT_PERMISSIONS: Record<string, string> = {
    staff: 'Quản lý nhân viên',
    customers: 'Quản lý khách hàng',
    equipment: 'Quản lý thiết bị',
    packages: 'Quản lý gói tập',
    products: 'Quản lý sản phẩm',
    services: 'Quản lý dịch vụ',
    attendance: 'Điểm danh',
    statistics: 'Thống kê & Báo cáo',
    payment: 'Thanh toán',
    expenses: 'Quản lý chi phí',
    training: 'Huấn luyện',
    schedule: 'Lịch tập',
    tasks: 'Công việc',
    salary: 'Lương',
    permissions: 'Phân quyền',
    clubs: 'Cơ sở',
    lockers: 'Tủ đồ',
    wallet: 'Ví điện tử'
};

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

interface WorkShift {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    note: string;
}

interface LocationItem {
    _id: string;
    title?: string;
    address?: string;
}

const initialShift = (): WorkShift => ({ dayOfWeek: 1, startTime: '08:00', endTime: '17:00', note: '' });

export function AddStaffV2() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [form, setForm] = useState({
        account: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        gender: 'Nam',
        role: 'STAFF',
        startDate: new Date().toISOString().split('T')[0],
        address: '',
        locationId: '',
        baseSalary: ''
    });
    const [permissions, setPermissions] = useState<string[]>([]);
    const [workSchedule, setWorkSchedule] = useState<WorkShift[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${getApiUrl()}/api/v2/staff/roles`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data?.data?.roles) setRoles(data.data.roles);
            })
            .catch(() => {});
        fetch(`${getApiUrl()}/api/locations`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLocations(data);
            })
            .catch(() => {});
    }, []);

    const setField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const togglePermission = (key: string) => {
        setPermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const updateShift = (index: number, field: keyof WorkShift, value: string | number) => {
        setWorkSchedule(prev => prev.map((shift, i) =>
            i === index ? { ...shift, [field]: value } : shift
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!form.account.trim() || !form.password || !form.fullName.trim() || !form.phone.trim()) {
            setError('Vui lòng nhập đầy đủ tài khoản, mật khẩu, họ tên và số điện thoại!');
            return;
        }
        if (form.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(form.phone.trim())) {
            setError('Số điện thoại không đúng định dạng Việt Nam!');
            return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Email không hợp lệ!');
            return;
        }

        setLoading(true);
        try {
            const body = {
                account: form.account,
                password: form.password,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                gender: form.gender,
                role: form.role,
                permissions,
                workSchedule,
                startDate: form.startDate,
                address: form.address,
                locationId: form.locationId || null,
                baseSalary: Number(form.baseSalary) || 0
            };
            const res = await fetch(`${getApiUrl()}/api/v2/staff`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Thêm nhân viên thất bại');
            setSuccess(true);
            setTimeout(() => navigate('/admin/v2/staff'), 1200);
        } catch (err: any) {
            setError(err.message || 'Thêm nhân viên thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Thêm Nhân viên V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Tạo nhân viên mới, chọn vai trò, phân quyền và lịch làm việc</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/v2/staff')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                </div>

                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">Thêm nhân viên thành công! Đang chuyển trang...</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tài Khoản <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={form.account}
                                onChange={(e) => setField('account', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mật Khẩu <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setField('password', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Họ và Tên <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={form.fullName}
                                onChange={(e) => setField('fullName', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Điện Thoại <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={form.phone}
                                onChange={(e) => setField('phone', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Giới Tính</label>
                            <select
                                value={form.gender}
                                onChange={(e) => setField('gender', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Vai Trò <span className="text-red-500">*</span></label>
                            <select
                                value={form.role}
                                onChange={(e) => setField('role', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Phòng Tập</label>
                            <select
                                value={form.locationId}
                                onChange={(e) => setField('locationId', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Chưa gán phòng tập</option>
                                {locations.map(loc => (
                                    <option key={loc._id} value={loc._id}>{loc.title || loc.address}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ngày Bắt Đầu</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setField('startDate', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Lương Cơ Bản (đ)</label>
                            <input
                                type="number"
                                min={0}
                                value={form.baseSalary}
                                onChange={(e) => setField('baseSalary', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Địa Chỉ</label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={(e) => setField('address', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-3">Phân Quyền</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(DEFAULT_PERMISSIONS).map(([key, label]) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition-all ${permissions.includes(key)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(key)}
                                        onChange={() => togglePermission(key)}
                                        className="accent-indigo-600"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800">Lịch Làm Việc</h3>
                            <button
                                type="button"
                                onClick={() => setWorkSchedule(prev => [...prev, initialShift()])}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Thêm ca
                            </button>
                        </div>
                        {workSchedule.length === 0 && (
                            <p className="text-xs text-slate-400">Chưa có ca làm nào. Nhấn "Thêm ca" để tạo lịch làm việc.</p>
                        )}
                        {workSchedule.map((shift, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 mb-3 items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thứ</label>
                                    <select
                                        value={shift.dayOfWeek}
                                        onChange={(e) => updateShift(index, 'dayOfWeek', Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {DAY_LABELS.map((day, dayIndex) => (
                                            <option key={day} value={dayIndex}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ Bắt Đầu</label>
                                    <input
                                        type="time"
                                        value={shift.startTime}
                                        onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ Kết Thúc</label>
                                    <input
                                        type="time"
                                        value={shift.endTime}
                                        onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ghi Chú</label>
                                    <input
                                        type="text"
                                        value={shift.note}
                                        placeholder="Ca sáng, ca tối..."
                                        onChange={(e) => updateShift(index, 'note', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => setWorkSchedule(prev => prev.filter((_, i) => i !== index))}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        title="Xóa ca"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/v2/staff')}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Đang lưu...' : 'Thêm Nhân Viên'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
