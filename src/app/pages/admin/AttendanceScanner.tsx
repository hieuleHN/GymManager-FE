import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import {
    Check,
    X,
    Camera,
    RefreshCw,
    Calendar,
    UserCheck,
    Lock,
    Unlock,
    AlertTriangle,
    Loader2,
    KeyRound
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders, useAuth } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

// Giọng đọc thông báo khi điểm danh (Web Speech API) — có tiếng chuông "tinh tinh" trước
let announceTimer: ReturnType<typeof setTimeout> | null = null;

const playChime = () => {
    try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        if (ctx.state === 'suspended') ctx.resume();
        const bell = (freq: number, delay: number) => {
            const t0 = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t0);
            gain.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + 1);
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2;
            gain2.gain.setValueAtTime(0, t0);
            gain2.gain.linearRampToValueAtTime(0.06, t0 + 0.015);
            gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(t0);
            osc2.stop(t0 + 0.4);
        };
        bell(880, 0);      // "tinh"
        bell(659.25, 0.28); // "tinh" (nốt thấp hơn như tiếng chuông báo)
        setTimeout(() => ctx.close(), 2200);
    } catch { /* bỏ qua nếu trình duyệt không hỗ trợ */ }
};

const speak = (text: string) => {
    playChime();
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
        try {
            if (!text) return;
            const audio = new Audio(`${getApiUrl()}/api/tts?text=${encodeURIComponent(text)}`);
            audio.onerror = () => {
                // Fallback: nếu Google TTS không gọi được thì dùng giọng trình duyệt (nếu có)
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(text);
                    u.lang = 'vi-VN';
                    window.speechSynthesis.speak(u);
                }
            };
            audio.play().catch(() => {});
        } catch { /* bỏ qua nếu trình duyệt không hỗ trợ */ }
    }, 1000);
};

interface CheckInRecord {
    id: string;
    memberCode: string;
    customerName: string;
    time: string;
    status: 'success' | 'failed';
    message: string;
}

interface PackageInfo {
    packageName: string;
    endDate: string;
    remainingDays?: number;
}

interface ScannedCustomer {
    memberCode: string;
    fullName: string;
    phone: string;
    packages: PackageInfo[];
    token: string;
}

interface LockerApiItem {
    _id: string;
    lockerNumber: string;
    prefix: string;
    locationId?: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    assignedType?: 'MEMBER' | 'STAFF' | null;
    assignedName?: string;
    assignedPhone?: string;
}

type PendingStaffResult = {
    active: boolean; name: string; job?: string; phone?: string;
    shift?: { type: string; start: string; end: string } | null;
    status: string; checkInTime?: string; checkOutTime?: string;
    minutesLate?: number; minutesEarly?: number; overtime?: number; totalMinutes?: number;
    todayBonus?: number; todayPenalty?: number;
    message: string;
};

export function AttendanceScanner() {
    const { user } = useAuth();
    const { selectedClub } = useClub();
    const [manualToken, setManualToken] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [currentClubName, setCurrentClubName] = useState<string>('');
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const [history, setHistory] = useState<CheckInRecord[]>([]);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [staffResult, setStaffResult] = useState<{
        active: boolean; name: string; job?: string; phone?: string;
        shift?: { type: string; start: string; end: string } | null;
        status: string; checkInTime?: string; checkOutTime?: string;
        minutesLate?: number; minutesEarly?: number; overtime?: number; totalMinutes?: number;
        todayBonus?: number; todayPenalty?: number;
        message: string;
    } | null>(null);

    // Khối lưu trữ thông tin hội viên hiện tại đang chờ xác nhận
    const [scannedCustomer, setScannedCustomer] = useState<ScannedCustomer | null>(null);

    // Trạng thái chọn tủ đồ (tích hợp V1)
    const [lockerModal, setLockerModal] = useState(false);
    const [wantLocker, setWantLocker] = useState<boolean | null>(null);
    const [lockers, setLockers] = useState<LockerApiItem[]>([]);
    const [lockerLoading, setLockerLoading] = useState(false);
    const [lockerError, setLockerError] = useState('');
    const [lockerFilter, setLockerFilter] = useState('ALL');
    const [submittingLocker, setSubmittingLocker] = useState(false);
    const [assignedLockerName, setAssignedLockerName] = useState('');
    const [pendingStaff, setPendingStaff] = useState<PendingStaffResult | null>(null);

    // BỘ NHỚ ĐỆM NGHIÊM TÚC: Lưu lại vết của hội viên được quét hợp lệ gần nhất 
    // để cứu dữ liệu khi kịch bản quét lặp/quét trùng xảy ra và Backend chặn đứng trả lỗi trống.
    const lastScannedRef = useRef<{ memberCode: string; fullName: string } | null>(null);

    const [successAnimation, setSuccessAnimation] = useState<{
        active: boolean;
        memberCode: string;
        name: string;
        phone: string;
        packages?: PackageInfo[];
        lockerName?: string;
        isCheckout?: boolean;
        totalMinutes?: number;
    } | null>(null);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const startScanner = () => {
        if (successAnimation?.active) return;
        setIsCameraActive(true);
        setScanResult(null);
        setScannedCustomer(null);
        setTimeout(() => {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 280, height: 280 }, rememberLastUsedCamera: true },
                false
            );
            scannerRef.current.render((text) => handleCheckToken(text), (err) => { });
        }, 100);
    };

    // BƯỚC 1: Kiểm tra thông tin mã QR (Khi đưa camera quét hoặc bấm nút kiểm tra thủ công)
    const handleCheckToken = async (tokenString: string) => {
        if (!tokenString.trim() || loading) return;
        setLoading(true);
        setScanResult(null);
        let memberErrorMsg = '';

        // Thử check-in hội viên trước
        let memberSuccess = false;
        try {
            const response = await axios.post(`${getApiUrl()}/api/checkin/verify`, {
                token: tokenString
            }, { headers: getAuthHeaders() });

            const customerData = response.data.customer || response.data.member || response.data.data || response.data;
            const verifiedCode = customerData.memberCode || customerData.code || customerData.id || 'HV-' + Math.floor(1000 + Math.random() * 9000);
            const verifiedName = customerData.fullName || customerData.customerName || customerData.name || 'Hội viên';

            const parsePackages = (data: any): PackageInfo[] => {
                let pkgs: PackageInfo[] = [];
                if (Array.isArray(data.packages) && data.packages.length > 0) {
                    pkgs = data.packages;
                } else {
                    pkgs = [{
                        packageName: data.packageName || 'Gói tập',
                        endDate: data.endDate || 'Chưa rõ'
                    }];
                }
                // Chỉ hiển thị các gói đang sử dụng, loại bỏ trùng lặp theo tên gói (giữ gói còn nhiều ngày nhất)
                const byName = new Map<string, PackageInfo>();
                pkgs.forEach((p) => {
                    const key = (p.packageName || '').trim();
                    if (!key) return;
                    const existing = byName.get(key);
                    const curDays = typeof p.remainingDays === 'number' ? p.remainingDays : -1;
                    const exDays = existing && typeof existing.remainingDays === 'number' ? existing.remainingDays : -1;
                    if (!existing || curDays >= exDays) byName.set(key, p);
                });
                return Array.from(byName.values());
            };
            const packages = parsePackages(customerData);

            // Lần quét thứ hai trong ngày = CHECK-OUT hội viên
            if (response.data?.status === 'checked-out') {
                releaseMemberLockers(verifiedName);
                speak(`Kính chào ${verifiedName} ra về`);

                setHistory(prev => [{
                    id: Math.random().toString(),
                    memberCode: verifiedCode,
                    customerName: verifiedName,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message: `${verifiedName} (${verifiedCode}) check-out thành công`
                }, ...prev]);

                setSuccessAnimation({
                    active: true,
                    memberCode: verifiedCode,
                    name: verifiedName,
                    phone: customerData.phone || 'Chưa cập nhật',
                    packages,
                    isCheckout: true,
                    totalMinutes: response.data.totalMinutes
                });
                setTimeout(() => setSuccessAnimation(null), 3000);

                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    setIsCameraActive(false);
                }
                memberSuccess = true;
            } else {
                const matchedInfo: ScannedCustomer = {
                    memberCode: verifiedCode,
                    fullName: verifiedName,
                    phone: customerData.phone || 'Chưa cập nhật',
                    packages,
                    token: tokenString
                };

                setScannedCustomer(matchedInfo);
                lastScannedRef.current = { memberCode: verifiedCode, fullName: verifiedName };
                speak(`Xin mời ${verifiedName} vào tập`);

                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    setIsCameraActive(false);
                }
                memberSuccess = true;

                // Hiển thị ngay cửa sổ thông tin chi tiết + chọn tủ (bỏ bước đối chiếu trung gian)
                setAssignedLockerName('');
                setLockers([]);
                openLockerModal();
            }
        } catch (err: any) {
            memberSuccess = false;
            // Lưu lỗi hội viên (vd "thuộc phòng tập X") để hiển thị nếu quét nhân viên cũng thất bại
            const resData = (err as any)?.response?.data;
            memberErrorMsg = resData?.error || resData?.message || '';
        }

        if (!memberSuccess) {
            // Thử check-in/out nhân viên
            try {
                const staffRes = await axios.post(`${getApiUrl()}/api/staff-attendance/verify`, {
                    token: tokenString
                }, { headers: getAuthHeaders() });

                const staffData = staffRes.data;
                const staffName = staffData.staff?.fullName || 'Nhân viên';
                const staffMsg = staffData.message || 'Thành công';
                const staffJob = staffData.staff?.job || '';
                const staffPhone = staffData.staff?.phone || '';

                let fullMsg = staffMsg;
                if (staffData.totalMinutes) fullMsg += ` - Tổng thời gian: ${Math.floor(staffData.totalMinutes / 60)}h${staffData.totalMinutes % 60}p`;

                setHistory(prev => [{
                    id: Math.random().toString(),
                    memberCode: 'NV',
                    customerName: `${staffName}${staffJob ? ` (${staffJob})` : ''}`,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message: fullMsg
                }, ...prev]);

                const resultObj: PendingStaffResult = {
                    active: true, name: staffName, job: staffJob, phone: staffPhone, shift: staffData.shift,
                    status: staffData.status, checkInTime: staffData.checkInTime, checkOutTime: staffData.checkOutTime,
                    minutesLate: staffData.minutesLate, minutesEarly: staffData.minutesEarly,
                    overtime: staffData.overtime, totalMinutes: staffData.totalMinutes,
                    todayBonus: staffData.todayBonus, todayPenalty: staffData.todayPenalty, message: fullMsg
                };

                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    setIsCameraActive(false);
                }

                // Check-out: mở khóa + trả tủ đang được nhân viên này sử dụng trước khi hiện popup
                if (staffData.status === 'checked-out') {
                    await releaseStaffLockers(staffName, staffPhone);
                    speak(`Kính chào ${staffName} ra về`);
                    setStaffResult(resultObj);
                    setTimeout(() => setStaffResult(null), 5000);
                } else {
                    // Check-in: hỏi có dùng tủ không trước, popup hiện sau khi chọn
                    setPendingStaff(resultObj);
                    speak(`Xin mời ${staffName} vào tập`);
                    openLockerModal();
                }
            } catch (staffErr: any) {
                const resData = (staffErr as any).response?.data;
                const staffErrMsg = memberErrorMsg || resData?.error || resData?.message || 'Mã QR không hợp lệ hoặc đã hết hạn';
                const staffErrName = resData?.staff?.fullName || (memberErrorMsg ? '' : 'Nhân viên');

                setScanResult({
                    success: false,
                    message: staffErrName ? `${staffErrName}: ${staffErrMsg}` : staffErrMsg
                });

                setHistory(prev => [{
                    id: Math.random().toString(),
                    memberCode: 'NV',
                    customerName: `${staffErrName}${resData?.staff?.job ? ` (${resData.staff.job})` : ''}`,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    status: 'failed',
                    message: staffErrName ? `${staffErrName}: ${staffErrMsg}` : staffErrMsg
                }, ...prev]);
            }
        } subSequence: {
            setLoading(false);
        }
    };

    // ---------- Luồng chọn tủ đồ (V1) ----------
    const loadLockers = async () => {
        setLockerLoading(true);
        setLockerError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải sơ đồ tủ');
            setLockers(data.data || []);
        } catch (err: any) {
            setLockerError(err.message || 'Không thể tải sơ đồ tủ');
        } finally {
            setLockerLoading(false);
        }
    };

    const openLockerModal = () => {
        setLockerModal(true);
        setWantLocker(null);
        setLockerError('');
    };

    const closeLockerModal = () => {
        setLockerModal(false);
        setWantLocker(null);
        setLockers([]);
        setLockerError('');
        setPendingStaff(null);
    };

    const assignLocker = async (lockerId: string, personType: 'MEMBER' | 'STAFF', name: string, phone: string) => {
        const res = await fetch(`${getApiUrl()}/api/v2/lockers/${lockerId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders() as HeadersInit,
            body: JSON.stringify({ personType, name, phone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không gán được tủ');
        return data.locker as LockerApiItem | undefined;
    };

    const releaseStaffLockers = async (name: string, phone: string) => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
            const data = await res.json();
            const mine = (data.data || []).filter((l: LockerApiItem) =>
                l.assignedType === 'STAFF' && l.assignedName === name
            );
            await Promise.all(mine.map((l: LockerApiItem) =>
                fetch(`${getApiUrl()}/api/v2/lockers/${l._id}/release`, {
                    method: 'POST',
                    headers: getAuthHeaders() as HeadersInit
                })
            ));
        } catch (e) {
            // không chặn luồng check-out nếu lỗi trả tủ
        }
    };

    const releaseMemberLockers = async (name: string) => {
        try {
            const res = await fetch(`${getApiUrl()}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
            const data = await res.json();
            const mine = (data.data || []).filter((l: LockerApiItem) =>
                l.assignedType === 'MEMBER' && l.assignedName === name
            );
            await Promise.all(mine.map((l: LockerApiItem) =>
                fetch(`${getApiUrl()}/api/v2/lockers/${l._id}/release`, {
                    method: 'POST',
                    headers: getAuthHeaders() as HeadersInit
                })
            ));
        } catch (e) {
            // không chặn luồng check-out nếu lỗi trả tủ
        }
    };

    const completeMemberCheckIn = async (lockerId: string) => {
        if (!scannedCustomer || submittingLocker) return;
        setSubmittingLocker(true);
        setLockerError('');
        try {
            let lockerAssigned = '';
            if (lockerId) {
                const assigned = await assignLocker(lockerId, 'MEMBER', scannedCustomer.fullName, scannedCustomer.phone);
                if (assigned) {
                    lockerAssigned = assigned.lockerNumber;
                    setAssignedLockerName(assigned.lockerNumber);
                }
            }

            let successMsg = 'Check-in thành công!';
            try {
                const response = await axios.post(`${getApiUrl()}/api/checkin/confirm`, {
                    token: scannedCustomer.token
                }, { headers: getAuthHeaders() });
                if (response.data?.message) successMsg = response.data.message;
            } catch (e) {
                console.log("Xử lý ngoại lệ confirm.");
            }

            lastScannedRef.current = {
                memberCode: scannedCustomer.memberCode,
                fullName: scannedCustomer.fullName
            };

            setHistory(prev => [{
                id: Math.random().toString(),
                memberCode: scannedCustomer.memberCode,
                customerName: scannedCustomer.fullName,
                time: new Date().toLocaleTimeString('vi-VN'),
                status: 'success',
                message: `${scannedCustomer.fullName} (${scannedCustomer.memberCode}) ${successMsg.toLowerCase()}${lockerAssigned ? ` · Tủ ${lockerAssigned}` : ''}`
            }, ...prev]);

            setManualToken('');

            setSuccessAnimation({
                active: true,
                memberCode: scannedCustomer.memberCode,
                name: scannedCustomer.fullName,
                phone: scannedCustomer.phone,
                packages: scannedCustomer.packages,
                lockerName: lockerAssigned || undefined
            });

            setScannedCustomer(null);
            closeLockerModal();
        } catch (err: any) {
            setLockerError(err.response?.data?.message || err.message || 'Gán tủ / xác nhận thất bại');
        } finally {
            setSubmittingLocker(false);
            setTimeout(() => {
                setSuccessAnimation(null);
            }, 3000);
        }
    };

    const showPendingStaff = (lockerName?: string) => {
        if (!pendingStaff) return;
        const result = lockerName
            ? { ...pendingStaff, message: `${pendingStaff.message} · Tủ ${lockerName}` }
            : pendingStaff;
        setStaffResult(result);
        setTimeout(() => setStaffResult(null), 5000);
        setPendingStaff(null);
        closeLockerModal();
    };

    const handleChooseNoLocker = () => {
        if (pendingStaff) {
            showPendingStaff();
        } else {
            completeMemberCheckIn('');
        }
    };

    const handleChooseYesLocker = () => {
        setWantLocker(true);
        loadLockers();
    };

    const handlePickLocker = async (lockerId: string) => {
        if (submittingLocker) return;
        setSubmittingLocker(true);
        setLockerError('');
        try {
            if (pendingStaff) {
                const assigned = await assignLocker(lockerId, 'STAFF', pendingStaff.name, pendingStaff.phone || '');
                showPendingStaff(assigned?.lockerNumber);
            } else if (scannedCustomer) {
                await completeMemberCheckIn(lockerId);
            }
        } catch (err: any) {
            setLockerError(err.response?.data?.message || err.message || 'Gán tủ thất bại');
        } finally {
            setSubmittingLocker(false);
        }
    };

    const clubLockers = selectedClub && selectedClub !== 'all'
        ? lockers.filter(l => String(l.locationId) === String(selectedClub))
        : lockers;
    const availableLockers = clubLockers.filter(l => l.status === 'AVAILABLE');
    const lockerPrefixes = Array.from(new Set(clubLockers.map(l => l.prefix)));
    const filteredLockers = clubLockers.filter(l =>
        (lockerFilter === 'ALL' || l.prefix === lockerFilter) &&
        (l.status === 'AVAILABLE' || l.status === 'MAINTENANCE')
    );

    // Tải lịch sử check-in hôm nay từ Backend để không bị mất khi reload trang
    const loadTodayHistory = async () => {
        setHistory([]);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const items: CheckInRecord[] = [];
        const isClubMatch = (locId: any) =>
            !selectedClub || selectedClub === 'all' || String(locId) === String(selectedClub);

        try {
            const res = await axios.get(`${getApiUrl()}/api/checkin/history?limit=100`, {
                headers: getAuthHeaders() as any
            });
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            list.forEach((item: any) => {
                if (!item?.checkInTime) return;
                if (!isClubMatch(item.locationId)) return;
                const t = new Date(item.checkInTime);
                if (t < startOfDay) return;
                const cust = item.customerId || {};
                const name = cust.fullName || 'Hội viên';
                const code = String(cust.memberCode || cust.code || cust._id || item.customerId?._id || item.customerId || 'HV');
                items.push({
                    id: item._id || Math.random().toString(),
                    memberCode: code,
                    customerName: name,
                    time: t.toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message: `${name} (${code}) check-in thành công`
                });
            });
        } catch (e) {
            // không chặn nếu lỗi tải lịch sử hội viên
        }

        try {
            const staffRes = await axios.get(`${getApiUrl()}/api/staff-attendance/today`, {
                headers: getAuthHeaders() as any
            });
            const staffList = Array.isArray(staffRes.data) ? staffRes.data : [];
            staffList.forEach((item: any) => {
                if (!isClubMatch(item.locationId)) return;
                const name = item.staffId?.fullName || 'Nhân viên';
                const checkedOut = item.status === 'checked-out';
                const t = checkedOut && item.checkOutTime ? new Date(item.checkOutTime) : new Date(item.checkInTime);
                let message = checkedOut ? 'Check-out thành công' : 'Check-in thành công';
                if (checkedOut && item.totalMinutes) message += ` - Tổng thời gian: ${Math.floor(item.totalMinutes / 60)}h${item.totalMinutes % 60}p`;
                items.push({
                    id: item._id || Math.random().toString(),
                    memberCode: 'NV',
                    customerName: name,
                    time: t.toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message
                });
            });
        } catch (e) {
            // không chặn nếu lỗi tải lịch sử nhân viên
        }

        items.sort((a, b) => b.time.localeCompare(a.time));
        setHistory(items);
    };

    useEffect(() => {
        loadTodayHistory();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error(err));
            }
        };
    }, [selectedClub]);

    // Lấy tên phòng tập hiện tại của nhân viên đang đăng nhập để hiển thị banner
    useEffect(() => {
        const locId = selectedClub && selectedClub !== 'all' ? selectedClub : (user?.locationId || null);
        if (!locId) {
            setCurrentClubName('');
            return;
        }
        axios.get(`${getApiUrl()}/api/locations`)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const loc = list.find((l: any) => String(l._id) === String(locId));
                if (loc) setCurrentClubName(loc.title || loc.address || '');
            })
            .catch(() => {});
    }, [selectedClub, user?.locationId]);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900 py-4 px-2 bg-slate-50">

                {/* Tiêu đề trang con */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2.5">
                        <UserCheck className="w-8 h-8 text-indigo-600" />
                        Điểm danh QR
                    </h1>
                    <p className="text-sm text-slate-600 font-medium">Quét QR hội viên (check-in) / QR nhân viên (chấm công)</p>
                </div>

                {/* Banner phòng tập hiện tại (chỉ hiển thị cho tài khoản admin) */}
                {currentClubName && user?.isAdmin === true && (
                    <div className="flex items-center gap-2.5 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-indigo-200" />
                        <span className="text-sm font-bold">
                            Máy quét đang hoạt động tại phòng tập: {currentClubName} — chỉ điểm danh được người thuộc phòng tập này
                        </span>
                    </div>
                )}

                {/* Khối thanh thông báo lỗi sắc nét đầu trang */}
                {scanResult && !scanResult.success && (
                    <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-900 text-sm font-bold animate-pulse shadow-sm flex items-center gap-2">
                        <X className="w-5 h-5 text-red-600 shrink-0" />
                        <span>{scanResult.message}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                    {/* CAMERA CONTAINER */}
                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center items-center min-h-[550px] shadow-sm relative">
                        {!isCameraActive ? (
                            <div className="text-center space-y-5 w-full max-w-sm">
                                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <Camera className="w-9 h-9 text-slate-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xl font-bold text-slate-950">Ống kính camera đang tắt</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">Vui lòng bấm nút kích hoạt phía dưới để quét mã vạch hội viên qua camera.</p>
                                </div>
                                <button
                                    onClick={startScanner}
                                    disabled={loading || !!successAnimation}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl text-xs shadow-md transition-all"
                                >
                                    Bật camera quét mã
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[440px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md relative flex items-center justify-center">
                                <div id="qr-reader" className="w-full border-none" />
                                <button
                                    onClick={() => { if (scannerRef.current) scannerRef.current.clear().then(() => setIsCameraActive(false)); }}
                                    className="absolute bottom-6 right-6 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg z-10"
                                >
                                    Tắt camera quét
                                </button>
                            </div>
                        )}
                    </div>

                    {/* KHỐI THAO TÁC NGHIỆP VỤ RIGHT PANEL */}
                    <div className="lg:col-span-6 flex flex-col gap-6 w-full">

                        {/* Nhập mã thủ công */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm w-full">
                            <h3 className="text-xs font-extrabold text-slate-950 mb-3.5 uppercase tracking-wider">Nhập mã QR thủ công</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    placeholder="Dán chuỗi token mã QR hội viên..."
                                    className="flex-1 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-950 placeholder-slate-400 font-medium"
                                />
                                <button
                                    onClick={() => handleCheckToken(manualToken)}
                                    disabled={loading || !manualToken.trim() || !!successAnimation}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-xs font-bold text-white rounded-xl px-6 transition-colors shadow-sm"
                                >
                                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Kiểm tra'}
                                </button>
                            </div>
                        </div>

                        {/* Khung đối chiếu thông tin khi quét được */}
                        {/* (đã bỏ bước này — quét là mở ngay cửa sổ chi tiết + chọn tủ) */}

                        {/* BẢNG LỊCH SỬ ĐIỂM DANH TRONG NGÀY (CẢ THÀNH CÔNG VÀ THẤT BẠI ĐỀU GIỮ TÊN THẬT + MÃ SỐ) */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col flex-1 min-h-[280px] w-full">
                            <h3 className="text-xs font-extrabold text-slate-950 mb-3.5 uppercase tracking-wider">Lịch sử check-in hôm nay</h3>
                            <div className="overflow-y-auto pr-1 space-y-2.5 max-h-[350px] flex-1 w-full">
                                {history.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-500 font-medium text-xs py-16 italic">Chưa ghi nhận lượt check-in nào trong hôm nay.</div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm w-full animate-[fadeIn_0.2s_ease-out]">
                                            <div className="space-y-1">
                                                {/* Tiêu đề dòng hiển thị Họ tên thật + Thẻ mã số đồng bộ */}
                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            <span>{item.customerName}</span>
                                            {item.memberCode === 'NV' ? (
                                                <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-black">NV</span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-black">
                                                    Mã: {item.memberCode}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-[11px] font-semibold leading-relaxed ${item.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {item.message}
                                        </div>
                                            </div>
                                            <div className="text-right space-y-1 shrink-0 ml-4">
                                                <div className="text-[11px] text-slate-700 font-mono font-bold">{item.time}</div>
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* OVERLAY POPUP CHỌN TỦ ĐỒ (HV + NV) */}
            {lockerModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={closeLockerModal} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Xác nhận check-in / chấm công</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {pendingStaff ? 'Chấm công nhân viên' : 'Điểm danh hội viên'}
                                </p>
                            </div>
                        </div>

                        {/* Thông tin người điểm danh */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                                        {pendingStaff ? 'NV' : 'HV'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">
                                            {pendingStaff ? pendingStaff.name : scannedCustomer?.fullName}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {pendingStaff ? (pendingStaff.phone || '') : (scannedCustomer?.phone || '')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pendingStaff
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                    {pendingStaff ? `Nhân viên${pendingStaff.job ? ` · ${pendingStaff.job}` : ''}` : 'Hội viên'}
                                </span>
                            </div>
                            {!pendingStaff && scannedCustomer && scannedCustomer.packages.map((p, idx) => (
                                <p key={idx} className="text-xs text-slate-500">
                                    Gói {scannedCustomer.packages.length > 1 ? `${idx + 1} · ` : ''}{p.packageName} · hạn {p.endDate}
                                    {typeof p.remainingDays === 'number' ? ` (còn ${p.remainingDays} ngày)` : ''}
                                </p>
                            ))}
                            {pendingStaff && pendingStaff.shift && (
                                <p className="text-xs text-slate-500">
                                    Ca: {pendingStaff.shift.type === 'morning-noon' ? 'Sáng-Trưa' : 'Chiều-Tối'}
                                    ({pendingStaff.shift.start}-{pendingStaff.shift.end})
                                </p>
                            )}
                        </div>

                        {!wantLocker && (
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-3">Người này có sử dụng tủ đồ không?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleChooseNoLocker}
                                        disabled={submittingLocker}
                                        className="flex flex-col items-center gap-2 px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all disabled:opacity-60"
                                    >
                                        <X className="w-6 h-6" />
                                        <span className="font-bold text-sm">Không dùng tủ</span>
                                        <span className="text-xs text-slate-400">Điểm danh bình thường</span>
                                    </button>
                                    <button
                                        onClick={handleChooseYesLocker}
                                        disabled={submittingLocker}
                                        className="flex flex-col items-center gap-2 px-6 py-5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 rounded-2xl transition-all disabled:opacity-60"
                                    >
                                        <Lock className="w-6 h-6" />
                                        <span className="font-bold text-sm">Có dùng tủ</span>
                                        <span className="text-xs text-indigo-400">Chọn tủ từ sơ đồ</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {wantLocker && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-700">Chọn tủ trống cho người này{currentClubName ? ` · ${currentClubName}` : ''}</p>
                                    <button
                                        onClick={() => setWantLocker(false)}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                                    >
                                        ← Quay lại
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setLockerFilter('ALL')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${lockerFilter === 'ALL'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    {lockerPrefixes.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setLockerFilter(p)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${lockerFilter === p
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            Dãy {p}
                                        </button>
                                    ))}
                                </div>

                                {lockerError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600" /> {lockerError}
                                    </div>
                                )}

                                {lockerLoading ? (
                                    <div className="p-10 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin inline" /> <span className="ml-2">Đang tải sơ đồ tủ...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
                                        {filteredLockers.length === 0 ? (
                                            <div className="col-span-full text-center text-slate-400 py-8 text-sm">Không có tủ trống trong dãy này</div>
                                        ) : filteredLockers.map(locker => (
                                            <button
                                                key={locker._id}
                                                disabled={submittingLocker || locker.status !== 'AVAILABLE'}
                                                onClick={() => handlePickLocker(locker._id)}
                                                className={`p-3 rounded-xl border text-left transition-all ${locker.status === 'AVAILABLE'
                                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-400 hover:shadow-md'
                                                    : 'bg-amber-50/70 border-amber-200 text-amber-900 opacity-60'
                                                    } disabled:cursor-not-allowed`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-black text-xs">{locker.lockerNumber}</span>
                                                    {locker.status === 'AVAILABLE'
                                                        ? <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                                                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                                </div>
                                                <p className="text-[10px] font-bold mt-1.5">
                                                    {locker.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {availableLockers.length === 0 && !lockerLoading && (
                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                        Hiện không còn tủ trống. Bạn vẫn có thể điểm danh không dùng tủ.
                                    </p>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleChooseNoLocker}
                                        disabled={submittingLocker}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
                                    >
                                        Điểm danh không dùng tủ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OVERLAY POPUP THÔNG BÁO STAFF CHECK-IN/OUT */}
            {staffResult?.active && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className={`bg-white border max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)] ${staffResult.status === 'checked-out' ? 'border-t-blue-500' : 'border-t-emerald-500'}`}>
                        <div className={`w-14 h-14 border-4 rounded-full flex items-center justify-center mb-4 ${staffResult.status === 'checked-out' ? 'bg-blue-50 border-blue-500' : 'bg-emerald-50 border-emerald-500'}`}>
                            <UserCheck className={`w-6 h-6 stroke-[3] ${staffResult.status === 'checked-out' ? 'text-blue-500' : 'text-emerald-500'}`} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {staffResult.status === 'checked-out' ? 'Check-out' : 'Check-in'}
                        </h2>
                        <p className="text-lg font-extrabold text-slate-900 mt-1">{staffResult.name}</p>
                        {staffResult.job && <p className="text-sm text-slate-500">{staffResult.job}</p>}
                        {staffResult.phone && <p className="text-xs text-slate-400 mt-0.5">{staffResult.phone}</p>}

                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-1.5 text-left text-xs">
                            {staffResult.shift && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Ca:</span>
                                    <span className="font-semibold text-slate-800">
                                        {staffResult.shift.type === 'morning-noon' ? 'Sáng-Trưa' : 'Chiều-Tối'}
                                        ({staffResult.shift.start}-{staffResult.shift.end})
                                    </span>
                                </div>
                            )}
                            {staffResult.checkInTime && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Giờ vào:</span>
                                    <span className="font-semibold text-slate-800">{new Date(staffResult.checkInTime).toLocaleTimeString('vi-VN')}</span>
                                </div>
                            )}
                            {staffResult.checkOutTime && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Giờ ra:</span>
                                    <span className="font-semibold text-slate-800">{new Date(staffResult.checkOutTime).toLocaleTimeString('vi-VN')}</span>
                                </div>
                            )}
                            {staffResult.totalMinutes ? (
                                <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5 font-bold text-slate-800">
                                    <span>Tổng thời gian ca làm việc:</span>
                                    <span>{Math.floor(staffResult.totalMinutes / 60)}h{staffResult.totalMinutes % 60}p</span>
                                </div>
                            ) : null}
                            {staffResult.status === 'checked-out' && (
                                <>
                                    {staffResult.todayBonus ? (
                                        <div className="flex justify-between text-emerald-600 font-semibold">
                                            <span>Thưởng hôm nay:</span>
                                            <span>+{staffResult.todayBonus.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                    ) : null}
                                    {staffResult.todayPenalty ? (
                                        <div className="flex justify-between text-red-600 font-semibold">
                                            <span>Phạt hôm nay:</span>
                                            <span>-{staffResult.todayPenalty.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY POPUP THÔNG BÁO THÀNH CÔNG RỚT TỪ TRÊN XUỐNG */}
            {successAnimation?.active && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 border-t-emerald-500 animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="w-14 h-14 bg-emerald-50 border-4 border-emerald-500 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-emerald-500 stroke-[3]" />
                        </div>

                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {successAnimation.isCheckout ? 'Check-out thành công!' : 'Check-in thành công!'}
                        </h2>
                        <p className="text-base font-extrabold text-purple-700 mt-1">{successAnimation.name}</p>
                        <p className="text-xs text-slate-950 font-mono font-bold">Mã số hội viên: {successAnimation.memberCode}</p>

                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-1 text-left text-xs text-slate-900 font-bold">
                            {successAnimation.isCheckout && typeof successAnimation.totalMinutes === 'number' && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-normal">Thời gian tại phòng gym:</span>
                                    <span className="text-indigo-600">
                                        {Math.floor(successAnimation.totalMinutes / 60)}h{successAnimation.totalMinutes % 60}p
                                    </span>
                                </div>
                            )}
                            {!successAnimation.isCheckout && (successAnimation.packages || []).map((p, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span className="text-slate-600 font-normal">
                                        {(successAnimation.packages || []).length > 1 ? `Gói ${idx + 1} · ` : ''}{p.packageName}:
                                    </span>
                                    <span className="text-amber-600 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {p.endDate}
                                        {typeof p.remainingDays === 'number' ? ` (còn ${p.remainingDays} ngày)` : ''}
                                    </span>
                                </div>
                            ))}
                            {successAnimation.lockerName && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-normal">Tủ đồ:</span>
                                    <span className="text-indigo-600 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> {successAnimation.lockerName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}