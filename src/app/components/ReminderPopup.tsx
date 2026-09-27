import { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface ReminderNotification {
  id: string;
  title: string;
  message: string;
}

export function ReminderPopup() {
  const { socket } = useSocket();
  const [popups, setPopups] = useState<ReminderNotification[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      if (data?.type !== 'message_reminder') return;
      const id = `${data.message}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPopups((prev) => [...prev, { id, title: data.title || 'Nhắc hẹn', message: data.message || '' }]);
    };

    socket.on('receiveNotification', handleNotification);
    return () => {
      socket.off('receiveNotification', handleNotification);
    };
  }, [socket]);

  const dismiss = (id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      {popups.map((p) => (
        <div key={p.id} className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => dismiss(p.id)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
              <h4 className="font-bold text-amber-700 text-sm flex items-center gap-2">
                <BellRing size={16} /> {p.title}
              </h4>
              <button
                onClick={() => dismiss(p.id)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm text-slate-800 break-words whitespace-pre-wrap">{p.message}</div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => dismiss(p.id)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
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
