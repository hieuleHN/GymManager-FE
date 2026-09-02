import { FileText, X } from 'lucide-react';
import type { PendingFile } from '../hooks/useAttachmentSender';

export function AttachmentPreviews({ files, onRemove }: { files: PendingFile[]; onRemove: (id: string) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f) => (
        <div key={f.id} className="relative">
          {f.previewUrl ? (
            <img
              src={f.previewUrl}
              alt={f.file.name}
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-1 text-center">
              <FileText size={18} className="text-gray-400 mb-0.5 flex-shrink-0" />
              <span className="text-[9px] leading-tight text-gray-500 truncate w-full">{f.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
            title="Bỏ file"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
