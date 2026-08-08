import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders, useAuth } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import {
    Lock, Unlock, AlertTriangle, Search, Plus, X, Trash2, Rows3, PlusCircle,
    PackagePlus, LayoutGrid, User, Wrench, Boxes, Gauge, Info, Loader2, Clock, CheckCircle2
} from 'lucide-react';

type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
type Zone = 'NAM' | 'NU' | 'VIP';

interface LockerItem {
    id: string;
    code: string;
    status: LockerStatus;
    customerName?: string;
    assignedType?: 'MEMBER' | 'STAFF';
    assignedPhone?: string;
    assignedAt?: string;
    maintenanceType?: string;
    maintenanceDescription?: string;
    maintenanceImage?: string;
    maintenanceAt?: string;
}

interface LockerRow {
    id: string;
    name: string;
    prefix: string;
    zone: Zone;
    lockers: LockerItem[];
}

interface LockerApiItem {
    _id: string;
    lockerNumber: string;
    prefix: string;
    zone: Zone;
    status: LockerStatus;
    note: string;
    assignedType: 'MEMBER' | 'STAFF' | null;
    assignedName: string;
    assignedPhone: string;
    assignedAt: string | null;
    maintenanceType: string;
    maintenanceDescription: string;
    maintenanceImage: string;
    maintenanceAt: string | null;
}

interface Stats {
    total: number;
    occupied: number;
    maintenance: number;
    available: number;
    usageRate: string;
}

const ZONE_META: Record<Zone, { label: string; badge: string }> = {
    NAM: { label: 'Khu Nam', badge: 'bg-sky-100 text-sky-700' },
    NU: { label: 'Khu Nữ', badge: 'bg-pink-100 text-pink-700' },
    VIP: { label: 'Khu VIP', badge: 'bg-violet-100 text-violet-700' },
};

const STATUS_META: Record<LockerStatus, { label: string; card: string; iconCls: string }> = {
    AVAILABLE: {
        label: 'Trống',
        card: 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-400 hover:shadow-md',
        iconCls: 'text-emerald-500',
    },
    OCCUPIED: {
        label: 'Đang sử dụng',
        card: 'bg-slate-900 border-slate-800 text-white hover:border-indigo-500 hover:shadow-md',
        iconCls: 'text-indigo-400',
    },
    MAINTENANCE: {
        label: 'Bảo trì',
        card: 'bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-400 hover:shadow-md',
        iconCls: 'text-amber-500',
    },
};

const STATUS_OPTIONS: { key: LockerStatus; label: string; desc: string; card: string; active: string }[] = [
    { key: 'AVAILABLE', label: 'Trống', desc: 'Sẵn sàng cho khách', card: 'bg-emerald-50/70 border-emerald-200', active: 'ring-2 ring-emerald-500 border-emerald-500' },
    { key: 'OCCUPIED', label: 'Đang sử dụng', desc: 'Đã gán cho khách', card: 'bg-slate-50 border-slate-200', active: 'ring-2 ring-indigo-500 border-indigo-500' },
    { key: 'MAINTENANCE', label: 'Bảo trì', desc: 'Hỏng / đang sửa chữa', card: 'bg-amber-50/70 border-amber-200', active: 'ring-2 ring-amber-500 border-amber-500' },
];

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelCls = 'block text-xs font-bold text-slate-700 uppercase mb-1.5';

const normalizePrefix = (prefix: string): string => {
    const p = prefix.trim().replace(/-+$/, '');
    return p || 'LK';
};

const getNextNumbers = (codes: Iterable<string>, prefix: string, count: number): { base: string; width: number; numbers: number[] } => {
    const p = normalizePrefix(prefix);
    let width = 3;
    let min = Infinity;
    let hasAny = false;
    const used = new Set<number>();
    for (const code of codes) {
        const match = code.trim().match(/^(.+?)(\d+)$/);
        if (!match) continue;
        const codePrefix = match[1].replace(/-+$/, '');
        if (codePrefix !== p) continue;
        const num = parseInt(match[2], 10);
        used.add(num);
        hasAny = true;
        if (num < min) min = num;
        width = match[2].length;
    }
    const n = Math.max(1, Math.floor(count));
    const numbers: number[] = [];
    if (!hasAny) {
        for (let i = 0; i < n; i++) numbers.push(1 + i);
    } else {
        let candidate = min;
        while (numbers.length < n) {
            if (!used.has(candidate)) numbers.push(candidate);
            candidate++;
        }
    }
    return { base: `${p}-`, width, numbers };
};

const generateNextCodes = (codes: Iterable<string>, prefix: string, count: number): string[] => {
    const { base, width, numbers } = getNextNumbers(codes, prefix, count);
    return numbers.map(num => `${base}${String(num).padStart(width, '0')}`);
};

function Modal({ title, subtitle, icon, onClose, children }: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">{icon}</div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}

function AddRowModal({ existingCodes, onClose, onAdd }: {
    existingCodes: Set<string>;
    onClose: () => void;
    onAdd: (data: { prefix: string; zone: Zone; count: number; rowName: string }) => void;
}) {
    const [rowName, setRowName] = useState('');
    const [prefix, setPrefix] = useState('LK');
    const [zone, setZone] = useState<Zone>('NAM');
    const [count, setCount] = useState(5);
    const [error, setError] = useState('');

    const previewCodes = useMemo(() => generateNextCodes(existingCodes, prefix, count), [existingCodes, prefix, count]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = rowName.trim();
        if (!name) { setError('Vui lòng nhập tên dãy tủ!'); return; }
        if (count < 1) { setError('Số lượng tủ phải từ 1 trở lên!'); return; }
        onAdd({ prefix: normalizePrefix(prefix), zone, count, rowName: name });
        onClose();
    };

    return (
        <Modal title="Thêm dãy tủ mới" subtitle="Tạo một dãy tủ cùng các tủ con bên trong" icon={<LayoutGrid className="w-6 h-6" />} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Tên dãy tủ *</label>
                        <input type="text" required placeholder="VD: A, B, C..." value={rowName} onChange={(e) => { setRowName(e.target.value); setError(''); }}
                            className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Khu vực *</label>
                        <select value={zone} onChange={(e) => setZone(e.target.value as Zone)} className={inputCls}>
                            <option value="NAM">Khu Nam</option>
                            <option value="NU">Khu Nữ</option>
                            <option value="VIP">Khu VIP</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Tên đầu mã tủ *</label>
                        <input type="text" required placeholder="VD: LK, MT..." value={prefix}
                            onChange={(e) => { setPrefix(e.target.value); setError(''); }} className={inputCls} />
                        <p className="text-[11px] text-slate-400 mt-1">Nhập MT thì tủ sẽ có mã MT-001, MT-002...</p>
                    </div>
                    <div>
                        <label className={labelCls}>Số lượng tủ *</label>
                        <input type="number" min={1} max={50} required value={count} onChange={(e) => setCount(parseInt(e.target.value) || 0)} className={inputCls} />
                        <p className="text-[11px] text-slate-400 mt-1">Tự động bù số trống / tăng tiếp từ mã lớn nhất</p>
                    </div>
                </div>

                {previewCodes.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Sẽ tạo {previewCodes.length} tủ:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {previewCodes.slice(0, 8).map((c, i) => (
                                <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono font-semibold text-slate-700">{c}</span>
                            ))}
                            {previewCodes.length > 8 && <span className="px-2 py-1 text-xs text-slate-400">+{previewCodes.length - 8} tủ nữa</span>}
                        </div>
                    </div>
                )}

                {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm">Thêm dãy tủ</button>
                </div>
            </form>
        </Modal>
    );
}

function AddLockerModal({ rows, defaultPrefix, existingCodes, onClose, onAdd }: {
    rows: LockerRow[];
    defaultPrefix: string;
    existingCodes: Set<string>;
    onClose: () => void;
    onAdd: (data: { prefix: string; count: number; status: LockerStatus }) => void;
}) {
    const [prefix, setPrefix] = useState(defaultPrefix || rows[0]?.prefix || 'LK');
    const [count, setCount] = useState(1);
    const [status, setStatus] = useState<LockerStatus>('AVAILABLE');
    const [error, setError] = useState('');

    const codes = useMemo(() => generateNextCodes(existingCodes, prefix, count), [existingCodes, prefix, count]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prefix) { setError('Vui lòng chọn dãy tủ!'); return; }
        if (count < 1) { setError('Số lượng tủ phải từ 1 trở lên!'); return; }
        onAdd({ prefix, count, status });
        onClose();
    };

    return (
        <Modal title="Thêm tủ vào dãy" subtitle="Thêm một hoặc nhiều tủ vào dãy đã chọn" icon={<PackagePlus className="w-6 h-6" />} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelCls}>Dãy tủ *</label>
                    <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputCls}>
                        {rows.map(row => (
                            <option key={row.prefix} value={row.prefix}>Dãy {row.name} ({ZONE_META[row.zone].label})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Số lượng tủ cần thêm *</label>
                    <input type="number" min={1} max={20} required value={count} onChange={(e) => setCount(parseInt(e.target.value) || 0)} className={inputCls} />
                    <p className="text-[11px] text-slate-400 mt-1">Mã sẽ tự sinh theo loại "{prefix}" (bù số trống / tăng tiếp từ mã lớn nhất)</p>
                </div>
                <div>
                    <label className={labelCls}>Trạng thái ban đầu</label>
                    <div className="grid grid-cols-3 gap-2">
                        {STATUS_OPTIONS.map(opt => (
                            <button key={opt.key} type="button" onClick={() => setStatus(opt.key)}
                                className={`px-3 py-2.5 rounded-xl border text-center transition-all ${status === opt.key ? opt.active : opt.card} ${status === opt.key ? 'ring-2 ring-offset-1' : ''}`}>
                                <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {codes.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Sẽ thêm {codes.length} tủ mới:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {codes.slice(0, 10).map((c, i) => (
                                <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono font-semibold text-slate-700">{c}</span>
                            ))}
                            {codes.length > 10 && <span className="px-2 py-1 text-xs text-slate-400">+{codes.length - 10} tủ nữa</span>}
                        </div>
                    </div>
                )}

                {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm">Thêm tủ</button>
                </div>
            </form>
        </Modal>
    );
}

const MAINTENANCE_TYPES = ['Khóa hỏng', 'Cửa kẹt', 'Móc treo hỏng', 'Ốc / phụ kiện lỏng', 'Móp / vỡ tủ', 'Khác'];

interface EditLockerData {
    personType?: 'MEMBER' | 'STAFF' | 'WALKIN';
    name?: string;
    phone?: string;
    maintenanceType?: string;
    maintenanceDescription?: string;
    maintenanceImage?: string;
}

function EditLockerModal({ locker, onClose, onSave, onDelete }: {
    locker: LockerItem;
    onClose: () => void;
    onSave: (status: LockerStatus, data: EditLockerData) => void;
    onDelete: () => void;
}) {
    const [status, setStatus] = useState<LockerStatus>(locker.status);
    const [personType, setPersonType] = useState<'MEMBER' | 'STAFF' | 'WALKIN'>(locker.assignedType === 'STAFF' ? 'STAFF' : 'MEMBER');
    const [customerName, setCustomerName] = useState(locker.customerName || '');
    const [phone, setPhone] = useState(locker.assignedPhone || '');
    const [maintenanceType, setMaintenanceType] = useState(locker.maintenanceType || '');
    const [maintenanceDescription, setMaintenanceDescription] = useState(locker.maintenanceDescription || '');
    const [maintenanceImage, setMaintenanceImage] = useState(locker.maintenanceImage || '');

    const handleImageFile = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setMaintenanceImage(String(reader.result || ''));
        reader.readAsDataURL(file);
    };

    const visibleOptions = STATUS_OPTIONS.filter(opt => !(locker.status === 'OCCUPIED' && opt.key === 'AVAILABLE'));

    return (
        <Modal title={`Tủ ${locker.code}`} subtitle="Cập nhật trạng thái hoặc thông tin" icon={<Lock className="w-6 h-6" />} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className={labelCls}>Trạng thái tủ</label>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleOptions.length}, 1fr)` }}>
                        {visibleOptions.map(opt => (
                            <button key={opt.key} type="button" onClick={() => setStatus(opt.key)}
                                className={`px-3 py-2.5 rounded-xl border text-center transition-all ${status === opt.key ? opt.active : opt.card}`}>
                                <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {status === 'OCCUPIED' && (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div>
                            <label className={labelCls}>Loại người dùng</label>
                            <select value={personType} onChange={(e) => setPersonType(e.target.value as EditLockerData['personType'])} className={inputCls}>
                                <option value="MEMBER">Hội viên</option>
                                <option value="WALKIN">Khách tập thử (chưa có tài khoản)</option>
                                <option value="STAFF">Nhân viên</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Tên người sử dụng</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Nhập tên khách hàng / nhân viên..." value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)} className={`${inputCls} pl-9`} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Số điện thoại <span className="text-slate-400 normal-case">(không bắt buộc)</span></label>
                            <input type="text" placeholder="Nhập số điện thoại (nếu có)..." value={phone}
                                onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                        </div>
                    </div>
                )}

                {status === 'MAINTENANCE' && (
                    <div className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                        <div>
                            <label className={labelCls}>Loại vấn đề *</label>
                            <select value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} className={inputCls} required>
                                <option value="">-- Chọn loại vấn đề --</option>
                                {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Mô tả</label>
                            <textarea rows={3} placeholder="Mô tả chi tiết tình trạng tủ..." value={maintenanceDescription}
                                onChange={(e) => setMaintenanceDescription(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Ảnh báo cáo</label>
                            <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])}
                                className="w-full text-xs text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200" />
                            {maintenanceImage && (
                                <img src={maintenanceImage} alt="Ảnh bảo trì"
                                    className="mt-2 w-full max-h-44 object-cover rounded-xl border border-amber-200" />
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 inline-flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" /> Xóa tủ
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">Hủy</button>
                        <button
                            type="button"
                            onClick={() => {
                                if (status === 'MAINTENANCE' && !maintenanceType) { window.alert('Vui lòng chọn loại vấn đề!'); return; }
                                onSave(status, {
                                    personType,
                                    name: status === 'OCCUPIED' ? (customerName.trim() || 'Khách hàng') : undefined,
                                    phone: status === 'OCCUPIED' ? phone.trim() : undefined,
                                    maintenanceType,
                                    maintenanceDescription,
                                    maintenanceImage: status === 'MAINTENANCE' ? maintenanceImage : undefined,
                                });
                            }}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function formatDuration(assignedAt?: string): string {
    if (!assignedAt) return '—';
    const start = new Date(assignedAt).getTime();
    if (Number.isNaN(start)) return '—';
    const minutes = Math.max(0, Math.floor((Date.now() - start) / 60000));
    if (minutes < 1) return 'vừa mới';
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} giờ ${rem} phút` : `${hours} giờ`;
}

function formatDateTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

interface LockerDetailModalProps {
    locker: LockerItem;
    onClose: () => void;
    onRelease: () => void;
    onEdit: () => void;
}

function LockerDetailModal({ locker, onClose, onRelease, onEdit }: LockerDetailModalProps) {
    return (
        <Modal
            title={`Tủ ${locker.code}`}
            subtitle="Thông tin người đang sử dụng tủ"
            icon={<Lock className="w-6 h-6" />}
            onClose={onClose}
        >
            <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span className="text-xs font-bold">Đã sử dụng <span className="underline decoration-dotted">{formatDuration(locker.assignedAt)}</span></span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Loại người dùng:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${locker.assignedType === 'STAFF' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {locker.assignedType === 'STAFF' ? 'Nhân viên' : 'Hội viên'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                        <span className="text-xs text-slate-500">Tên người dùng:</span>
                        <span className="text-sm font-black text-slate-900 text-right">{locker.customerName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                        <span className="text-xs text-slate-500">Số điện thoại:</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{locker.assignedPhone || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                        <span className="text-xs text-slate-500">Bắt đầu sử dụng:</span>
                        <span className="text-xs font-bold text-slate-700">{formatDateTime(locker.assignedAt)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center gap-2 pt-1">
                    <button type="button" onClick={onEdit}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 inline-flex items-center gap-1.5">
                        <Wrench className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">Đóng</button>
                        <button type="button" onClick={onRelease}
                            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                            <Unlock className="w-4 h-4" /> Trả tủ
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function MaintenanceDetailModal({ locker, onClose, onComplete }: {
    locker: LockerItem;
    onClose: () => void;
    onComplete: () => void;
}) {
    return (
        <Modal
            title={`Tủ ${locker.code}`}
            subtitle="Báo cáo bảo trì"
            icon={<AlertTriangle className="w-6 h-6" />}
            onClose={onClose}
        >
            <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="text-xs font-bold">Đang bảo trì từ <span className="underline decoration-dotted">{formatDateTime(locker.maintenanceAt)}</span> · đã {formatDuration(locker.maintenanceAt)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center gap-3">
                        <span className="text-xs text-slate-500">Loại vấn đề:</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{locker.maintenanceType || '—'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500">Mô tả:</span>
                        <p className="text-sm font-semibold text-slate-800 mt-1 bg-white border border-slate-100 rounded-lg p-2.5">
                            {locker.maintenanceDescription || 'Không có mô tả.'}
                        </p>
                    </div>
                    {locker.maintenanceImage && (
                        <div>
                            <span className="text-xs text-slate-500">Ảnh báo cáo:</span>
                            <img src={locker.maintenanceImage} alt="Ảnh bảo trì"
                                className="mt-1 w-full max-h-52 object-cover rounded-xl border border-slate-200" />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">Đóng</button>
                    <button type="button" onClick={onComplete}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Hoàn tất bảo trì
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export function LockerManagementDiagram() {
    const { user } = useAuth();
    const { selectedClub } = useClub();
    const [currentClubName, setCurrentClubName] = useState('');
    const [rows, setRows] = useState<LockerRow[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, occupied: 0, maintenance: 0, available: 0, usageRate: '0%' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [zoneFilter, setZoneFilter] = useState<'ALL' | Zone>('ALL');

    const [showAddRow, setShowAddRow] = useState(false);
    const [addLockerPrefix, setAddLockerPrefix] = useState<string | null>(null);
    const [editing, setEditing] = useState<LockerItem | null>(null);
    const [viewing, setViewing] = useState<LockerItem | null>(null);
    const [viewingMaintenance, setViewingMaintenance] = useState<LockerItem | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(t);
    }, []);

    // Lấy tên phòng tập hiện tại của nhân viên đăng nhập để hiển thị banner
    useEffect(() => {
        const locId = selectedClub && selectedClub !== 'all' ? selectedClub : (user?.locationId || null);
        if (!locId) {
            setCurrentClubName('');
            return;
        }
        fetch(`${getApiUrl()}/api/locations`)
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                const loc = list.find((l: any) => String(l._id) === String(locId));
                if (loc) setCurrentClubName(loc.title || loc.address || '');
            })
            .catch(() => {});
    }, [selectedClub, user?.locationId]);

    const showBanner = (message: string) => {
        setBanner(message);
        setTimeout(() => setBanner(''), 4000);
    };

    const fetchLockers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/lockers`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi tải dữ liệu tủ đồ');
            const map = new Map<string, LockerRow>();
            (json.data || []).forEach((l: LockerApiItem) => {
                const key = l.prefix || 'LK';
                if (!map.has(key)) {
                    map.set(key, { id: key, name: (l.note || '').trim() || key, prefix: key, zone: l.zone, lockers: [] });
                }
                map.get(key)!.lockers.push({
                    id: l._id,
                    code: l.lockerNumber,
                    status: l.status,
                    customerName: l.assignedName || undefined,
                    assignedType: l.assignedType || undefined,
                    assignedPhone: l.assignedPhone || undefined,
                    assignedAt: l.assignedAt || undefined,
                    maintenanceType: l.maintenanceType || undefined,
                    maintenanceDescription: l.maintenanceDescription || undefined,
                    maintenanceImage: l.maintenanceImage || undefined,
                    maintenanceAt: l.maintenanceAt || undefined,
                });
            });
            setRows(Array.from(map.values()));
            if (json.stats) setStats(json.stats);
        } catch (err: any) {
            setError(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    }, [selectedClub]);

    useEffect(() => { fetchLockers(); }, [fetchLockers]);

    const existingCodes = useMemo(() => new Set(rows.flatMap(r => r.lockers).map(l => l.code)), [rows]);

    const usageRate = stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0;

    const runRequest = async (url: string, options: RequestInit) => {
        try {
            const res = await fetch(`${getApiUrl()}${url}`, { ...options, headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Thao tác thất bại');
            return json;
        } catch (err: any) {
            setError(err.message || 'Lỗi hệ thống');
            return null;
        }
    };

    const handleAddRow = async (data: { prefix: string; zone: Zone; count: number; rowName: string }) => {
        const json = await runRequest('/api/v2/lockers/row', {
            method: 'POST',
            body: JSON.stringify({ prefix: data.prefix, zone: data.zone, count: data.count, rowName: data.rowName })
        });
        if (json) {
            showBanner(json.message || 'Đã thêm dãy tủ');
            fetchLockers();
        }
    };

    const handleAddLockers = async (data: { prefix: string; count: number; status: LockerStatus }) => {
        const json = await runRequest('/api/v2/lockers/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (json) {
            showBanner(json.message || 'Đã thêm tủ');
            fetchLockers();
        }
    };

    const handleSaveLocker = async (status: LockerStatus, data: EditLockerData = {}) => {
        if (!editing) return;
        let json: any = null;
        if (status === 'OCCUPIED') {
            json = await runRequest(`/api/v2/lockers/${editing.id}/assign`, {
                method: 'POST',
                body: JSON.stringify({
                    personType: data.personType === 'STAFF' ? 'STAFF' : 'MEMBER',
                    name: data.name || 'Khách hàng',
                    phone: data.phone || ''
                })
            });
        } else {
            json = await runRequest(`/api/v2/lockers/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status,
                    ...(status === 'MAINTENANCE' ? {
                        maintenanceType: data.maintenanceType || '',
                        maintenanceDescription: data.maintenanceDescription || '',
                        maintenanceImage: data.maintenanceImage || '',
                    } : {})
                })
            });
        }
        if (json) {
            showBanner(json.message || 'Đã cập nhật tủ');
            setEditing(null);
            fetchLockers();
        }
    };

    const handleDeleteLocker = async () => {
        if (!editing) return;
        const json = await runRequest(`/api/v2/lockers/${editing.id}`, { method: 'DELETE' });
        if (json) {
            showBanner('Đã xóa tủ');
            setEditing(null);
            fetchLockers();
        }
    };

    const handleReleaseLocker = async () => {
        if (!viewing) return;
        if (!window.confirm(`Trả tủ ${viewing.code} cho "${viewing.customerName || 'người đang dùng'}"? Tủ sẽ chuyển về trạng thái trống.`)) return;
        const json = await runRequest(`/api/v2/lockers/${viewing.id}/release`, { method: 'POST' });
        if (json) {
            showBanner(json.message || 'Đã trả tủ');
            setViewing(null);
            fetchLockers();
        }
    };

    const handleCompleteMaintenance = async () => {
        if (!viewingMaintenance) return;
        if (!window.confirm(`Hoàn tất bảo trì cho tủ ${viewingMaintenance.code}? Tủ sẽ quay về trạng thái trước khi bảo trì (đang sử dụng / trống).`)) return;
        const json = await runRequest(`/api/v2/lockers/${viewingMaintenance.id}/complete-maintenance`, { method: 'POST' });
        if (json) {
            showBanner(json.message || 'Đã hoàn tất bảo trì');
            setViewingMaintenance(null);
            fetchLockers();
        }
    };

    const handleDeleteRow = async (row: LockerRow) => {
        if (window.confirm(`Xóa dãy tủ "${row.name}" (${row.lockers.length} tủ)?`)) {
            const json = await runRequest(`/api/v2/lockers/row/${encodeURIComponent(row.prefix)}`, { method: 'DELETE' });
            if (json) {
                showBanner(json.message || 'Đã xóa dãy tủ');
                fetchLockers();
            }
        }
    };

    const filteredRows = rows
        .map(row => ({
            ...row,
            lockers: row.lockers.filter(l =>
                (!searchTerm.trim() || l.code.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                    (l.customerName && l.customerName.toLowerCase().includes(searchTerm.trim().toLowerCase()))) &&
                (zoneFilter === 'ALL' || row.zone === zoneFilter)
            ),
        }))
        .filter(row => row.lockers.length > 0 || !searchTerm.trim());

    const statCards = [
        { label: 'Tổng số tủ', value: stats.total, icon: Boxes, cls: 'bg-slate-50 text-slate-600' },
        { label: 'Đang trống', value: stats.available, icon: Unlock, cls: 'bg-emerald-50 text-emerald-600' },
        { label: 'Đang sử dụng', value: stats.occupied, icon: Lock, cls: 'bg-indigo-50 text-indigo-600' },
        { label: 'Bảo trì', value: stats.maintenance, icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600' },
        { label: 'Tỉ lệ sử dụng', value: `${usageRate}%`, icon: Gauge, cls: 'bg-violet-50 text-violet-600', progress: usageRate },
    ];

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý tủ đồ</h1>
                        <p className="text-slate-500 text-sm mt-1">Sơ đồ dãy tủ và trạng thái gán tủ thời gian thực</p>
                    </div>
                    <button
                        onClick={() => setShowAddRow(true)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm inline-flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-4 h-4" /> Thêm dãy tủ
                    </button>
                </div>

                {banner && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <Info className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">{banner}</span>
                    </div>
                )}
                {currentClubName && user?.isAdmin === true && (
                    <div className="flex items-center gap-2.5 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-indigo-200" />
                        <span className="text-sm font-bold">
                            Đang quản lý tủ đồ của phòng tập: {currentClubName}
                        </span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {/* Thống kê nhanh */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {statCards.map(card => (
                        <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.cls}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold">{card.label}</p>
                                    <p className="text-xl font-black text-slate-900">{card.value}</p>
                                </div>
                            </div>
                            {'progress' in card && (
                                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${card.progress}%` }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Thanh tìm kiếm & lọc khu vực */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm số tủ hoặc tên khách..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto flex-wrap">
                        {(['ALL', 'NAM', 'NU', 'VIP'] as const).map((zone) => (
                            <button
                                key={zone}
                                onClick={() => setZoneFilter(zone)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${zoneFilter === zone
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {zone === 'ALL' ? 'Tất cả' : ZONE_META[zone].label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sơ đồ các dãy tủ */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin inline" /> <span className="ml-2">Đang tải tủ đồ...</span>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                        <Info className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="mt-3 font-bold text-slate-600">Chưa có dãy tủ nào</p>
                        <p className="text-sm text-slate-400 mt-1">Bấm "Thêm dãy tủ" để tạo dãy tủ đầu tiên</p>
                    </div>
                ) : (
                    filteredRows.map(row => {
                        const occupied = row.lockers.filter(l => l.status === 'OCCUPIED').length;
                        const zone = ZONE_META[row.zone];
                        return (
                            <div key={row.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Rows3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold text-slate-900 text-lg">Dãy {row.name}</h2>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${zone.badge}`}>{zone.label}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">Mã "{row.prefix}" · {row.lockers.length} tủ · {occupied} đang dùng</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAddLockerPrefix(row.prefix)}
                                            className="px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 inline-flex items-center gap-1.5"
                                        >
                                            <PlusCircle className="w-4 h-4" /> Thêm tủ
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRow(row)}
                                            className="px-3.5 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 inline-flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-4 h-4" /> Xóa dãy
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {row.lockers.map(locker => {
                                        const meta = STATUS_META[locker.status];
                                        return (
                                            <button
                                                key={locker.id}
                                                onClick={() => {
                                                    if (locker.status === 'OCCUPIED') setViewing(locker);
                                                    else if (locker.status === 'MAINTENANCE') setViewingMaintenance(locker);
                                                    else setEditing(locker);
                                                }}
                                                className={`p-4 rounded-2xl border transition-all text-left group ${meta.card}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-black text-sm">{locker.code}</span>
                                                    <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                                                        {locker.status === 'AVAILABLE' && <Unlock className={`w-4 h-4 ${meta.iconCls}`} />}
                                                        {locker.status === 'OCCUPIED' && <Lock className={`w-4 h-4 ${meta.iconCls}`} />}
                                                        {locker.status === 'MAINTENANCE' && <AlertTriangle className={`w-4 h-4 ${meta.iconCls}`} />}
                                                    </span>
                                                </div>
                                                <div className="mt-3 pt-2 border-t border-current/10">
                                                    <p className="text-[10px] font-bold uppercase opacity-60">{meta.label}</p>
                                                    {locker.status === 'OCCUPIED' ? (
                                                        <>
                                                            <p className="text-xs font-semibold truncate mt-0.5">{locker.customerName || 'Đang sử dụng'}</p>
                                                            <p className="text-[10px] font-semibold opacity-70 mt-0.5 inline-flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {formatDuration(locker.assignedAt)}
                                                            </p>
                                                        </>
                                                    ) : locker.status === 'AVAILABLE' ? (
                                                        <p className="text-xs font-semibold truncate mt-0.5">Sẵn sàng</p>
                                                    ) : (
                                                        <p className="text-xs font-semibold truncate mt-0.5">{locker.maintenanceType || 'Hỏng / sửa chữa'}</p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Chú thích trạng thái */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center gap-x-5 gap-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Chú thích:</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><Unlock className="w-3.5 h-3.5 text-emerald-500" /> Trống</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><Lock className="w-3.5 h-3.5 text-indigo-500" /> Đang sử dụng</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Bảo trì</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 ml-auto">Bấm vào tủ trống để gán khách · tủ đang dùng để trả tủ · tủ bảo trì để xem báo cáo</span>
                </div>
            </div>

            {showAddRow && (
                <AddRowModal existingCodes={existingCodes} onClose={() => setShowAddRow(false)} onAdd={handleAddRow} />
            )}
            {addLockerPrefix && (
                <AddLockerModal rows={rows} defaultPrefix={addLockerPrefix} existingCodes={existingCodes} onClose={() => setAddLockerPrefix(null)} onAdd={handleAddLockers} />
            )}
            {editing && (
                <EditLockerModal
                    locker={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleSaveLocker}
                    onDelete={handleDeleteLocker}
                />
            )}
            {viewing && (
                <LockerDetailModal
                    locker={viewing}
                    onClose={() => setViewing(null)}
                    onRelease={handleReleaseLocker}
                    onEdit={() => { setEditing(viewing); setViewing(null); }}
                />
            )}
            {viewingMaintenance && (
                <MaintenanceDetailModal
                    locker={viewingMaintenance}
                    onClose={() => setViewingMaintenance(null)}
                    onComplete={handleCompleteMaintenance}
                />
            )}
        </AdminLayout>
    );
}
