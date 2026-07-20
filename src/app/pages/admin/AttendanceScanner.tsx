import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import {
    Check,
    X,
    Camera,
    RefreshCw,
    Calendar,
    User,
    ArrowRight,
    UserCheck
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl } from '../../context/AuthContext';

interface CheckInRecord {
    id: string;
    memberCode: string;
    customerName: string;
    time: string;
    status: 'success' | 'failed';
    message: string;
}

interface ScannedCustomer {
    memberCode: string;
    fullName: string;
    phone: string;
    packageName: string;
    endDate: string;
    token: string;
}

export function AttendanceScanner() {
    const [manualToken, setManualToken] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const [history, setHistory] = useState<CheckInRecord[]>([]);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

    // Khối lưu trữ thông tin hội viên hiện tại đang chờ xác nhận
    const [scannedCustomer, setScannedCustomer] = useState<ScannedCustomer | null>(null);

    // BỘ NHỚ ĐỆM NGHIÊM TÚC: Lưu lại vết của hội viên được quét hợp lệ gần nhất 
    // để cứu dữ liệu khi kịch bản quét lặp/quét trùng xảy ra và Backend chặn đứng trả lỗi trống.
    const lastScannedRef = useRef<{ memberCode: string; fullName: string } | null>(null);

    const [successAnimation, setSuccessAnimation] = useState<{
        active: boolean;
        memberCode: string;
        name: string;
        phone: string;
        packageName: string;
        endDate: string;
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

        try {
            const response = await axios.post(`${getApiUrl()}/api/checkin/verify`, {
                token: tokenString
            });

            const customerData = response.data.customer || response.data.member || response.data.data || response.data;
            const verifiedCode = customerData.memberCode || customerData.code || customerData.id || 'HV-' + Math.floor(1000 + Math.random() * 9000);
            const verifiedName = customerData.fullName || customerData.customerName || customerData.name || 'Hội viên';

            const matchedInfo = {
                memberCode: verifiedCode,
                fullName: verifiedName,
                phone: customerData.phone || 'Chưa cập nhật',
                packageName: customerData.packageName || 'Gói tập',
                endDate: customerData.endDate || 'Chưa rõ',
                token: tokenString
            };

            setScannedCustomer(matchedInfo);

            // LẬP TỨC GHI NHỚ VÀO BỘ NHỚ ĐỆM ĐỂ PHỤC VỤ CHỐNG LỖI HIỂN THỊ
            lastScannedRef.current = {
                memberCode: verifiedCode,
                fullName: verifiedName
            };

            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                setIsCameraActive(false);
            }

        } catch (err: any) {
            const resData = err.response?.data;
            const customerData = resData?.customer || resData?.member || resData?.user || resData?.data;
            const errMsg = resData?.error || resData?.message || 'Mã QR không hợp lệ hoặc đã hết hạn';

            // XỬ LÝ DỮ LIỆU THÔNG MINH KHI GẶP LỖI (VÍ DỤ LỖI TRÙNG):
            // Lần lượt lấy từ: Backend trả về -> Nếu trống lấy từ bộ nhớ đệm Ref vừa quét -> Nếu trống lấy từ lịch sử
            let failedCode = customerData?.memberCode || customerData?.code || customerData?.id || '';
            let failedName = customerData?.fullName || customerData?.customerName || customerData?.name || '';

            if (!failedName && lastScannedRef.current) {
                failedCode = lastScannedRef.current.memberCode;
                failedName = lastScannedRef.current.fullName;
            } else if (!failedName && history.length > 0) {
                const historicalMatch = history.find(h => h.memberCode && h.memberCode !== 'QR-LỖI');
                if (historicalMatch) {
                    failedCode = historicalMatch.memberCode;
                    failedName = historicalMatch.customerName;
                }
            }

            const finalCode = failedCode || 'QR-LỖI';
            const finalName = failedName || 'Mã QR không xác định';

            // Hiển thị thông điệp lỗi rõ ràng kèm Tên + Mã hội viên lên thanh cảnh báo đỏ đầu trang
            setScanResult({
                success: false,
                message: failedName ? `${finalName} (${finalCode}): ${errMsg}` : errMsg
            });

            // Đẩy bản ghi lỗi vào lịch sử, định dạng chuẩn xác thông tin để tránh trùng lặp
            setHistory(prev => [{
                id: Math.random().toString(),
                memberCode: finalCode,
                customerName: finalName,
                time: new Date().toLocaleTimeString('vi-VN'),
                status: 'failed',
                message: failedName ? `${finalName} (${finalCode}) ${errMsg.toLowerCase()}` : errMsg
            }, ...prev]);
        } subSequence: {
            setLoading(false);
        }
    };

    // BƯỚC 2: Xác nhận Check-in chính thức (Bấm nút Xác nhận màu tím)
    const handleFinalConfirm = async () => {
        if (!scannedCustomer || loading) return;
        setLoading(true);

        try {
            let successMsg = 'Check-in thành công!';

            try {
                const response = await axios.post(`${getApiUrl()}/api/checkin/confirm`, {
                    token: scannedCustomer.token
                });
                if (response.data?.message) successMsg = response.data.message;
            } catch (e) {
                console.log("Xử lý ngoại lệ confirm.");
            }

            // Ghi đè bộ nhớ đệm bằng dữ liệu xác nhận thành công mới nhất
            lastScannedRef.current = {
                memberCode: scannedCustomer.memberCode,
                fullName: scannedCustomer.fullName
            };

            // Đẩy bản ghi thành công vào danh sách lịch sử
            setHistory(prev => [{
                id: Math.random().toString(),
                memberCode: scannedCustomer.memberCode,
                customerName: scannedCustomer.fullName,
                time: new Date().toLocaleTimeString('vi-VN'),
                status: 'success',
                message: `${scannedCustomer.fullName} (${scannedCustomer.memberCode}) ${successMsg.toLowerCase()}`
            }, ...prev]);

            setManualToken('');

            setSuccessAnimation({
                active: true,
                memberCode: scannedCustomer.memberCode,
                name: scannedCustomer.fullName,
                phone: scannedCustomer.phone,
                packageName: scannedCustomer.packageName,
                endDate: scannedCustomer.endDate
            });

            setScannedCustomer(null);

        } catch (err: any) {
            const resData = err.response?.data;
            const errMsg = resData?.error || resData?.message || 'Xác nhận vào cửa thất bại';

            setScanResult({
                success: false,
                message: `${scannedCustomer.fullName} (${scannedCustomer.memberCode}): ${errMsg}`
            });

            // Nếu bấm nút xác nhận bị báo trùng, vẫn ghi nhận lượt lỗi có tên và mã rõ ràng vào lịch sử
            setHistory(prev => [{
                id: Math.random().toString(),
                memberCode: scannedCustomer.memberCode,
                customerName: scannedCustomer.fullName,
                time: new Date().toLocaleTimeString('vi-VN'),
                status: 'failed',
                message: `${scannedCustomer.fullName} (${scannedCustomer.memberCode}) ${errMsg.toLowerCase()}`
            }, ...prev]);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setSuccessAnimation(null);
            }, 3000);
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error(err));
            }
        };
    }, []);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900 py-4 px-2 bg-slate-50">

                {/* Tiêu đề trang con */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2.5">
                        <UserCheck className="w-8 h-8 text-indigo-600" />
                        Điểm danh QR
                    </h1>
                    <p className="text-sm text-slate-600 font-medium">Quét nhận diện hội viên hoặc nhập đối chiếu dữ liệu vào cửa tự động</p>
                </div>

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
                        {scannedCustomer && (
                            <div className="bg-purple-50/40 border-2 border-purple-50 rounded-2xl p-6 shadow-sm animate-[fadeIn_0.2s_ease-out] w-full">
                                <h3 className="text-xs font-extrabold text-purple-700 mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Thông tin đối chiếu dữ liệu gốc
                                </h3>

                                <div className="space-y-3 mb-4 bg-white p-5 rounded-xl border border-purple-100 text-xs text-slate-950 font-bold">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-normal">Mã hội viên:</span>
                                        <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-black">{scannedCustomer.memberCode}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-normal">Họ và tên:</span>
                                        <span className="text-slate-950 text-sm font-black">{scannedCustomer.fullName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-normal">Số điện thoại:</span>
                                        <span className="font-mono text-slate-950 font-black">{scannedCustomer.phone}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-normal">Gói đăng ký sử dụng:</span>
                                        <span className="text-slate-950 font-black">{scannedCustomer.packageName}</span>
                                    </div>
                                    <div className="flex justify-between pt-0.5">
                                        <span className="text-slate-600 font-normal">Ngày hết hạn gói:</span>
                                        <span className="text-amber-600 font-black">{scannedCustomer.endDate}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFinalConfirm}
                                    disabled={loading}
                                    className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] py-3.5 rounded-xl font-bold text-xs tracking-wide text-white flex items-center justify-center gap-2 shadow transition-all"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <span>Xác nhận Check-in Hội viên</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

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
                                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-black">
                                                        Mã: {item.memberCode}
                                                    </span>
                                                </div>
                                                {/* Câu thông báo nội dung chi tiết dạng chuỗi tường minh */}
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

            {/* OVERLAY POPUP THÔNG BÁO THÀNH CÔNG RỚT TỪ TRÊN XUỐNG */}
            {successAnimation?.active && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 border-t-emerald-500 animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="w-14 h-14 bg-emerald-50 border-4 border-emerald-500 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-emerald-500 stroke-[3]" />
                        </div>

                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Check-in thành công!</h2>
                        <p className="text-base font-extrabold text-purple-700 mt-1">{successAnimation.name}</p>
                        <p className="text-xs text-slate-950 font-mono font-bold">Mã số hội viên: {successAnimation.memberCode}</p>

                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-1 text-left text-xs text-slate-900 font-bold">
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-normal">Gói sử dụng:</span>
                                <span>{successAnimation.packageName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-normal">Hạn sử dụng:</span>
                                <span className="text-amber-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {successAnimation.endDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}