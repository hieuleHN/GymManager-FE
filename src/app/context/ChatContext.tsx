import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from './AuthContext';
import { useSocket } from '../hooks/useSocket';

interface Contact {
  _id: string;
  fullName?: string;
  account?: string;
  avatar?: string;
  role?: string;
  lastMessage?: string;
  timestamp?: string;
  unread?: number;
  isSupport?: boolean;
}

interface Message {
  _id: string;
  id_hoi_vien: string;
  id_huan_luyen_vien: string | null;
  nguoi_gui_tin_nhan: string;
  loai?: string;
  noi_dung: string;
  thoi_gian_gui: string;
  da_doc: boolean;
  da_thu_hoi?: boolean;
  is_pinned?: boolean;
  reply_to?: string | null;
  reply_noi_dung?: string;
  reply_nguoi_gui?: string;
  loai_tin_nhan?: string;
  attachment?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  };
  attachments?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }[];
}

export interface ReplyContext {
  messageId: string;
  noi_dung: string;
  nguoi_gui: string;
}

function appendUniqueMessage(prev: Message[], msg: Message): Message[] {
  return prev.some((m) => m._id === msg._id) ? prev : [...prev, msg];
}

interface UnreadCounts {
  total: number;
  byContact: Record<string, number>;
}

interface ChatContextType {
  isChatOpen: boolean;
  selectedContactId: string | null;
  selectedContact: Contact | null;
  contacts: Contact[];
  messages: Message[];
  unreadCounts: UnreadCounts;
  onlineStatuses: Record<string, boolean>;
  openChatWith: (contactId: string, contactInfo?: Partial<Contact>) => void;
  openSupportChat: () => void;
  selectContact: (contactId: string | null, contactInfo?: Partial<Contact>) => void;
  clearSelectedContact: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string, replyContext?: ReplyContext | null) => void;
  sendAttachments: (files: File[], text?: string, replyContext?: ReplyContext | null) => Promise<boolean>;
  recallMessage: (messageId: string) => Promise<{ ok: boolean; error?: string }>;
  togglePinMessage: (messageId: string) => Promise<{ ok: boolean; code?: string; error?: string }>;
  setMessageReminder: (messageId: string, remindAt: string) => Promise<boolean>;
  markAsRead: (contactId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactInfo, setSelectedContactInfo] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ total: 0, byContact: {} });
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});

  const isStaff = user?.isStaff;
  const userType = isStaff ? 'huan_luyen_vien' : 'hoi_vien';

  const addOrUpdateContact = (contact: Contact) => {
    setContacts((prev) => {
      const existingIndex = prev.findIndex((item) => item._id === contact._id);
      if (existingIndex === -1) {
        return [...prev, contact];
      }
      return prev.map((item, index) =>
        index === existingIndex ? { ...item, ...contact } : item
      );
    });
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/contacts`, {
        headers: getAuthHeaders() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/unread`, {
        headers: getAuthHeaders() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const contact = contacts.find((c) => c._id === contactId);
      const isSupport = contactId === 'support' || contact?.isSupport === true;
      const url = isSupport
        ? `${getApiUrl()}/api/messages/support/history/${contactId}`
        : `${getApiUrl()}/api/messages/history/${contactId}`;
      const res = await fetch(url, {
        headers: getAuthHeaders() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const markAsRead = async (contactId: string) => {
    try {
      const contact = contacts.find((c) => c._id === contactId);
      const isSupport = contactId === 'support' || contact?.isSupport === true;
      const url = isSupport
        ? `${getApiUrl()}/api/messages/support/mark-read`
        : `${getApiUrl()}/api/messages/mark-read`;
      await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({ contactId })
      });
      fetchUnreadCounts();
    } catch (err) {
      console.error('Failed to mark messages as read', err);
    }
  };

  const setCurrentContact = (contactId: string | null, contactInfo?: Partial<Contact>) => {
    setSelectedContactId(contactId);
    if (contactInfo && contactId) {
      setSelectedContactInfo({ _id: contactId, ...contactInfo });
      setSelectedContact({ _id: contactId, ...contactInfo });
    } else if (contactId === null) {
      setSelectedContactInfo(null);
      setSelectedContact(null);
    }
  };

  const openChatWith = (contactId: string, contactInfo?: Partial<Contact>) => {
    setIsChatOpen(true);
    setCurrentContact(contactId, contactInfo);
  };

  const openSupportChat = () => {
    setIsChatOpen(true);
    setCurrentContact('support', {
      _id: 'support',
      fullName: 'Hỗ trợ khách hàng',
      account: 'Hỗ trợ khách hàng',
      role: 'Hỗ trợ',
      isSupport: true
    });
  };

  const selectContact = (contactId: string | null, contactInfo?: Partial<Contact>) => {
    setCurrentContact(contactId, contactInfo);
  };

  const clearSelectedContact = () => {
    setCurrentContact(null);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const sendMessage = (content: string, replyContext?: ReplyContext | null) => {
    if (!socket || !user || !selectedContactId) return;

    const contact = contacts.find((c) => c._id === selectedContactId);
    const isSupport = selectedContactId === 'support' || contact?.isSupport === true;
    const replyPayload = replyContext
      ? {
          reply_to: replyContext.messageId,
          reply_noi_dung: replyContext.noi_dung,
          reply_nguoi_gui: replyContext.nguoi_gui
        }
      : {};

    if (isSupport) {
      const data = isStaff
        ? { id_hoi_vien: selectedContactId, noi_dung: content, ...replyPayload }
        : { noi_dung: content, ...replyPayload };
      socket.emit('sendSupportMessage', data);
      return;
    }

    const data = {
      id_hoi_vien: isStaff ? selectedContactId : user.id,
      id_huan_luyen_vien: isStaff ? user.id : selectedContactId,
      nguoi_gui_tin_nhan: userType,
      noi_dung: content,
      ...replyPayload
    };

    socket.emit('sendMessage', data);
  };

  const sendAttachments = async (files: File[], text?: string, replyContext?: ReplyContext | null): Promise<boolean> => {
    if (!user || !selectedContactId || files.length === 0) return false;

    const contact = contacts.find((c) => c._id === selectedContactId);
    const isSupport = selectedContactId === 'support' || contact?.isSupport === true;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (text && text.trim()) formData.append('noi_dung', text.trim());
    if (isSupport) {
      if (isStaff) formData.append('id_hoi_vien', selectedContactId);
      else formData.append('id_hoi_vien', user.id as string);
      formData.append('id_huan_luyen_vien', isStaff ? (user.id as string) : '');
      formData.append('loai', 'ho_tro');
    } else {
      formData.append('id_hoi_vien', isStaff ? selectedContactId : (user.id as string));
      formData.append('id_huan_luyen_vien', isStaff ? (user.id as string) : selectedContactId);
      formData.append('loai', 'truc_tiep');
    }
    if (replyContext) {
      formData.append('reply_to', replyContext.messageId);
      formData.append('reply_noi_dung', replyContext.noi_dung);
      formData.append('reply_nguoi_gui', replyContext.nguoi_gui);
    }

    try {
      const authHeaders = getAuthHeaders() as Record<string, string>;
      const headers: Record<string, string> = { Authorization: authHeaders['Authorization'] || '' };
      if (authHeaders['X-Location-Id']) headers['X-Location-Id'] = authHeaders['X-Location-Id'];
      const res = await fetch(`${getApiUrl()}/api/messages/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => appendUniqueMessage(prev, saved));
        fetchContacts();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to upload attachment', err);
      return false;
    }
  };

  const recallMessage = async (messageId: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/recall`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({ messageId })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m._id === updated._id ? { ...m, da_thu_hoi: true } : m))
        );
        return { ok: true };
      }
      const errBody = await res.json().catch(() => null);
      return { ok: false, error: errBody?.error || 'Không thể thu hồi tin nhắn!' };
    } catch (err) {
      console.error('Failed to recall', err);
      return { ok: false, error: 'Không thể thu hồi tin nhắn!' };
    }
  };

  const togglePinMessage = async (messageId: string): Promise<{ ok: boolean; code?: string; error?: string }> => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/pin`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({ messageId })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? { ...m, is_pinned: updated.is_pinned } : m)));
        return { ok: true };
      }
      const errBody = await res.json().catch(() => null);
      return { ok: false, code: errBody?.code, error: errBody?.error || 'Không thể ghim tin nhắn!' };
    } catch (err) {
      console.error('Failed to toggle pin', err);
      return { ok: false, error: 'Không thể ghim tin nhắn!' };
    }
  };

  const setMessageReminder = async (messageId: string, remindAt: string): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/reminder`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({ messageId, remindAt })
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to set reminder', err);
      return false;
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchContacts();
    fetchUnreadCounts();
  }, [user]);

  useEffect(() => {
    if (!selectedContactId || contacts.length === 0) return;
    const contact = contacts.find((c) => c._id === selectedContactId);
    if (contact) {
      setSelectedContact(contact);
    }
  }, [selectedContactId, contacts]);

  useEffect(() => {
    if (!selectedContactId) return;
    fetchMessages(selectedContactId);
    markAsRead(selectedContactId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId]);

  useEffect(() => {
    if (!socket || contacts.length === 0) return;
    const contactIds = contacts
      .filter((contact) => contact._id !== 'support')
      .map((contact) => contact._id);
    socket.emit('checkStatus', contactIds);
  }, [socket, contacts]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusResult = (statuses: Record<string, boolean>) => {
      setOnlineStatuses((prev) => ({ ...prev, ...statuses }));
    };

    const handleUserStatus = ({ userId, status }: { userId: string; status: string }) => {
      setOnlineStatuses((prev) => ({ ...prev, [userId]: status === 'online' }));
    };

    const handleReceiveMessage = (newMessage: Message) => {
      const isSupportMessage = newMessage.loai === 'ho_tro';

      if (isSupportMessage) {
        const contact = contacts.find((c) => c._id === selectedContactId);
        const isSupportThreadOpen = selectedContactId && (selectedContactId === 'support' || contact?.isSupport === true);

        const threadMemberId = isStaff ? selectedContactId : user?.id;
        if (isSupportThreadOpen && newMessage.id_hoi_vien === threadMemberId) {
          setMessages((prev) => appendUniqueMessage(prev, newMessage));
        }

        if (newMessage.nguoi_gui_tin_nhan === userType) {
          fetchContacts();
        } else {
          fetchUnreadCounts();
          fetchContacts();
          if (isSupportThreadOpen && newMessage.id_hoi_vien === threadMemberId) {
            markAsRead(selectedContactId);
          }
        }
        return;
      }

      const belongsToCurrentContact = selectedContactId && (
        isStaff
          ? newMessage.id_hoi_vien === selectedContactId || newMessage.id_huan_luyen_vien === selectedContactId
          : newMessage.id_huan_luyen_vien === selectedContactId || newMessage.id_hoi_vien === selectedContactId
      );

      if (belongsToCurrentContact) {
        setMessages((prev) => appendUniqueMessage(prev, newMessage));
      }

      if (newMessage.nguoi_gui_tin_nhan === userType) {
        fetchContacts();
      }

      const isFromCurrentContact = selectedContactId && (
        isStaff
          ? newMessage.id_hoi_vien === selectedContactId
          : newMessage.id_huan_luyen_vien === selectedContactId
      );

      if (isFromCurrentContact) {
        markAsRead(selectedContactId);
      } else if (newMessage.nguoi_gui_tin_nhan !== userType) {
        fetchUnreadCounts();
        fetchContacts();
      }
    };

    const handleMessageRecalled = (recalledMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === recalledMessage._id ? { ...msg, da_thu_hoi: true } : msg
        )
      );
    };

    const handleMessagePinned = (pinnedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === pinnedMessage._id ? { ...msg, is_pinned: pinnedMessage.is_pinned } : msg
        )
      );
    };

    socket.on('statusResult', handleStatusResult);
    socket.on('userStatus', handleUserStatus);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageRecalled', handleMessageRecalled);
    socket.on('messagePinned', handleMessagePinned);

    return () => {
      socket.off('statusResult', handleStatusResult);
      socket.off('userStatus', handleUserStatus);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageRecalled', handleMessageRecalled);
      socket.off('messagePinned', handleMessagePinned);
    };
  }, [socket, contacts, selectedContactId, isStaff, userType]);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        selectedContactId,
        selectedContact,
        contacts,
        messages,
        unreadCounts,
        onlineStatuses,
        openChatWith,
        openSupportChat,
        selectContact,
        clearSelectedContact,
        closeChat,
        toggleChat,
        sendMessage,
        sendAttachments,
        recallMessage,
        togglePinMessage,
        setMessageReminder,
        markAsRead
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
