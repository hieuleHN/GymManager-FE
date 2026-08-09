import { useState } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';

interface SearchMsg {
  _id: string;
  noi_dung: string;
  nguoi_gui_tin_nhan: string;
  thoi_gian_gui: string;
  da_thu_hoi?: boolean;
}

export function MessageSearch({
  messages,
  onJumpTo,
  onClose
}: {
  messages: SearchMsg[];
  onJumpTo: (messageId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const keyword = query.trim().toLowerCase();
  const results = keyword
    ? messages.filter((m) => m.noi_dung && m.noi_dung.toLowerCase().includes(keyword))
    : [];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm tin nhắn..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Đóng tìm kiếm"
        >
          <X size={16} />
        </button>
      </div>

      {keyword && (
        <div className="max-h-56 overflow-y-auto border-t border-slate-100">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Không tìm thấy tin nhắn nào chứa "{query}"
            </div>
          ) : (
            results.map((m) => (
              <button
                key={m._id}
                onClick={() => {
                  onJumpTo(m._id);
                  onClose();
                }}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-indigo-50 transition-colors border-b border-slate-50"
              >
                <MessageSquare size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {m.nguoi_gui_tin_nhan === 'hoi_vien' ? 'Hội viên' : 'HLV / Hỗ trợ'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.thoi_gian_gui).toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 break-words line-clamp-2">
                    {m.da_thu_hoi ? 'Tin nhắn đã thu hồi' : m.noi_dung}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
