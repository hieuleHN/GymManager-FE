import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_GROUPS: { name: string; emojis: string[] }[] = [
  { name: 'Cảm xúc', emojis: ['😀', '😄', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '😇', '🙂', '😉', '😅', '🤗', '😭', '😢', '😡', '😱', '🤔', '👍', '👎', '👏', '🙏', '💪', '🤝', '✌️'] },
  { name: 'Hoạt động', emojis: ['🏋️', '🏃', '🚴', '🧘', '🏊', '⚽', '🏀', '🎾', '🏐', '🎯', '🎮', '🎧', '💃', '🕺', '⏰', '📅', '📚', '🖥️', '📱'] },
  { name: 'Đồ ăn', emojis: ['🍎', '🍌', '🍇', '🥦', '🥗', '🍗', '🍔', '🍕', '🍜', '🍚', '🥤', '☕', '🍵', '💧', '🥛'] },
  { name: 'Vật phẩm', emojis: ['❤️', '💛', '💚', '💙', '💜', '🖤', '💯', '⭐', '✨', '🔥', '⚡', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '📌', '🔔', '✅', '❌', '⚠️', '💡'] }
];

export function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  const [activeGroup, setActiveGroup] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
      <div className="flex border-b border-gray-100">
        {EMOJI_GROUPS.map((g, idx) => (
          <button
            key={g.name}
            onClick={() => setActiveGroup(idx)}
            title={g.name}
            className={`flex-1 py-2 text-center text-sm transition-colors ${activeGroup === idx ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {g.emojis[0]}
          </button>
        ))}
      </div>
      <div className="p-2 h-40 overflow-y-auto grid grid-cols-8 gap-1">
        {EMOJI_GROUPS[activeGroup].emojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onPick(emoji)}
            className="p-1 hover:bg-gray-100 rounded-lg text-xl transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export { Smile };
