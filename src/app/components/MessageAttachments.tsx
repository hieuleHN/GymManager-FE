import { useState } from 'react';
import { FileText, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getApiUrl } from '../context/AuthContext';

interface Attach {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

function isImageFile(a: Attach) {
  return a.fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.fileName);
}

export function MessageAttachments({ attachments, isOwn }: { attachments: Attach[]; isOwn: boolean }) {
  const [slideIndex, setSlideIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(isImageFile);
  const files = attachments.filter((a) => !isImageFile(a));

  const imageUrl = (a: Attach) => `${getApiUrl()}${a.fileUrl}`;

  return (
    <div className="space-y-1">
      {images.length > 0 && (
        <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length <= 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlideIndex(idx)}
              className="overflow-hidden rounded-lg group relative cursor-pointer focus:outline-none"
            >
              <img
                src={imageUrl(img)}
                alt={img.fileName}
                className={`w-full object-cover ${images.length === 1 ? 'max-h-56' : 'h-24'} hover:opacity-90 transition-opacity`}
              />
              {images.length > 4 && idx === 3 && (
                <span className="absolute inset-0 bg-black/50 text-white text-lg font-bold flex items-center justify-center">
                  +{images.length - 4}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, idx) => (
            <a
              key={idx}
              href={imageUrl(f)}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-blue-500/40' : 'bg-slate-50'} hover:opacity-80 transition-opacity`}
            >
              <FileText size={18} className={isOwn ? 'text-blue-100' : 'text-indigo-500'} />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{f.fileName}</div>
                <div className="text-[10px] opacity-70">{f.fileSize ? (f.fileSize / 1024).toFixed(0) : 0} KB</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {slideIndex !== null && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85" onClick={() => setSlideIndex(null)}>
          <button
            type="button"
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-[2]"
            onClick={() => setSlideIndex(null)}
          >
            <X size={22} />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-[2]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideIndex((slideIndex - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-[2]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideIndex((slideIndex + 1) % images.length);
                }}
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}
          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl(images[slideIndex])} alt={images[slideIndex].fileName} className="max-w-full max-h-[80vh] rounded-lg object-contain" />
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-white/80 text-sm">{slideIndex + 1} / {images.length} · {images[slideIndex].fileName}</span>
              <a
                href={imageUrl(images[slideIndex])}
                target="_blank"
                rel="noreferrer"
                className="text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5"
                title="Mở ảnh gốc"
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
