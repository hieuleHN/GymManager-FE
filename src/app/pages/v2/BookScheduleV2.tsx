import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import {
    Loader2, Search, Phone, User, Dumbbell, Clock, CalendarDays, CheckCircle2,
    AlertTriangle, CalendarPlus, Save, Users, BadgeCheck, X, Banknote
} from 'lucide-react';
import { toast } from 'sonner';

interface MembershipOption {
    _id: string;
    packageName: string;
    status: string;
    remainingDays: number;
    endDate: string;
    valid: boolean;
}

interface LookupResult {
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    memberships: MembershipOption[];
}

interface Trainer {
    _id: string;
    fullName: string;
    role: string;
}

interface Slot {
    startTime: string;
    endTime: string;
}

interface AvailabilityData {
    date: string;
    dayOfWeek: number;
    working: boolean;
    shift?: { startTime: string; endTime: string };
    availableSlots: Slot[];
    busyBookings: { bookingCode: string; startTime: string; endTime: string }[];
}

const SESSION_TYPES = [
    { key: 'PERSONAL', label: 'Huấn luyện 1-1' },
    { key: 'GROUP', label: 'Huấn luyện nhóm' },
    { key: 'CLASS', label: 'Lớp tập thể' },
    { key: 'OTHER', label: 'Khác' }
];

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

export function BookScheduleV2() {
    const [phone, setPhone] = useState('');
    const [lookedUp, setLookedUp] = useState<LookupResult | null>(null);
    const [lookingUp, setLookingUp] = useState(false);

    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loadingTrainers, setLoadingTrainers] = useState(true);

    const [sessionType, setSessionType] = useState('PERSONAL');
    const [disciplineName, setDisciplineName] = useState('');
    const [trainerId, setTrainerId] = useState('');
    const [date, setDate] = useState(toInputDate(new Date()));
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [packageId, setPackageId] = useState('');
    const [packageName, setPackageName] = useState('');
    const [price, setPrice] = useState('0');
    const [note, setNote] = useState('');

    const [availability, setAvailability] = useState<AvailabilityData | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        setLoadingTrainers(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/staff?role=PT&status=ACTIVE&limit=100`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (res.ok) setTrainers(data.data || []);
        } catch {
            toast.error('Không tải được danh sách PT!');
        } finally {
            setLoadingTrainers(false);
        }
    };

    const handleLookup = async () => {
        if (!phone.trim()) {
            toast.error('Vui lòng nhập số điện thoại khách hàng!');
            return;
        }
        setLookingUp(true);
        setLookedUp(null);
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/bookings/lookup`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ phone: phone.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Tra cứu thất bại');
            setLookedUp(data.data);
            if (data.data.memberships?.length > 0) {
                setPackageId(data.data.memberships[0]._id);
                setPackageName(data.data.memberships[0].packageName);
            }
            toast.success(`Đã tìm thấy "${data.data.customerName}"`);
        } catch (err: any) {
            setAvailabilityError('');
            toast.error(err.message || 'Tra cứu thất bại');
        } finally {
            setLookingUp(false);
        }
    };

    useEffect(() => {
        if (!trainerId || !date) {
            setAvailability(null);
            setStartTime('');
            setEndTime('');
            return;
        }
        const fetchAvailability = async () => {
            setCheckingAvailability(true);
            setAvailabilityError('');
            try {
                const res = await fetch(
                    `${getApiUrl()}/api/v2/bookings/availability?trainerId=${trainerId}&date=${date}`,
                    { headers: getAuthHeaders() }
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch rảnh');
                setAvailability(data.data);
                if (data.data.availableSlots?.length > 0) {
                    const first = data.data.availableSlots[0];
                    setStartTime(first.startTime);
                    setEndTime(first.endTime);
                } else {
                    setStartTime('');
                    setEndTime('');
                }
            } catch (err: any) {
                setAvailabilityError(err.message);
                setAvailability(null);
            } finally {
                setCheckingAvailability(false);
            }
        };
        fetchAvailability();
    }, [trainerId, date]);

    const pickSlot = (slot: Slot) => {
        setStartTime(slot.startTime);
        setEndTime(slot.endTime);
    };

    const handleSubmit = async () => {
        if (!lookedUp) {
            toast.error('Vui lòng tra cứu khách hàng trước!');
            return;
        }
        if (!trainerId) {
            toast.error('Vui lòng chọn PT!');
            return;
        }
        if (!date || !startTime || !endTime) {
            toast.error('Vui lòng chọn ngày và khung giờ!');
            return;
        }
        if (startTime >= endTime) {
            toast.error('Giờ kết thúc phải sau giờ bắt đầu!');
            return;
        }
        setSubmitting(true);
        try {
            const trainer = trainers.find(t => t._id === trainerId);
            const res = await fetch(`${getApiUrl()}/api/v2/bookings`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    customerId: lookedUp.customerId,
                    customerName: lookedUp.customerName,
                    customerPhone: lookedUp.customerPhone,
                    userPackageId: packageId || null,
                    packageName: packageId ? packageName : '',
                    sessionType,
                    disciplineName,
                    trainerId,
                    trainerName: trainer?.fullName || '',
                    date,
                    startTime,
                    endTime,
                    note,
                    price: Number(price) || 0
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đặt lịch thất bại');
            toast.success(data.message || 'Đặt lịch thành công!');
            resetForm();
        } catch (err: any) {
            toast.error(err.message || 'Đặt lịch thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setPhone('');
        setLookedUp(null);
        setSessionType('PERSONAL');
        setDisciplineName('');
        setTrainerId('');
        setDate(toInputDate(new Date()));
        setStartTime('');
        setEndTime('');
        setPackageId('');
        setPackageName('');
        setPrice('0');
        setNote('');
        setAvailability(null);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đặt lịch tập V2</h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo lịch tập cho khách hàng với PT, tự kiểm tra trùng khung giờ</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                                <Search className="w-4 h-4 text-indigo-500" /> Bước 1 · Tra cứu khách hàng
                            </h2>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="Nhập số điện thoại khách hàng..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={handleLookup}
                                    disabled={lookingUp}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                >
                                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                                    {lookingUp ? 'Đang tra...' : 'Tra cứu'}
                                </button>
                            </div>

                            {lookedUp && (
                                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-800">{lookedUp.customerName}</p>
                                            <p className="text-xs text-emerald-700">{lookedUp.customerPhone}{lookedUp.customerEmail ? ` · ${lookedUp.customerEmail}` : ''}</p>
                                            {lookedUp.memberships.length > 0 && (
                                                <div className="mt-2">
                                                    <label className="text-xs font-bold text-emerald-700 uppercase">Chọn gói tập (nếu có)</label>
                                                    <select
                                                        value={packageId}
                                                        onChange={(e) => {
                                                            setPackageId(e.target.value);
                                                            const pkg = lookedUp.memberships.find(m => m._id === e.target.value);
                                                            setPackageName(pkg ? pkg.packageName : '');
                                                        }}
                                                        className="mt-1 w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    >
                                                        <option value="">Không dùng gói</option>
                                                        {lookedUp.memberships.map(m => (
                                                            <option key={m._id} value={m._id}>
                                                                {m.packageName} · {m.valid ? `còn ${m.remainingDays} ngày` : 'hết hạn'} ({m.status})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setLookedUp(null)} className="p-1 text-emerald-500 hover:bg-emerald-100 rounded-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                                <Dumbbell className="w-4 h-4 text-indigo-500" /> Bước 2 · Thông tin buổi tập
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Loại buổi tập</label>
                                    <select
                                        value={sessionType}
                                        onChange={(e) => setSessionType(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {SESSION_TYPES.map(s => (
                                            <option key={s.key} value={s.key}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bộ môn / lớp học</label>
                                    <input
                                        type="text"
                                        placeholder="VD: PT nâng cao, Yoga..."
                                        value={disciplineName}
                                        onChange={(e) => setDisciplineName(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> Huấn luyện viên {loadingTrainers && <Loader2 className="w-3 h-3 animate-spin" />}
                                    </label>
                                    <select
                                        value={trainerId}
                                        onChange={(e) => setTrainerId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Chọn PT --</option>
                                        {trainers.map(t => (
                                            <option key={t._id} value={t._id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5" /> Ngày tập
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={toInputDate(new Date())}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                                        <Banknote className="w-3.5 h-3.5" /> Giá buổi (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ghi chú</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ghi chú cho buổi tập..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-indigo-500" /> Khung giờ rảnh của PT
                            </h2>
                            {!trainerId ? (
                                <p className="text-sm text-slate-400">Chọn PT để xem lịch rảnh.</p>
                            ) : checkingAvailability ? (
                                <div className="py-8 text-center text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin inline" /> Đang tải...
                                </div>
                            ) : availabilityError ? (
                                <p className="text-sm text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> {availabilityError}
                                </p>
                            ) : availability ? (
                                availability.working ? (
                                    <>
                                        <div className="text-xs text-slate-500 mb-3">
                                            Ca làm việc: {availability.shift?.startTime} - {availability.shift?.endTime} · {availability.availableSlots.length} khung trống · {availability.busyBookings.length} buổi đã đặt
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                                            {availability.availableSlots.length === 0 ? (
                                                <p className="col-span-2 text-sm text-slate-400">Không còn khung giờ trống ngày này.</p>
                                            ) : availability.availableSlots.map(slot => {
                                                const active = startTime === slot.startTime && endTime === slot.endTime;
                                                return (
                                                    <button
                                                        key={slot.startTime}
                                                        onClick={() => pickSlot(slot)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all ${
                                                            active
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-400'
                                                        }`}
                                                    >
                                                        {slot.startTime} - {slot.endTime}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-amber-600 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> PT không làm việc vào ngày này.
                                    </p>
                                )
                            ) : (
                                <p className="text-sm text-slate-400">Chọn ngày để tải lịch rảnh.</p>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-all"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                            {submitting ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
                        </button>
                        {availabilityError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-semibold">{availabilityError}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
