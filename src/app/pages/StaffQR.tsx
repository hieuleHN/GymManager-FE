import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getAuthHeaders, getApiUrl } from '../context/AuthContext';
import { Copy, Check, Clock } from 'lucide-react';

export function StaffQR() {
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [copied, setCopied] = useState(false);

  const strokeDashoffset = 113.1 - (113.1 * countdown) / 30;

  const fetchQR = async () => {
    try {
      setError('');
      setCopied(false);
      const res = await fetch(`${getApiUrl()}/api/staff-attendance/qr`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.token) {
        setQrToken(data.token);
        setCountdown(30);
      } else {
        setError(data.error || 'Không thể tạo QR');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    }
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(fetchQR, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown > 0 && qrToken) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown, qrToken]);

  const handleCopy = () => {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Segoe UI", sans-serif',
      padding: '120px 20px 60px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '450px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '24px', padding: '20px 40px', width: '100%', marginBottom: '40px' }}>
          <p style={{ color: '#475569', fontSize: '12px', fontWeight: '700', letterSpacing: '4px', margin: '0 0 8px 0' }}>QR CHẤM CÔNG</p>
          <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800', margin: 0 }}>Staff Check-in</h1>
        </div>

        {error && (
          <div style={{ color: '#991b1b', backgroundColor: '#fef2f2', padding: '20px', borderRadius: '16px', fontSize: '14px', border: '1px solid #fca5a5', width: '100%', fontWeight: '700', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 12px 0' }}>{error}</p>
            <button onClick={fetchQR} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Thử lại</button>
          </div>
        )}

        {qrToken && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
              <QRCodeSVG value={qrToken} size={240} fgColor="#000000" bgColor="#ffffff" includeMargin={true} />
            </div>

            <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
              <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="25" cy="25" r="18" fill="none" stroke="#e2e8f0" strokeWidth={4} />
                <circle cx="25" cy="25" r="18" fill="none" stroke="#4f46e5" strokeWidth={4} strokeDasharray="113.1" strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
              </svg>
              <span style={{ position: 'absolute', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{countdown}s</span>
            </div>

            <p style={{ color: '#334155', fontSize: '14px', margin: '0 0 35px 0', fontWeight: '600' }}>Tự động làm mới sau mỗi 30 giây</p>

          <div
            onClick={handleCopy}
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '110px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              cursor: 'pointer',
              padding: '16px 14px 45px 14px',  overflow: 'hidden'}}>              
              <p style={{ color: '#475569', fontSize: '11px', lineHeight: '1.6', margin: 0, wordBreak: 'break-all', textAlign: 'center', userSelect: 'none', fontWeight: '500' }}>{qrToken}</p>
              <div style={{ position: 'absolute', bottom: '8px', right: '50%', transform: 'translateX(50%)', backgroundColor: '#fff', color: '#0f172a', padding: '5px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)', border: '1px solid #cbd5e1' }}>
                {copied ? <><Check size={14} style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>Copied</span></> : <><Copy size={14} /><span>Copy token</span></>}
              </div>
            </div>
          </div>
        )}

        {!qrToken && !error && <p style={{ color: '#4f46e5', fontSize: '14px', fontWeight: '700' }}>Đang khởi tạo mã...</p>}
      </div>
    </div>
  );
}
