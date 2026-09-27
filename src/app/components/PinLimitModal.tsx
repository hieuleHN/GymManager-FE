import { useState } from 'react';
import { Pin, X, Loader2 } from 'lucide-react';

interface PinMsg {
  _id: string;
  da_thu_hoi?: boolean;
  noi_dung: string;
  nguoi_gui_tin_nhan: string;
}

export function PinLimitModal({
  open,
  pinnedMessages,
  onClose,
  onReplace
}: {
  open: boolean;
  pinnedMessages: PinMsg[];
  onClose: () => void;
  onReplace: (pinnedId: string) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!open) return null;

  const handleClick = async (pinnedId: string) => {
    if (busyId) return;
    setBusyId(pinnedId);
    await onReplace(pinnedId);
    setBusyId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <Pin size={16} />
          <h3 className="text-sm font-bold text-slate-800">Đã đạt giới hạn 3 tin ghim</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Bỏ ghim một tin nhắn hiện có để thay thế bằng tin nhắn mới:
        </p>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {pinnedMessages.map((pm) => (
            <button
              key={pm._id}
              disabled={!!busyId}
              onClick={() => handleClick(pm._id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-colors disabled:opacity-60"
            >
              <Pin size={12} className="text-indigo-400 flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-400">
                  {pm.nguoi_gui_tin_nhan === 'hoi_vien' ? 'Hội viên' : 'HLV / Hỗ trợ'}
                </span>
                <span className="block text-xs text-slate-700 truncate">
                  {pm.da_thu_hoi ? 'Tin nhắn đã thu hồi' : pm.noi_dung}
                </span>
              </span>
              {busyId === pm._id ? (
                <Loader2 size={14} className="text-indigo-500 animate-spin flex-shrink-0" />
              ) : (
                <span className="text-[10px] font-semibold text-indigo-600 flex-shrink-0">Bỏ ghim</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
