import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

const MemberQR: React.FC = () => {
    const [qrToken, setQrToken] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(30);
    const [copied, setCopied] = useState<boolean>(false);

    // Tính toán góc xoay của vòng tròn đếm ngược (30 giây tương ứng với 360 độ)
    // Chiều dài chu vi vòng tròn SVG bán kính r=18 là 2 * pi * 18 = 113.1
    const strokeDashoffset = 113.1 - (113.1 * countdown) / 30;

    const getNewQRCode = async () => {
        try {
            setError('');
            setCopied(false);

            let userLoginToken = '';
            const authUserData = localStorage.getItem('auth_user');

            if (authUserData) {
                try {
                    const parsedUser = JSON.parse(authUserData);
                    userLoginToken = parsedUser.token || '';
                } catch (e) {
                    console.error("Lỗi parse dữ liệu auth_user:", e);
                }
            }

            if (!userLoginToken) {
                setError('Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập trước!');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/checkin/qr', {
                headers: {
                    Authorization: `Bearer ${userLoginToken}`
                }
            });

            if (response.data && response.data.token) {
                setQrToken(response.data.token);
                setCountdown(30);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Không thể kết nối đến máy chủ phòng gym');
            setQrToken('');
        }
    };

    useEffect(() => {
        getNewQRCode();
        const intervalId = setInterval(() => {
            getNewQRCode();
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (countdown > 0 && qrToken) {
            const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [countdown, qrToken]);

    const handleCopyToken = () => {
        if (!qrToken) return;
        navigator.clipboard.writeText(qrToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* ĐIỂM NHẤN: Ô tiêu đề đổ màu xám nhẹ sang trọng, chữ đen rõ nét */}
                <div style={styles.headerContainer}>
                    <p style={styles.headerSub}>QR ĐIỂM DANH</p>
                    <h1 style={styles.headerTitle}>QR Check-in</h1>
                </div>

                {/* Khối báo lỗi với nền đỏ nhạt nổi bật hẳn lên */}
                {error && (
                    <div style={styles.errorBox}>
                        <p style={{ margin: '0 0 12px 0' }}>⚠️ {error}</p>
                        <button onClick={getNewQRCode} style={styles.retryButton}>Thử lại</button>
                    </div>
                )}

                {/* Giao diện QR chính */}
                {qrToken && !error && (
                    <div style={styles.qrContent}>
                        {/* Khung viền bọc QR vững chãi */}
                        <div style={styles.qrWrapper}>
                            <QRCodeSVG
                                value={qrToken}
                                size={240}
                                fgColor="#000000"
                                bgColor="#ffffff"
                                includeMargin={true}
                            />
                        </div>

                        {/* Vòng tròn đếm ngược màu đậm tương phản */}
                        <div style={styles.countdownContainer}>
                            <svg width="50" height="50" style={styles.svgCircle}>
                                <circle cx="25" cy="25" r="18" style={styles.bgCircle} />
                                <circle
                                    cx="25"
                                    cy="25"
                                    r="18"
                                    style={{
                                        ...styles.fgCircle,
                                        strokeDashoffset: strokeDashoffset
                                    }}
                                />
                            </svg>
                            <span style={styles.countdownText}>{countdown}s</span>
                        </div>

                        {/* CHỮ ĐEN ĐẬM: Dễ đọc trên nền sáng */}
                        <p style={styles.subText}>Tự động làm mới sau mỗi 30 giây</p>

                        {/* Ô CHỨA TOKEN MÀU XÁM: Tạo điểm nhấn bọc khối rõ ràng, chữ đen dễ đối chiếu */}
                        <div style={styles.tokenContainer} onClick={handleCopyToken} title="Nhấn để sao chép chuỗi mã">
                            <p style={styles.tokenText}>{qrToken}</p>
                            <div style={styles.copyBadge}>
                                {copied ? (
                                    <>
                                        <Check size={14} style={{ color: '#10b981' }} />
                                        <span style={{ color: '#10b981', fontWeight: '700' }}>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} style={{ color: '#0f172a' }} />
                                        <span>Copy token</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!qrToken && !error && (
                    <p style={styles.loadingText}>Đang khởi tạo mã bảo mật...</p>
                )}
            </div>
        </div>
    );
};

// ĐỊNH NGHĨA CSS OBJECTS - ĐÃ ĐƯỢC TỐI ƯU HÓA PADDING TRÁNH BỊ ĐÈ BỞI MENU NAVBAR
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc', // Màu nền xám/trắng dịu mắt
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        padding: '120px 20px 60px 20px' // Đẩy phần trên xuống 120px để tránh bị Header che khuất
    },
    card: {
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    headerContainer: {
        backgroundColor: '#f1f5f9', // Ô TIÊU ĐỀ: Chuyển sang màu xám nhẹ làm điểm nhấn
        border: '1px solid #cbd5e1', // Viền xám đậm nét hơn một chút
        borderRadius: '24px',
        padding: '20px 40px',
        width: '100%',
        marginBottom: '40px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
    },
    headerSub: {
        color: '#475569', // Chữ phụ xám đậm sắc sảo
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '4px',
        margin: '0 0 8px 0'
    },
    headerTitle: {
        color: '#0f172a', // CHỮ ĐEN ĐẬM: Tuyệt đối rõ ràng
        fontSize: '26px',
        fontWeight: '800',
        margin: 0
    },
    qrContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
    },
    qrWrapper: {
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
    },
    countdownContainer: {
        position: 'relative',
        width: '50px',
        height: '50px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '15px'
    },
    svgCircle: {
        transform: 'rotate(-90deg)',
    },
    bgCircle: {
        fill: 'none',
        stroke: '#e2e8f0', // Vòng chạy nền xám rõ nét
        strokeWidth: 4
    },
    fgCircle: {
        fill: 'none',
        stroke: '#4f46e5', // Màu indigo/tím công nghệ làm tâm điểm nhấn
        strokeWidth: 4,
        strokeDasharray: '113.1',
        transition: 'stroke-dashoffset 1s linear',
        strokeLinecap: 'round'
    },
    countdownText: {
        position: 'absolute',
        color: '#0f172a', // CHỮ ĐEN ĐẬM
        fontSize: '13px',
        fontWeight: '700'
    },
    subText: {
        color: '#334155', // CHỮ ĐEN XÁM: Không lo bị mờ hay khó nhìn nữa
        fontSize: '14px',
        margin: '0 0 35px 0',
        fontWeight: '600'
    },
    tokenContainer: {
        position: 'relative',
        width: '100%',
        maxHeight: '110px',
        backgroundColor: '#f1f5f9', // Ô CHỨA MÃ: Đổi sang màu xám nhẹ để bọc khối làm điểm nhấn
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        cursor: 'pointer',
        padding: '16px 14px 45px 14px', // Tăng padding để đẩy ô chữ cân đối
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    },
    tokenText: {
        color: '#475569', // CHỮ ĐEN XÁM: Tăng tương phản sắc nét hơn rất nhiều
        fontSize: '11px',
        lineHeight: '1.6',
        margin: 0,
        wordBreak: 'break-all',
        textAlign: 'center',
        userSelect: 'none',
        fontWeight: '500'
    },
    copyBadge: {
        position: 'absolute',
        bottom: '8px',
        right: '50%',
        transform: 'translateX(50%)', // Căn chỉnh nút copy ra chính giữa đáy ô xám cho cân bằng tỉ lệ
        backgroundColor: '#ffffff',
        color: '#0f172a', // CHỮ ĐEN ĐẬM
        padding: '5px 14px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
        border: '1px solid #cbd5e1'
    },
    errorBox: {
        color: '#991b1b',
        backgroundColor: '#fef2f2',
        padding: '20px',
        borderRadius: '16px',
        fontSize: '14px',
        border: '1px solid #fca5a5',
        width: '100%',
        fontWeight: '700',
        marginBottom: '20px'
    },
    retryButton: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: 'none',
        padding: '8px 22px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '12px',
        marginTop: '8px',
        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)'
    },
    loadingText: {
        color: '#4f46e5',
        fontSize: '14px',
        fontWeight: '700',
        fontStyle: 'italic'
    }
};

export default MemberQR;