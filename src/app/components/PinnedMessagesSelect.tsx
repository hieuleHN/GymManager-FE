import { useState } from 'react';
import { Pin, ChevronDown, X } from 'lucide-react';

interface PinMsg {
  _id: string;
  da_thu_hoi?: boolean;
  noi_dung: string;
  nguoi_gui_tin_nhan: string;
}

export function PinnedMessagesSelect({
  pinnedMessages,
  onJumpTo,
  onUnpin,
  accent = 'blue'
}: {
  pinnedMessages: PinMsg[];
  onJumpTo: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  accent?: 'blue' | 'indigo';
}) {
  const [open, setOpen] = useState(false);

  if (pinnedMessages.length === 0) return null;

  const color = accent === 'indigo'
    ? { bg: 'bg-indigo-50 border-indigo-200 text-indigo-600', hover: 'hover:bg-indigo-100', badge: 'bg-indigo-100' }
    : { bg: 'bg-blue-50 border-blue-200 text-blue-600', hover: 'hover:bg-blue-100', badge: 'bg-blue-100' };

  return (
    <div className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 ${color.bg} text-xs font-semibold border rounded-full px-3 py-1.5 transition-colors`}
      >
        <Pin size={12} />
        <span>Ghim</span>
        {pinnedMessages.length > 0 && (
          <span className={`${color.badge} rounded-full px-1.5 py-0.5 text-[10px]`}>{pinnedMessages.length}</span>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-40">
            <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
              Tin nhắn đã ghim ({pinnedMessages.length})
            </div>
            <div className="max-h-44 overflow-y-auto">
              {pinnedMessages.slice(0, 3).map((pm) => (
                <div
                  key={pm._id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-50 ${color.hover} transition-colors`}
                  onClick={() => {
                    onJumpTo(pm._id);
                    setOpen(false);
                  }}
                >
                  <Pin size={11} className={accent === 'indigo' ? 'text-indigo-400' : 'text-blue-400'} flex-shrink-0 />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 mb-0.5">
                      {pm.nguoi_gui_tin_nhan === 'hoi_vien' ? 'Hội viên' : 'HLV / Hỗ trợ'}
                    </div>
                    <p className="text-xs text-gray-700 truncate">
                      {pm.da_thu_hoi ? 'Tin nhắn đã thu hồi' : pm.noi_dung}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(pm._id);
                    }}
                    title="Bỏ ghim"
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5 rounded hover:bg-red-50 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
