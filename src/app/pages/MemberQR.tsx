import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { ScanFace, CheckCircle2, AlertCircle, Camera, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';

export default function MemberQR() {
    const { user } = useAuth();
    const backendUrl = getApiUrl() || 'http://localhost:5000';

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [statusText, setStatusText] = useState('Đang khởi tạo AI...');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasFaceDetected, setHasFaceDetected] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const isProcessingRef = useRef(false);

    // 1. Nạp Model AI nhận diện khuôn mặt
    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatusText('Đang tải mô hình Face AI...');
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setIsModelLoaded(true);
                setStatusText('Sẵn sàng quét khuôn mặt');
            } catch (err) {
                console.error("Lỗi nạp model:", err);
                setErrorMessage('Không thể nạp mô hình nhận diện khuôn mặt. Vui lòng tải lại trang.');
            }
        };
        loadModels();
    }, []);

    // 2. Vòng lặp phát hiện khuôn mặt thời gian thực
    useEffect(() => {
        if (!isModelLoaded) return;

        const interval = setInterval(async () => {
            if (
                isProcessingRef.current ||
                capturing ||
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
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 })
                );

                if (detection) {
                    setHasFaceDetected(true);
                    setStatusText('Đã phát hiện khuôn mặt hợp lệ! Bạn có thể nhấn Cập nhật');
                } else {
                    setHasFaceDetected(false);
                    setStatusText('Vui lòng đưa khuôn mặt vào giữa vòng tròn');
                }
            } catch (e) {
            } finally {
                isProcessingRef.current = false;
            }
        }, 400);

        return () => clearInterval(interval);
    }, [isModelLoaded, capturing]);

    // 3. Chụp và gửi dữ liệu Face Descriptor về server
    const handleRegisterFace = async () => {
        if (!webcamRef.current?.video || !user) return;
        setCapturing(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            setStatusText('Đang trích xuất đặc trưng khuôn mặt...');
            const video = webcamRef.current.video;
            const detection = await faceapi.detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
            )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setErrorMessage('Không thể nhận diện rõ khuôn mặt. Vui lòng nhìn thẳng và đủ sáng!');
                setCapturing(false);
                return;
            }

            const descriptorArray = Array.from(detection.descriptor);
            const customerId = (user as any)._id || (user as any).id || (user as any).customerId;

            setStatusText('Đang lưu dữ liệu FaceID vào hệ thống...');
            const res = await axios.post(`${backendUrl}/api/checkin/face/register`, {
                customerId,
                faceDescriptor: descriptorArray
            }, {
                headers: getAuthHeaders() as any
            });

            if (res.data?.success) {
                setSuccessMessage('Cập nhật khuôn mặt FaceID thành công! Bây giờ bạn có thể điểm danh trực tiếp bằng FaceID tại quầy.');
            } else {
                setErrorMessage(res.data?.error || 'Không thể cập nhật khuôn mặt');
            }
        } catch (err: any) {
            console.error("Lỗi cập nhật FaceID:", err);
            setErrorMessage(err.response?.data?.error || err.message || 'Lỗi kết nối máy chủ');
        } finally {
            setCapturing(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50/50">
            <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-900">

                {/* Tiêu đề */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 mb-1">
                        <ScanFace className="w-8 h-8 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">
                        Cập Nhật FaceID Hội Viên
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                        Cập nhật lại khuôn mặt của bạn để tự động nhận diện và mở cửa/tủ đồ nhanh chóng tại phòng tập.
                    </p>
                </div>

                {/* Thông báo thành công */}
                {successMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="font-semibold">{successMessage}</div>
                    </div>
                )}

                {/* Thông báo lỗi */}
                {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="font-semibold">{errorMessage}</div>
                    </div>
                )}

                {/* Khung Camera */}
                <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-100 shadow-inner flex items-center justify-center">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                    />

                    {/* Vòng hướng dẫn quét khuôn mặt */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-56 h-56 rounded-full border-4 border-dashed transition-all duration-300 ${hasFaceDetected ? 'border-emerald-400 scale-105' : 'border-slate-500 opacity-60'
                            }`} />
                    </div>

                    {/* Trạng thái quét */}
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[11px] text-center font-medium border border-slate-800">
                        {statusText}
                    </div>
                </div>

                {/* Nút bấm hành động */}
                <div className="space-y-3">
                    <button
                        onClick={handleRegisterFace}
                        disabled={!isModelLoaded || capturing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-indigo-200 transition flex items-center justify-center gap-2"
                    >
                        {capturing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Đang phân tích & Cập nhật FaceID...</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-4 h-4" />
                                <span>Chụp & Cập Nhật Lại Khuôn Mặt</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium text-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Dữ liệu khuôn mặt được mã hóa an toàn dưới dạng vector 128-D</span>
                    </div>
                </div>

            </div>
        </div>
    );
}