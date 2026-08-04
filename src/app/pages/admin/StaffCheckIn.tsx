import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AdminLayout } from '../../components/AdminLayout';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { Copy, Check, Clock, RefreshCw } from 'lucide-react';

interface TodayItem {
  _id: string;
  staffId: { _id: string; fullName: string };
  shiftId?: { shift: string } | null;
  shiftTimes?: { start: string; end: string };
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  minutesLate?: number;
  minutesEarly?: number;
  overtime?: number;
  totalMinutes?: number;
}

export function StaffCheckIn() {
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [copied, setCopied] = useState(false);
  const [todayList, setTodayList] = useState<TodayItem[]>([]);

  const strokeDashoffset = 113.1 - (113.1 * countdown) / 30;

  const fetchQR = async () => {
    try {
      setError('');
      setCopied(false);
      const res = await fetch(`${getApiUrl()}/api/staff-attendance/qr`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.token) { setQrToken(data.token); setCountdown(30); }
      else setError(data.error || 'Không thể tạo QR');
    } catch { setError('Không thể kết nối máy chủ'); }
  };

  const fetchToday = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-attendance/today`, { headers: getAuthHeaders() });
      setTodayList(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchQR();
    fetchToday();
    const interval = setInterval(fetchQR, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown > 0 && qrToken) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown, qrToken]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="text-center bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h1 className="text-2xl font-bold mb-1">Chấm công nhân viên</h1>
            <p className="text-sm text-slate-500 mb-6">Đưa mã QR này cho lễ tân quét</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-600 font-medium">{error}</p>
                <button onClick={fetchQR} className="mt-2 text-sm text-red-700 underline">Thử lại</button>
              </div>
            )}

            {qrToken && !error && (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 mb-6">
                  <QRCodeSVG value={qrToken} size={240} fgColor="#000000" bgColor="#ffffff" includeMargin={true} />
                </div>
                <div className="relative w-12 h-12 mb-3">
                  <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth={4} />
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#4f46e5" strokeWidth={4}
                      strokeDasharray="113.1" strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">{countdown}s</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Tự động làm mới sau 30 giây</p>
                <button onClick={() => { navigator.clipboard.writeText(qrToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600 hover:bg-slate-200 transition">
                  {copied ? <><Check size={14} className="text-green-600" /> Đã copy</> : <><Copy size={14} /> Copy token</>}
                </button>
              </div>
            )}
            {!qrToken && !error && <p className="text-indigo-600 font-medium">Đang khởi tạo mã...</p>}
          </div>

          {/* Today's list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Hôm nay</h2>
              <button onClick={fetchToday} className="p-2 rounded-lg hover:bg-slate-100 transition"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
            </div>
            {todayList.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Chưa có ai check-in.</p>}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {todayList.map(r => (
                <div key={r._id} className="p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{r.staffId?.fullName || 'N/A'}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'late' ? 'bg-red-100 text-red-600' :
                      r.status === 'checked-out' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {r.status === 'late' ? 'Đi muộn' : r.status === 'checked-out' ? 'Đã ra' : 'Đã vào'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                    {r.shiftTimes && <p>Ca: {r.shiftId?.shift === 'morning-noon' ? 'Sáng-Trưa' : 'Chiều-Tối'} ({r.shiftTimes.start}-{r.shiftTimes.end})</p>}
                    {r.checkInTime && <p>Vào: {new Date(r.checkInTime).toLocaleTimeString('vi-VN')}{r.minutesLate ? <span className="text-red-500 font-medium"> (muộn {r.minutesLate}p)</span> : ''}</p>}
                    {r.checkOutTime && <p>Ra: {new Date(r.checkOutTime).toLocaleTimeString('vi-VN')}{r.minutesEarly ? <span className="text-amber-500 font-medium"> (về sớm {r.minutesEarly}p)</span> : ''}{r.overtime ? <span className="text-green-500 font-medium"> (tăng ca {r.overtime}p)</span> : ''}</p>}
                    {r.totalMinutes ? <p className="font-medium text-slate-600">Tổng: {Math.floor(r.totalMinutes / 60)}h{r.totalMinutes % 60}p</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
