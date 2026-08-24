import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import {
    Check,
    X,
    Camera,
    Calendar,
    UserCheck,
    Lock,
    Unlock,
    AlertTriangle,
    Loader2,
    KeyRound,
    ScanFace,
    ExternalLink,
    Trash2
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders, useAuth } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

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
        bell(880, 0);
        bell(659.25, 0.28);
        setTimeout(() => ctx.close(), 2200);
    } catch { }
};

const speak = (text: string) => {
    playChime();
    const backendUrl = getApiUrl() || 'http://localhost:5000';
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
        try {
            if (!text) return;
            const audio = new Audio(`${backendUrl}/api/tts?text=${encodeURIComponent(text)}`);
            audio.onerror = () => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(text);
                    u.lang = 'vi-VN';
                    window.speechSynthesis.speak(u);
                }
            };
            audio.play().catch(() => { });
        } catch { }
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
    const [loading, setLoading] = useState<boolean>(false);
    const [currentClubName, setCurrentClubName] = useState<string>('');
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const [history, setHistory] = useState<CheckInRecord[]>([]);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [staffResult, setStaffResult] = useState<PendingStaffResult | null>(null);

    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
    const [faceStatusText, setFaceStatusText] = useState<string>('Đang khởi tạo AI nhận diện...');
    const webcamRef = useRef<Webcam>(null);
    const faceDetectingRef = useRef<boolean>(false);

    const [scannedCustomer, setScannedCustomer] = useState<ScannedCustomer | null>(null);

    const [lockerModal, setLockerModal] = useState(false);
    const [wantLocker, setWantLocker] = useState<boolean | null>(null);
    const [lockers, setLockers] = useState<LockerApiItem[]>([]);
    const [lockerLoading, setLockerLoading] = useState(false);
    const [lockerError, setLockerError] = useState('');
    const [lockerFilter, setLockerFilter] = useState('ALL');
    const [submittingLocker, setSubmittingLocker] = useState(false);
    const [assignedLockerName, setAssignedLockerName] = useState('');
    const [pendingStaff, setPendingStaff] = useState<PendingStaffResult | null>(null);

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

    const backendUrl = getApiUrl() || 'http://localhost:5000';

    // Lắng nghe dữ liệu điểm danh từ Cửa Sổ Pop-up độc lập
    useEffect(() => {
        const channel = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
        channel.onmessage = (event) => {
            if (event.data?.type === 'CHECKIN_EVENT') {
                loadTodayHistory();
            }

            if (event.data?.type === 'FACE_CHECKIN_TRIGGER') {
                const { status, customer, totalMinutes } = event.data.payload;
                const verifiedCode = customer.id || 'HV';
                const verifiedName = customer.fullName || 'Hội viên';
                const packages = customer.packages || [];

                if (status === 'checked-out') {
                    releaseMemberLockers(verifiedName);
                    loadTodayHistory();

                    setSuccessAnimation({
                        active: true,
                        memberCode: verifiedCode,
                        name: verifiedName,
                        phone: customer.phone || 'Chưa cập nhật',
                        packages,
                        isCheckout: true,
                        totalMinutes
                    });
                    setTimeout(() => setSuccessAnimation(null), 3000);
                } else {
                    const matchedInfo: ScannedCustomer = {
                        memberCode: verifiedCode,
                        fullName: verifiedName,
                        phone: customer.phone || 'Chưa cập nhật',
                        packages,
                        token: 'FACE_ID_AUTH'
                    };

                    setScannedCustomer(matchedInfo);
                    lastScannedRef.current = { memberCode: verifiedCode, fullName: verifiedName };

                    setAssignedLockerName('');
                    setLockers([]);
                    openLockerModal();
                }
            }
        };
        return () => channel.close();
    }, [selectedClub]);

    const openPopupFaceScanner = () => {
        const width = 900;
        const height = 650;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            '/admin/attendance/face-popup',
            'FaceIDScannerWindow',
            `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no,resizable=yes`
        );
    };

    const initFaceApiAndDescriptors = async () => {
        try {
            setFaceStatusText('Đang tải Model AI...');
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setIsModelLoaded(true);
            setFaceStatusText('Đang đồng bộ dữ liệu khuôn mặt...');

            const res = await axios.get(`${backendUrl}/api/checkin/face/descriptors`, {
                headers: getAuthHeaders() as any
            });

            if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const labeled = res.data.data.map((c: any) => {
                    return new faceapi.LabeledFaceDescriptors(
                        c._id,
                        [new Float32Array(c.faceDescriptor)]
                    );
                });
                setFaceMatcher(new faceapi.FaceMatcher(labeled, 0.62));
                setFaceStatusText(`Sẵn sàng quét · Đã nạp ${labeled.length} hội viên`);
            } else {
                setFaceMatcher(null);
                setFaceStatusText('Chưa có hội viên nào đăng ký FaceID');
            }
        } catch (err: any) {
            console.error("Face API Load Error:", err);
            setFaceStatusText('Lỗi kết nối bộ nhận diện khuôn mặt');
        }
    };

    useEffect(() => {
        initFaceApiAndDescriptors();
    }, [selectedClub]);

    useEffect(() => {
        if (!isCameraActive || !isModelLoaded) return;

        const interval = setInterval(async () => {
            if (
                faceDetectingRef.current ||
                loading ||
                lockerModal ||
                successAnimation?.active ||
                !webcamRef.current ||
                !webcamRef.current.video ||
                webcamRef.current.video.readyState !== 4
            ) {
                return;
            }

            try {
                faceDetectingRef.current = true;
                const video = webcamRef.current.video;
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    if (!faceMatcher) {
                        setFaceStatusText('Phát hiện khuôn mặt (Chưa có dữ liệu FaceID mẫu)');
                        return;
                    }
                    const match = faceMatcher.findBestMatch(detection.descriptor);
                    if (match.label !== 'unknown') {
                        setFaceStatusText('Khớp khuôn mặt! Đang xử lý điểm danh...');
                        await handleFaceCheckIn(match.label);
                    } else {
                        setFaceStatusText('Khuôn mặt chưa được đăng ký trong hệ thống');
                    }
                } else {
                    setFaceStatusText('Vui lòng nhìn thẳng vào khung camera');
                }
            } catch (e) {
            } finally {
                faceDetectingRef.current = false;
            }
        }, 600);

        return () => clearInterval(interval);
    }, [isCameraActive, isModelLoaded, faceMatcher, loading, lockerModal, successAnimation]);

    const handleFaceCheckIn = async (customerId: string) => {
        if (loading) return;
        setLoading(true);
        setScanResult(null);

        try {
            const response = await axios.post(`${backendUrl}/api/checkin/face/verify`, {
                customerId
            }, { headers: getAuthHeaders() });

            const customerData = response.data.customer;
            const verifiedCode = customerData.id || 'HV';
            const verifiedName = customerData.fullName || 'Hội viên';
            const packages = customerData.packages || [];

            if (response.data?.status === 'checked-out') {
                releaseMemberLockers(verifiedName);
                speak(`Kính chào ${verifiedName} ra về`);

                setHistory(prev => [{
                    id: Math.random().toString(),
                    memberCode: verifiedCode,
                    customerName: verifiedName,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message: `${verifiedName} check-out FaceID thành công`
                }, ...prev.slice(0, 6)]);

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
            } else {
                const matchedInfo: ScannedCustomer = {
                    memberCode: verifiedCode,
                    fullName: verifiedName,
                    phone: customerData.phone || 'Chưa cập nhật',
                    packages,
                    token: 'FACE_ID_AUTH'
                };

                setScannedCustomer(matchedInfo);
                lastScannedRef.current = { memberCode: verifiedCode, fullName: verifiedName };
                speak(`Xin mời ${verifiedName} vào tập`);

                setAssignedLockerName('');
                setLockers([]);
                openLockerModal();
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Điểm danh FaceID thất bại';
            setScanResult({ success: false, message: msg });
        } finally {
            setLoading(false);
        }
    };

    const startScanner = () => {
        if (successAnimation?.active) return;
        setIsCameraActive(true);
        setScanResult(null);
        setScannedCustomer(null);
        initFaceApiAndDescriptors();
    };

    const stopScanner = () => {
        setIsCameraActive(false);
    };

    const loadLockers = async () => {
        setLockerLoading(true);
        setLockerError('');
        try {
            const res = await fetch(`${backendUrl}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
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
        const res = await fetch(`${backendUrl}/api/v2/lockers/${lockerId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders() as HeadersInit,
            body: JSON.stringify({ personType, name, phone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không gán được tủ');
        return data.locker as LockerApiItem | undefined;
    };

    const releaseMemberLockers = async (name: string) => {
        try {
            const res = await fetch(`${backendUrl}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
            const data = await res.json();
            const mine = (data.data || []).filter((l: LockerApiItem) =>
                l.assignedType === 'MEMBER' && l.assignedName === name
            );
            await Promise.all(mine.map((l: LockerApiItem) =>
                fetch(`${backendUrl}/api/v2/lockers/${l._id}/release`, {
                    method: 'POST',
                    headers: getAuthHeaders() as HeadersInit
                })
            ));
        } catch (e) { }
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

            const successMsg = 'Check-in thành công!';
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
            }, ...prev.slice(0, 6)]);

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

    const clearTemporaryList = () => {
        setHistory([]);
    };

    const clubLockers = selectedClub && selectedClub !== 'all'
        ? lockers.filter(l => String(l.locationId) === String(selectedClub))
        : lockers;
    const lockerPrefixes = Array.from(new Set(clubLockers.map(l => l.prefix)));
    const filteredLockers = clubLockers.filter(l =>
        (lockerFilter === 'ALL' || l.prefix === lockerFilter) &&
        (l.status === 'AVAILABLE' || l.status === 'MAINTENANCE')
    );

    const loadTodayHistory = async () => {
        setHistory([]);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const items: CheckInRecord[] = [];
        const isClubMatch = (locId: any) =>
            !selectedClub || selectedClub === 'all' || String(locId) === String(selectedClub);

        try {
            const res = await axios.get(`${backendUrl}/api/checkin/history?limit=15`, {
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

                const isCheckedOut = Boolean(item.checkOutTime);
                items.push({
                    id: item._id || Math.random().toString(),
                    memberCode: code,
                    customerName: name,
                    time: isCheckedOut && item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : t.toLocaleTimeString('vi-VN'),
                    status: 'success',
                    message: isCheckedOut ? `${name} check-out FaceID thành công` : `${name} (${code}) check-in thành công`
                });
            });
        } catch (e) { }

        try {
            const staffRes = await axios.get(`${backendUrl}/api/staff-attendance/today`, {
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
        } catch (e) { }

        items.sort((a, b) => b.time.localeCompare(a.time));
        // Giới hạn hiển thị 7 lượt gần nhất trên giao diện
        setHistory(items.slice(0, 7));
    };

    useEffect(() => {
        loadTodayHistory();
    }, [selectedClub]);

    useEffect(() => {
        const locId = selectedClub && selectedClub !== 'all' ? selectedClub : (user?.locationId || null);
        if (!locId) {
            setCurrentClubName('');
            return;
        }
        axios.get(`${backendUrl}/api/locations`)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const loc = list.find((l: any) => String(l._id) === String(locId));
                if (loc) setCurrentClubName(loc.title || loc.address || '');
            })
            .catch(() => { });
    }, [selectedClub, user?.locationId]);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900 py-4 px-2 bg-slate-50">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2.5">
                            <ScanFace className="w-8 h-8 text-indigo-600" />
                            Hệ Thống Điểm Danh FaceID
                        </h1>
                        <p className="text-sm text-slate-600 font-medium">Tự động nhận diện khuôn mặt hội viên và check-in vào phòng tập</p>
                    </div>

                    {/* Nút mở Cửa sổ Quét Độc Lập */}
                    <button
                        onClick={openPopupFaceScanner}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all w-fit"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Mở Cửa Sổ Camera Độc Lập</span>
                    </button>
                </div>

                {currentClubName && user?.isAdmin === true && (
                    <div className="flex items-center gap-2.5 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-indigo-200" />
                        <span className="text-sm font-bold">
                            Máy quét đang hoạt động tại: {currentClubName}
                        </span>
                    </div>
                )}

                {scanResult && !scanResult.success && (
                    <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-900 text-sm font-bold animate-pulse shadow-sm flex items-center gap-2">
                        <X className="w-5 h-5 text-red-600 shrink-0" />
                        <span>{scanResult.message}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                    {/* Khung Camera FaceID trực tiếp trên trang chính */}
                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[550px] shadow-sm relative">
                        {!isCameraActive ? (
                            <div className="text-center space-y-5 w-full max-w-sm">
                                <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-sm text-indigo-600">
                                    <ScanFace className="w-10 h-10" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xl font-bold text-slate-950">
                                        Máy quét FaceID đang tắt
                                    </p>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Bật camera để nhận diện hội viên trực tiếp hoặc bấm nút "Mở Cửa Sổ Camera Độc Lập" ở trên.
                                    </p>
                                </div>
                                <button
                                    onClick={startScanner}
                                    disabled={loading || !!successAnimation}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl text-xs shadow-md transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-4 h-4" /> Bật camera FaceID trực tiếp
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[440px] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md relative flex items-center justify-center">
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    className="w-full h-full object-cover"
                                    screenshotFormat="image/jpeg"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-64 h-64 border-2 border-dashed border-emerald-400 rounded-full animate-pulse flex items-center justify-center">
                                        <div className="w-56 h-56 border border-emerald-400/30 rounded-full" />
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs text-center font-medium border border-slate-700">
                                    {faceStatusText}
                                </div>

                                <button
                                    onClick={stopScanner}
                                    className="absolute bottom-6 right-6 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg z-10 hover:bg-red-700 transition"
                                >
                                    Tắt camera
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bảng Lịch Sử Check-in Hôm Nay */}
                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[550px] w-full">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider">Lịch sử vừa quét</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    {history.length} lượt gần nhất
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button
                                        onClick={clearTemporaryList}
                                        className="text-[11px] font-semibold text-slate-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                                        title="Xóa danh sách tạm trên màn hình"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Xóa lịch sử</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 max-h-[480px] w-full">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-28 italic space-y-2">
                                    <span>Chưa có lượt quét mới nào.</span>
                                    <span className="text-[11px] text-slate-300">Danh sách sẽ tự động xuất hiện khi có người quét FaceID</span>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm w-full hover:bg-slate-50 transition">
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                <span>{item.customerName}</span>
                                                {item.memberCode === 'NV' ? (
                                                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-black">NV</span>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-black">
                                                        Mã: {item.memberCode.slice(-6)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[11px] font-semibold leading-relaxed ${item.message.includes('check-out') ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                {item.message}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1 shrink-0 ml-4">
                                            <div className="text-[11px] text-slate-700 font-mono font-bold">{item.time}</div>
                                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.message.includes('check-out') ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Chọn Tủ Đồ */}
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

            {/* Modal Thông Báo Check-in Nhân Viên */}
            {staffResult?.active && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`bg-white border max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 ${staffResult.status === 'checked-out' ? 'border-t-blue-500' : 'border-t-emerald-500'}`}>
                        <div className={`w-14 h-14 border-4 rounded-full flex items-center justify-center mb-4 ${staffResult.status === 'checked-out' ? 'bg-blue-50 border-blue-500' : 'bg-emerald-50 border-emerald-500'}`}>
                            <UserCheck className={`w-6 h-6 stroke-[3] ${staffResult.status === 'checked-out' ? 'text-blue-500' : 'text-emerald-500'}`} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {staffResult.status === 'checked-out' ? 'Check-out' : 'Check-in'}
                        </h2>
                        <p className="text-lg font-extrabold text-slate-900 mt-1">{staffResult.name}</p>
                        {staffResult.job && <p className="text-sm text-slate-500">{staffResult.job}</p>}
                        {staffResult.phone && <p className="text-xs text-slate-400 mt-0.5">{staffResult.phone}</p>}
                    </div>
                </div>
            )}

            {/* Modal Thông Báo Check-in Thành Công Hội Viên */}
            {successAnimation?.active && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 border-t-emerald-500">
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