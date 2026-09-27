import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import type { ReplyContext } from '../context/ChatContext';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface PendingFile {
  id: string;
  file: File;
  previewUrl?: string;
}

export function useAttachmentComposer() {
  const { sendAttachments, sendMessage } = useChatContext();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, []);

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const accepted: PendingFile[] = [];
    for (const file of list) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" vượt quá 20MB, vui lòng chọn file nhỏ hơn!`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      });
    }
    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted]);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setPendingFiles((prev) => {
      prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      return [];
    });
  }, []);

  const sendComposer = useCallback(
    async (text: string, replyContext?: ReplyContext | null): Promise<boolean> => {
      const files = pendingFiles.map((f) => f.file);
      const trimmedText = text.trim();
      if (files.length === 0 && !trimmedText) return false;

      if (files.length > 0) {
        setUploading(true);
        const ok = await sendAttachments(files, trimmedText, replyContext || null);
        setUploading(false);
        clearFiles();
        if (!ok) {
          alert('Gửi file thất bại. Vui lòng thử lại!');
          return false;
        }
        return true;
      }

      sendMessage(trimmedText, replyContext || null);
      return true;
    },
    [pendingFiles, sendAttachments, sendMessage, clearFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer?.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [addFiles]
  );

  return {
    uploading,
    dragActive,
    pendingFiles,
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    sendComposer,
    onDrop,
    onDragOver,
    onDragLeave,
    onPaste
  };
}
