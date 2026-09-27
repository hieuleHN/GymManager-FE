import { AdminLayout } from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Send, Search, MoreVertical, Phone, Video, Reply, Undo2, Info, Pin, PinOff, BellRing, Paperclip, Smile, Loader2, ImagePlus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { EmojiPicker } from '../../components/EmojiPicker';
import { AttachmentPreviews } from '../../components/AttachmentPreviews';
import { MessageAttachments } from '../../components/MessageAttachments';
import { PinnedMessagesSelect } from '../../components/PinnedMessagesSelect';
import { PinLimitModal } from '../../components/PinLimitModal';
import { MessageSearch } from '../../components/MessageSearch';
import { useAttachmentComposer } from '../../hooks/useAttachmentSender';

interface ReplyContext {
  messageId: string;
  noi_dung: string;
  nguoi_gui: string;
}

interface MessageDetail {
  _id: string;
  noi_dung: string;
  thoi_gian_gui: string;
  nguoi_gui: string;
  da_doc: boolean;
}

interface Msg {
  _id: string;
  nguoi_gui_tin_nhan: string;
  noi_dung: string;
  thoi_gian_gui: string;
  da_doc: boolean;
  da_thu_hoi?: boolean;
  is_pinned?: boolean;
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

export function AdminMessages() {
  const {
    contacts,
    messages,
    unreadCounts,
    onlineStatuses,
    selectedContactId,
    selectedContact,
    selectContact,
    recallMessage,
    togglePinMessage,
    setMessageReminder,
    markAsRead
  } = useChatContext();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [detailFor, setDetailFor] = useState<MessageDetail | null>(null);
  const [reminderFor, setReminderFor] = useState<Msg | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinReplaceTarget, setPinReplaceTarget] = useState<string | null>(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { uploading, dragActive, fileInputRef, pendingFiles, addFiles, removeFile, sendComposer, onDrop, onDragOver, onDragLeave, onPaste } = useAttachmentComposer();

  const isStaff = user?.isStaff;
  const userType = isStaff ? 'huan_luyen_vien' : 'hoi_vien';

  const pinnedMessages = (messages as any[]).filter((m) => m.is_pinned);

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`chat-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('chat-msg-highlight');
      setTimeout(() => el.classList.remove('chat-msg-highlight'), 2000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContactId]);

  useEffect(() => {
    if (selectedContactId) markAsRead(selectedContactId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && pendingFiles.length === 0) return;
    const ok = await sendComposer(messageText, replyContext);
    if (ok) {
      setMessageText('');
      setReplyContext(null);
    }
  };

  const startReply = (msg: Msg) => {
    setReplyContext({
      messageId: msg._id,
      noi_dung: msg.da_thu_hoi ? '[Đã thu hồi]' : msg.noi_dung,
      nguoi_gui: msg.nguoi_gui_tin_nhan === userType ? 'Bạn' : (selectedContact?.fullName || 'Người dùng')
    });
  };

  const cancelReply = () => setReplyContext(null);

  const handleRecall = async (msg: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này không?')) return;
    const res = await recallMessage(msg._id);
    if (!res.ok) {
      toast.error(res.error || 'Không thể thu hồi tin nhắn!');
    }
  };

  const handlePinClick = async (message: Msg) => {
    const res = await togglePinMessage(message._id);
    if (!res.ok) {
      if (res.code === 'PIN_LIMIT') {
        setPinReplaceTarget(message._id);
      } else {
        toast.error(res.error || 'Không thể ghim tin nhắn!');
      }
    }
  };

  const handlePinReplace = async (pinnedId: string) => {
    if (!pinReplaceTarget) return;
    const unpinRes = await togglePinMessage(pinnedId);
    if (!unpinRes.ok) {
      toast.error(unpinRes.error || 'Bỏ ghim thất bại!');
      return;
    }
    const pinRes = await togglePinMessage(pinReplaceTarget);
    if (!pinRes.ok) {
      toast.error(pinRes.error || 'Ghim tin nhắn mới thất bại!');
      return;
    }
    toast.success('Đã thay thế tin nhắn ghim!');
    setPinReplaceTarget(null);
  };

  const openReminder = (msg: Msg) => {
    setReminderFor(msg);
    setReminderDate('');
    setReminderTime('');
  };

  const closeReminder = () => setReminderFor(null);

  const saveReminder = async () => {
    if (!reminderFor || !reminderDate || !reminderTime) return;
    const remindAt = new Date(`${reminderDate}T${reminderTime}`);
    if (isNaN(remindAt.getTime())) return;
    const ok = await setMessageReminder(reminderFor._id, remindAt.toISOString());
    if (ok) {
      alert('Đã đặt nhắc hẹn. Bạn sẽ nhận được thông báo nhắc khi đến giờ.');
      closeReminder();
    } else {
      alert('Đặt nhắc hẹn thất bại. Vui lòng thử lại!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const pickEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
  };

  const filteredContacts = contacts.filter(conv =>
    (conv.fullName || conv.account || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-slate-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tin nhắn..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">
                Chưa có hội viên nào liên hệ.
                <br />
                Khi hội viên nhắn tin, cuộc trò chuyện sẽ hiển thị ở đây.
              </div>
            )}
            {filteredContacts.map((conv) => {
              const unread = unreadCounts.byContact[conv._id] || 0;
              const online = onlineStatuses[conv._id];
              return (
                <button
                  key={conv._id}
                  onClick={() => selectContact(conv._id, conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    selectedContactId === conv._id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="relative">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.fullName || conv.account}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        {(conv.fullName || conv.account || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{conv.fullName || conv.account}</h3>
                      {conv.timestamp && (
                        <span className="text-xs text-slate-500">
                          {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{conv.role}</p>
                    <p className="text-sm text-slate-600 truncate">{conv.lastMessage}</p>
                  </div>
                  {unread > 0 && (
                    <div className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unread}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onPaste={onPaste}
          className={`relative flex-1 flex flex-col ${dragActive ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
        >
          {dragActive && (
            <div className="absolute inset-0 z-20 bg-indigo-500/10 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-xl shadow-lg px-5 py-4 text-center">
                <ImagePlus className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                <div className="text-sm font-medium text-slate-700">Thả ảnh / file để gửi</div>
              </div>
            </div>
          )}
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {selectedContact?.avatar ? (
                  <img
                    src={selectedContact.avatar}
                    alt={selectedContact.fullName || selectedContact.account}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                    {(selectedContact?.fullName || selectedContact?.account || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {selectedContact && onlineStatuses[selectedContact._id] && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedContact?.fullName || selectedContact?.account || 'Chọn một cuộc trò chuyện'}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedContact ? (onlineStatuses[selectedContact._id] ? 'Đang hoạt động' : selectedContact.role) : 'Vui lòng chọn hội thoại bên trái'}
                </p>
              </div>
            </div>
            {selectedContact && (
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMsgSearch((prev) => !prev)}
                  title="Tìm kiếm tin nhắn"
                  className={`p-2 rounded-lg transition-colors ${showMsgSearch ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {showMsgSearch && selectedContactId && (
            <MessageSearch
              messages={messages}
              onJumpTo={scrollToMessage}
              onClose={() => setShowMsgSearch(false)}
            />
          )}

          {selectedContactId && pinnedMessages.length > 0 && (
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-start">
              <PinnedMessagesSelect
                pinnedMessages={pinnedMessages}
                onJumpTo={scrollToMessage}
                onUnpin={(id) => togglePinMessage(id)}
                accent="indigo"
              />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {!selectedContactId && (
              <div className="h-full flex items-center justify-center text-slate-400">
                Chọn một cuộc trò chuyện để bắt đầu nhắn tin
              </div>
            )}
            {selectedContactId && messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-md bg-white text-slate-900 rounded-2xl p-4 border border-slate-200">
                  <p>Xin chào, tôi có thể giúp gì cho bạn?</p>
                </div>
              </div>
            )}
            {messages.map((message) => {
              const isOwn = message.nguoi_gui_tin_nhan === userType;
              const msgForDetail = {
                _id: message._id,
                noi_dung: message.noi_dung,
                thoi_gian_gui: message.thoi_gian_gui,
                nguoi_gui: isOwn ? 'Bạn' : (selectedContact?.fullName || 'Người dùng'),
                da_doc: message.da_doc
              };
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      id={`chat-msg-${message._id}`}
                      className={`relative p-4 rounded-2xl ${
                        isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-900'
                      }`}
                    >
                      {message.is_pinned && (
                        <div className={`absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${isOwn ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-600'}`}>
                          <Pin size={8} /> Ghim
                        </div>
                      )}
                      {message.reply_noi_dung && (
                        <div className={`mb-2 px-2 py-1 rounded-lg text-xs border-l-4 ${isOwn ? 'bg-indigo-500/40 border-indigo-300 text-indigo-50' : 'bg-indigo-50 border-indigo-400 text-indigo-700'}`}>
                          <div className="font-semibold mb-0.5">{message.reply_nguoi_gui || 'Đã trả lời'}</div>
                          <div className="break-words truncate">{message.reply_noi_dung}</div>
                        </div>
                      )}
                      {message.da_thu_hoi ? (
                        <p className="italic opacity-80">Tin nhắn đã thu hồi</p>
                      ) : message.attachments && message.attachments.length > 0 ? (
                        <>
                          <MessageAttachments attachments={message.attachments} isOwn={isOwn} />
                          {message.noi_dung && (
                            <p className="mt-1.5">{message.noi_dung}</p>
                          )}
                        </>
                      ) : (message.loai_tin_nhan === 'image' || message.loai_tin_nhan === 'file') && message.attachment?.fileUrl ? (
                        <MessageAttachments attachments={[message.attachment]} isOwn={isOwn} />
                      ) : (
                        <p>{message.noi_dung}</p>
                      )}
                      {!message.da_thu_hoi && (
                        <div className={`absolute -top-9 hidden group-hover:flex gap-1 ${isOwn ? 'right-0' : 'left-0'}`}>
                          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg shadow-md p-1">
                            <button
                              onClick={() => startReply(message)}
                              title="Trả lời"
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                            >
                              <Reply size={14} />
                            </button>
                            {isOwn && (
                              <button
                                onClick={() => handleRecall(message)}
                                title="Thu hồi"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                              >
                                <Undo2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handlePinClick(message)}
                              title={message.is_pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                              className={`p-1.5 rounded-lg transition-colors ${message.is_pinned ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                            >
                              {message.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                            </button>
                            <button
                              onClick={() => openReminder(message)}
                              title="Đặt nhắc hẹn"
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-colors"
                            >
                              <BellRing size={14} />
                            </button>
                            <button
                              onClick={() => setDetailFor(msgForDetail)}
                              title="Xem chi tiết"
                              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'} text-slate-400`}>
                      <span>{new Date(message.thoi_gian_gui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && <span className={message.da_doc ? 'text-indigo-500 font-medium' : ''}>{message.da_doc ? 'Đã xem' : 'Đã gửi'}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {selectedContactId && (
            <div className="p-4 border-t border-slate-200 bg-white">
              {replyContext && (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs mb-2">
                  <Reply size={14} className="text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-indigo-700 truncate">Trả lời {replyContext.nguoi_gui}</div>
                    <div className="text-slate-600 truncate">{replyContext.noi_dung}</div>
                  </div>
                  <button type="button" onClick={cancelReply} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              )}
              {pendingFiles.length > 0 && (
                <AttachmentPreviews files={pendingFiles} onRemove={removeFile} />
              )}
              <div className="flex gap-1.5 items-center">
                <div className="relative">
                  {showEmoji && <EmojiPicker onPick={pickEmoji} onClose={() => setShowEmoji(false)} />}
                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    title="Emoji"
                    className="text-slate-400 hover:text-indigo-500 p-2 rounded-full hover:bg-slate-50 transition-colors flex-shrink-0"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Gửi ảnh / file"
                  className="text-slate-400 hover:text-indigo-500 p-2 rounded-full hover:bg-slate-50 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onPaste={onPaste}
                  placeholder={replyContext ? 'Nhập tin nhắn trả lời...' : 'Nhập tin nhắn...'}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && pendingFiles.length === 0}
                  className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {detailFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setDetailFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900 text-sm">Chi tiết tin nhắn</h4>
              <button onClick={() => setDetailFor(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Người gửi</div>
                <div className="text-sm font-medium text-slate-800">{detailFor.nguoi_gui}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Nội dung</div>
                <div className="text-sm text-slate-800 break-words bg-slate-50 rounded-lg p-3">{detailFor.noi_dung}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Thời gian gửi</div>
                <div className="text-sm font-medium text-slate-800">
                  {new Date(detailFor.thoi_gian_gui).toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit',
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Trạng thái</div>
                <div className="text-sm font-medium text-slate-800">
                  {detailFor.nguoi_gui === 'Bạn'
                    ? (detailFor.da_doc ? 'Đã xem' : 'Đã gửi')
                    : 'Tin nhắn từ đối phương'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reminderFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={closeReminder}>
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <BellRing size={16} className="text-amber-500" /> Đặt nhắc hẹn
              </h4>
              <button onClick={closeReminder} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Tin nhắn</div>
                <div className="text-sm text-slate-800 break-words bg-slate-50 rounded-lg p-3">
                  {reminderFor.da_thu_hoi ? 'Tin nhắn đã thu hồi' : reminderFor.noi_dung}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Ngày</div>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Giờ</div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <button
                onClick={saveReminder}
                disabled={!reminderDate || !reminderTime}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Đặt nhắc hẹn
              </button>
            </div>
          </div>
        </div>
      )}

      <PinLimitModal
        open={!!pinReplaceTarget}
        pinnedMessages={pinnedMessages}
        onClose={() => setPinReplaceTarget(null)}
        onReplace={handlePinReplace}
      />
    </AdminLayout>
  );
}