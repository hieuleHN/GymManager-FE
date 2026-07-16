import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth, getApiUrl, getAuthHeaders } from './AuthContext';
import { useSocket } from '../hooks/useSocket';

interface Contact {
  _id: string;
  fullName?: string;
  account?: string;
  avatar?: string;
  role?: string;
}

interface Message {
  _id: string;
  id_hoi_vien: string;
  id_huan_luyen_vien: string;
  nguoi_gui_tin_nhan: string;
  noi_dung: string;
  thoi_gian_gui: string;
  da_doc: boolean;
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
  selectContact: (contactId: string | null, contactInfo?: Partial<Contact>) => void;
  clearSelectedContact: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => void;
  markAsRead: (contactId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
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
      const res = await fetch(`${getApiUrl()}/api/messages/history/${contactId}`, {
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
      await fetch(`${getApiUrl()}/api/messages/mark-read`, {
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
      addOrUpdateContact({ _id: contactId, ...contactInfo });
    }
    if (contactId === null) {
      setSelectedContact(null);
    }
  };

  const openChatWith = (contactId: string, contactInfo?: Partial<Contact>) => {
    setIsChatOpen(true);
    setCurrentContact(contactId, contactInfo);
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

  const sendMessage = (content: string) => {
    if (!socket || !user || !selectedContactId) return;

    const data = {
      id_hoi_vien: isStaff ? selectedContactId : user.id,
      id_huan_luyen_vien: isStaff ? user.id : selectedContactId,
      nguoi_gui_tin_nhan: userType,
      noi_dung: content
    };

    socket.emit('sendMessage', data);
  };

  useEffect(() => {
    if (!user || user.isAdmin) return;
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
  }, [selectedContactId]);

  useEffect(() => {
    if (!socket || contacts.length === 0) return;
    const contactIds = contacts.map((contact) => contact._id);
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
      const belongsToCurrentContact = selectedContactId && (
        isStaff
          ? newMessage.id_hoi_vien === selectedContactId || newMessage.id_huan_luyen_vien === selectedContactId
          : newMessage.id_huan_luyen_vien === selectedContactId || newMessage.id_hoi_vien === selectedContactId
      );

      if (belongsToCurrentContact) {
        setMessages((prev) => [...prev, newMessage]);
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
        const senderId = isStaff ? newMessage.id_hoi_vien : newMessage.id_huan_luyen_vien;
        const sender = contacts.find((contact) => contact._id === senderId);
        const senderName = sender?.fullName || sender?.account || 'người dùng';
        toast.info(`Bạn có tin nhắn mới từ ${senderName}`);
      }
    };

    socket.on('statusResult', handleStatusResult);
    socket.on('userStatus', handleUserStatus);
    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('statusResult', handleStatusResult);
      socket.off('userStatus', handleUserStatus);
      socket.off('receiveMessage', handleReceiveMessage);
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
        selectContact,
        clearSelectedContact,
        closeChat,
        toggleChat,
        sendMessage,
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
