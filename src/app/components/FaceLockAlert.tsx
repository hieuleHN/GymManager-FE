import { useEffect, useState } from 'react';
import { Lock, X, KeyRound, Clock } from 'lucide-react';

interface LockedLocker {
  _id?: string;
  lockerNumber: string;
  expiryDate?: string;
  overdueDays?: number;
}

interface LockAlert {
  id: string;
  customerName: string;
  message: string;
  lockers: LockedLocker[];
}

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
};

// Cửa sổ thông báo khóa FaceID toàn hệ thống: dù đang ở trang nào cũng bật lên,
// hiển thị cả thông tin tủ đang quá hạn. Nghe qua BroadcastChannel từ các màn quét.
export function FaceLockAlert() {
  const [alerts, setAlerts] = useState<LockAlert[]>([]);

  useEffect(() => {
    const channel = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
    channel.onmessage = (event) => {
      if (event.data?.type !== 'FACE_LOCKED_ALERT') return;
      const p = event.data.payload || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setAlerts((prev) => [
        ...prev.slice(-2),
        {
          id,
          customerName: p.customerName || p.name || 'Hội viên',
          message: p.message || 'FaceID đang bị khóa do quá hạn thuê tủ.',
          lockers: Array.isArray(p.lockers) ? p.lockers : [],
        },
      ]);
    };
    return () => channel.close();
  }, []);

  // Tự đóng sau 15s nếu lễ tân quên bấm
  useEffect(() => {
    if (!alerts.length) return;
    const t = setTimeout(() => setAlerts((prev) => prev.slice(1)), 15000);
    return () => clearTimeout(t);
  }, [alerts]);

  const dismiss = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <>
      {alerts.map((a) => (
        <div key={a.id} className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => dismiss(a.id)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-t-red-600">
            <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
              <h4 className="font-black text-red-700 text-sm flex items-center gap-2">
                <Lock size={16} /> FaceID BỊ KHÓA
              </h4>
              <button
                onClick={() => dismiss(a.id)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-base font-black text-slate-900">{a.customerName}</p>
              <p className="text-sm font-semibold text-red-600 mt-1">{a.message}</p>
              {a.lockers.length > 0 && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Tủ đang quá hạn ({a.lockers.length})
                  </p>
                  {a.lockers.map((l, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2">
                      <span className="font-black text-sm text-slate-900">{l.lockerNumber}</span>
                      <span className="text-xs font-bold text-rose-700 inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {typeof l.overdueDays === 'number' ? `Quá ${l.overdueDays} ngày` : 'Quá hạn'}
                        {l.expiryDate ? ` · hết ${formatDate(l.expiryDate)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Thu tiền gia hạn/trả tủ ở Quản lý tủ đồ — FaceID sẽ tự động mở lại ngay khi hết quá hạn.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => dismiss(a.id)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl transition-colors"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
