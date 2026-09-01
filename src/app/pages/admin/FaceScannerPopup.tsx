import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { ScanFace, Check, X, Maximize2, Minimize2 } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';

let announceTimer: ReturnType<typeof setTimeout> | null = null;

const playChime = () => {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 659.25;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
        setTimeout(() => ctx.close(), 1500);
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
    }, 800);
};

const getDirectHeaders = () => {
    try {
        const defaultHeaders = getAuthHeaders();
        if (defaultHeaders && Object.keys(defaultHeaders).length > 0) return defaultHeaders;
    } catch { }

    const rawToken = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    const token = rawToken.replace(/^"(.*)"$/, '$1');
    return {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export function FaceScannerPopup() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
    const [statusText, setStatusText] = useState('Đang khởi tạo AI nhận diện...');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ success: boolean; name: string; msg: string } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const isProcessingRef = useRef(false);
    const backendUrl = getApiUrl() || 'http://localhost:5000';
    const channelRef = useRef<BroadcastChannel | null>(null);

    // Kênh kết nối đồng bộ với trang quản trị chính
    useEffect(() => {
        channelRef.current = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
        return () => {
            channelRef.current?.close();
        };
    }, []);

    const initFaceAI = async () => {
        try {
            setStatusText('Đang nạp Model Face API...');
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setIsModelLoaded(true);
            setStatusText('Đang tải dữ liệu FaceID hội viên...');

            const [custRes, staffRes] = await Promise.all([
                axios.get(`${backendUrl}/api/checkin/face/descriptors`, { headers: getDirectHeaders() as any }).catch(() => ({ data: { data: [] } } as any)),
                axios.get(`${backendUrl}/api/staff/face/descriptors`, { headers: getDirectHeaders() as any }).catch(() => ({ data: { data: [] } } as any))
            ]);
            const custList = (custRes as any).data?.data || ((custRes as any).data?.success ? (custRes as any).data.data : []);
            const staffList2 = (staffRes as any).data?.data || ((staffRes as any).data?.success ? (staffRes as any).data.data : []);
            const labeled: faceapi.LabeledFaceDescriptors[] = [];
            if (Array.isArray(custList)) custList.forEach((c: any) => { if (c.faceDescriptor?.length) labeled.push(new faceapi.LabeledFaceDescriptors(`customer:${c._id}`, [new Float32Array(c.faceDescriptor)])); });
            if (Array.isArray(staffList2)) staffList2.forEach((s: any) => { if (s.faceDescriptor?.length) labeled.push(new faceapi.LabeledFaceDescriptors(`staff:${s._id}`, [new Float32Array(s.faceDescriptor)])); });
            if (labeled.length > 0) {
                setFaceMatcher(new faceapi.FaceMatcher(labeled, 0.62));
                setStatusText(`Sẵn sàng nhận diện · Đã nạp ${custList.length} hội viên, ${staffList2.length} nhân viên`);
            } else {
                setFaceMatcher(null);
                setStatusText('Chưa có ai đăng ký FaceID');
            }
        } catch (e: any) {
            console.error("Face AI Error:", e);
            setStatusText('Lỗi kết nối dữ liệu khuôn mặt máy chủ');
        }
    };

    useEffect(() => {
        initFaceAI();
    }, []);

    // Vòng lặp nhận diện khuôn mặt
    useEffect(() => {
        if (!isModelLoaded || !faceMatcher) return;

        const interval = setInterval(async () => {
            if (
                isProcessingRef.current ||
                loading ||
                feedback ||
                !webcamRef.current?.video ||
                webcamRef.current.video.readyState !== 4
            ) {
                return;
            }

            try {
                isProcessingRef.current = true;
                const video = webcamRef.current.video;
                const detection = await faceapi.detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
                )
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    const match = faceMatcher.findBestMatch(detection.descriptor);
                    if (match.label !== 'unknown') {
                        setStatusText('Đã nhận diện! Đang xử lý điểm danh...');
                        if (match.label.startsWith('staff:')) {
                            await handleStaffFaceCheckIn(match.label.replace('staff:', ''));
                        } else if (match.label.startsWith('customer:')) {
                            await handleFaceCheckIn(match.label.replace('customer:', ''));
                        } else {
                            await handleFaceCheckIn(match.label);
                        }
                    } else {
                        setStatusText('Khuôn mặt chưa được đăng ký trong hệ thống');
                    }
                } else {
                    setStatusText('Vui lòng nhìn thẳng vào camera');
                }
            } catch (e) {
            } finally {
                isProcessingRef.current = false;
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isModelLoaded, faceMatcher, loading, feedback]);

    const handleFaceCheckIn = async (customerId: string) => {
        if (loading) return;
        setLoading(true);

        try {
            const response = await axios.post(`${backendUrl}/api/checkin/face/verify`, {
                customerId
            }, { headers: getDirectHeaders() as any });

            const customer = response.data.customer;
            const name = customer?.fullName || 'Hội viên';
            const isCheckout = response.data.status === 'checked-out';
            // Để tránh nói lặp 2 lần, popup không speak, để trang chính phát

            setFeedback({
                success: true,
                name,
                msg: isCheckout ? 'Check-out FaceID thành công!' : 'Điểm danh FaceID thành công!'
            });

            // Gửi sang màn hình chính (bọc riêng để lỗi postMessage không làm báo thất bại)
            try {
                channelRef.current?.postMessage({
                    type: 'FACE_CHECKIN_TRIGGER',
                    payload: {
                        status: response.data.status,
                        customer,
                        totalMinutes: response.data.totalMinutes,
                        checkCount: response.data.checkCount || response.data.totalSessionsToday || 1,
                        frozenNotice: response.data.frozenNotice || null
                    }
                });
            } catch {}
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Điểm danh FaceID thất bại';
            setFeedback({
                success: false,
                name: 'Thông báo',
                msg
            });
        } finally {
            setLoading(false);
            setTimeout(() => {
                setFeedback(null);
                setStatusText('Sẵn sàng nhận diện...');
            }, 3000);
        }
    };

    const handleStaffFaceCheckIn = async (staffId: string) => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/api/staff/face/verify`, { staffId }, { headers: getDirectHeaders() as any });
            const staffName = response.data.staff?.fullName || 'Nhân viên';
            const isCheckout = response.data.status === 'checked-out';
            setFeedback({ success: true, name: staffName, msg: isCheckout ? 'Check-out FaceID thành công!' : 'Điểm danh FaceID thành công!' });
            try {
                channelRef.current?.postMessage({ type: 'FACE_CHECKIN_TRIGGER', payload: { status: response.data.status, customer: { fullName: staffName } } });
                channelRef.current?.postMessage({ type: 'CHECKIN_EVENT' });
            } catch {}
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Chấm công FaceID nhân viên thất bại';
            setFeedback({ success: false, name: 'Thông báo', msg });
        } finally {
            setLoading(false);
            setTimeout(() => { setFeedback(null); setStatusText('Sẵn sàng nhận diện...'); }, 3000);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
            {/* Header popup */}
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-white shadow-lg">
                    <ScanFace className="w-6 h-6 text-indigo-400 animate-pulse" />
                    <div>
                        <h2 className="text-sm font-black tracking-wide">CỬA SỔ QUÉT FACE ID ĐỘC LẬP</h2>
                        <p className="text-[11px] text-slate-400">{statusText}</p>
                    </div>
                </div>

                <button
                    onClick={toggleFullscreen}
                    className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
                    title="Toàn màn hình"
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Khung Camera */}
            <div className="relative w-full h-full flex items-center justify-center">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full h-full object-cover"
                    screenshotFormat="image/jpeg"
                />

                {/* Vòng nhận diện AI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 sm:w-96 sm:h-96 border-4 border-dashed border-emerald-400 rounded-full animate-pulse flex items-center justify-center">
                        <div className="w-72 h-72 sm:w-88 sm:h-88 border border-emerald-400/20 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Popup Thông Báo Kết Quả */}
            {feedback && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-30 p-4">
                    <div className={`bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-t-8 ${feedback.success ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${feedback.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {feedback.success ? <Check className="w-10 h-10 stroke-[3]" /> : <X className="w-10 h-10 stroke-[3]" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{feedback.name}</h3>
                        <p className={`text-sm font-bold ${feedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
                            {feedback.msg}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}