import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MessageCircle, X, Send, Reply, Undo2, Info, Pin, PinOff, BellRing, Paperclip, Smile, Loader2, ImagePlus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentPreviews } from './AttachmentPreviews';
import { MessageAttachments } from './MessageAttachments';
import { PinnedMessagesSelect } from './PinnedMessagesSelect';
import { PinLimitModal } from './PinLimitModal';
import { MessageSearch } from './MessageSearch';
import { useAttachmentComposer } from '../hooks/useAttachmentSender';

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

interface Message {
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

export function ChatWidget() {
  const { user } = useAuth();
  const {
    isChatOpen,
    selectedContact,
    contacts,
    messages,
    unreadCounts,
    onlineStatuses,
    closeChat,
    toggleChat,
    selectContact,
    clearSelectedContact,
    recallMessage,
    togglePinMessage,
    setMessageReminder
  } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [detailFor, setDetailFor] = useState<MessageDetail | null>(null);
  const [reminderFor, setReminderFor] = useState<Message | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pinReplaceTarget, setPinReplaceTarget] = useState<string | null>(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const { uploading, dragActive, fileInputRef, pendingFiles, addFiles, removeFile, sendComposer, onDrop, onDragOver, onDragLeave, onPaste } = useAttachmentComposer();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen && selectedContact) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    if (!inputMessage.trim() && pendingFiles.length === 0) return;

    const ok = await sendComposer(inputMessage, replyContext);
    if (ok) {
      setInputMessage('');
      setReplyContext(null);
    }
  };

  const startReply = (msg: Message) => {
    setReplyContext({
      messageId: msg._id,
      noi_dung: msg.da_thu_hoi ? '[Đã thu hồi]' : msg.noi_dung,
      nguoi_gui: msg.nguoi_gui_tin_nhan === userType ? 'Bạn' : (selectedContact?.fullName || 'Người dùng')
    });
  };

  const cancelReply = () => setReplyContext(null);

  const handleRecall = async (msg: Message) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này không?')) return;
    const res = await recallMessage(msg._id);
    if (!res.ok) {
      toast.error(res.error || 'Không thể thu hồi tin nhắn!');
    }
  };

  const handlePinClick = async (msg: Message) => {
    const res = await togglePinMessage(msg._id);
    if (!res.ok) {
      if (res.code === 'PIN_LIMIT') {
        setPinReplaceTarget(msg._id);
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

  const openReminder = (msg: Message) => {
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

  const pickEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  if (!user || user.isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 ${dragActive ? 'ring-2 ring-blue-400' : ''}`}
        >
          {dragActive && (
            <div className="absolute inset-0 z-[70] bg-blue-500/10 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-xl shadow-lg px-5 py-4 text-center">
                <ImagePlus className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                <div className="text-sm font-medium text-gray-700">Thả ảnh / file để gửi</div>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white flex justify-between items-center shadow-md">
            <h3 className="font-semibold text-lg flex items-center">
              {selectedContact ? (
                <>
                  <button onClick={() => clearSelectedContact()} className="mr-2 hover:bg-white/20 p-1 rounded-full transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  {selectedContact.fullName || selectedContact.account}
                </>
              ) : (
                'Tin nhắn'
              )}
            </h3>
            <div className="flex items-center gap-1">
              {selectedContact && (
                <button
                  onClick={() => setShowMsgSearch((prev) => !prev)}
                  className="hover:bg-white/20 p-1.5 rounded-full transition"
                  title="Tìm kiếm tin nhắn"
                >
                  <Search size={17} />
                </button>
              )}
              <button onClick={() => closeChat()} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
              </button>
            </div>
          </div>

          {showMsgSearch && selectedContact && (
            <MessageSearch
              messages={messages}
              onJumpTo={scrollToMessage}
              onClose={() => setShowMsgSearch(false)}
            />
          )}

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            {!selectedContact ? (
              <div className="overflow-y-auto flex-1 p-2">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Không có liên hệ nào</div>
                ) : (
                  contacts.map((contact) => {
                    const unread = unreadCounts.byContact[contact._id] || 0;
                    return (
                      <div
                        key={contact._id}
                        onClick={() => selectContact(contact._id, contact)}
                        className="flex items-center p-3 hover:bg-blue-50/60 cursor-pointer rounded-xl transition-all duration-200 mb-1 border border-transparent hover:border-blue-100"
                      >
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-full flex items-center justify-center mr-3 font-semibold text-blue-600 shadow-sm border border-blue-100 relative">
                          {contact.avatar ? (
                            <img src={contact.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            contact.fullName?.[0]?.toUpperCase() || contact.account?.[0]?.toUpperCase()
                          )}
                          {onlineStatuses[contact._id] && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{contact.fullName || contact.account}</h4>
                          <p className="text-sm text-gray-500 truncate">Nhấn để nhắn tin</p>
                        </div>
                        {unread > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                            {unread}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
                {pinnedMessages.length > 0 && (
                  <div className="mb-1">
                    <PinnedMessagesSelect
                      pinnedMessages={pinnedMessages}
                      onJumpTo={scrollToMessage}
                      onUnpin={(id) => togglePinMessage(id)}
                      accent="blue"
                    />
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] p-3 rounded-2xl bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm">
                      <p className="break-words text-sm leading-relaxed">Xin chào, tôi có thể giúp gì cho bạn?</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.nguoi_gui_tin_nhan === userType;
                    const msgForDetail = {
                      _id: msg._id,
                      noi_dung: msg.noi_dung,
                      thoi_gian_gui: msg.thoi_gian_gui,
                      nguoi_gui: isMine ? 'Bạn' : (selectedContact?.fullName || 'Người dùng'),
                      da_doc: msg.da_doc
                    };
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                        <div id={`chat-msg-${msg._id}`} className={`relative max-w-[75%] p-3 rounded-2xl ${isMine
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/20'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm'
                        }`}>
                          {msg.is_pinned && (
                            <div className={`absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${isMine ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-600'}`}>
                              <Pin size={8} /> Ghim
                            </div>
                          )}
                          {msg.reply_noi_dung && (
                            <div className={`mb-2 px-2 py-1 rounded-lg text-xs border-l-4 ${isMine ? 'bg-blue-500/40 border-blue-300 text-blue-50' : 'bg-blue-50 border-blue-400 text-blue-700'}`}>
                              <div className="font-semibold mb-0.5">{msg.reply_nguoi_gui || 'Đã trả lời'}</div>
                              <div className="break-words truncate">{msg.reply_noi_dung}</div>
                            </div>
                          )}
                          {msg.da_thu_hoi ? (
                            <p className="text-sm italic break-words leading-relaxed opacity-80">Tin nhắn đã thu hồi</p>
                          ) : msg.attachments && msg.attachments.length > 0 ? (
                            <>
                              <MessageAttachments attachments={msg.attachments} isOwn={isMine} />
                              {msg.noi_dung && (
                                <p className="mt-1.5 break-words text-sm leading-relaxed">{msg.noi_dung}</p>
                              )}
                            </>
                          ) : msg.loai_tin_nhan === 'image' && msg.attachment?.fileUrl ? (
                            <MessageAttachments attachments={[msg.attachment]} isOwn={isMine} />
                          ) : msg.loai_tin_nhan === 'file' && msg.attachment?.fileUrl ? (
                            <MessageAttachments attachments={[msg.attachment]} isOwn={isMine} />
                          ) : (
                            <p className="break-words text-sm leading-relaxed">{msg.noi_dung}</p>
                          )}
                          <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {isMine ? (
                              <span>{msg.da_doc ? 'Đã xem' : 'Đã gửi'}</span>
                            ) : (
                              <span>{new Date(msg.thoi_gian_gui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          {!msg.da_thu_hoi && (
                            <div className={`absolute -top-9 hidden group-hover:flex gap-1 ${isMine ? 'right-0' : 'left-0'}`}>
                              <div className="flex gap-1 bg-white border border-gray-200 rounded-lg shadow-md p-1">
                                <button
                                  onClick={() => startReply(msg)}
                                  title="Trả lời"
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Reply size={14} />
                                </button>
                                {isMine && (
                                  <button
                                    onClick={() => handleRecall(msg)}
                                    title="Thu hồi"
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                                  >
                                    <Undo2 size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePinClick(msg)}
                                  title={msg.is_pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                  className={`p-1.5 rounded-lg transition-colors ${msg.is_pinned ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                                >
                                  {msg.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                </button>
                                <button
                                  onClick={() => openReminder(msg)}
                                  title="Đặt nhắc hẹn"
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors"
                                >
                                  <BellRing size={14} />
                                </button>
                                <button
                                  onClick={() => setDetailFor(msgForDetail)}
                                  title="Xem chi tiết"
                                  className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                >
                                  <Info size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {selectedContact && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2">
              {replyContext && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs">
                  <Reply size={14} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-blue-700 truncate">Trả lời {replyContext.nguoi_gui}</div>
                    <div className="text-gray-600 truncate">{replyContext.noi_dung}</div>
                  </div>
                  <button type="button" onClick={cancelReply} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              )}
              {pendingFiles.length > 0 && (
                <AttachmentPreviews files={pendingFiles} onRemove={removeFile} />
              )}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  {showEmoji && <EmojiPicker onPick={pickEmoji} onClose={() => setShowEmoji(false)} />}
                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    title="Emoji"
                    className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    <Smile size={20} />
                  </button>
                </div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Gửi ảnh / file"
                  className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-50 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onPaste={onPaste}
                  placeholder={replyContext ? 'Nhập tin nhắn trả lời...' : 'Nhập tin nhắn...'}
                  className="flex-1 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-full px-4 py-2 text-sm transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() && pendingFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all duration-200 shadow-md disabled:shadow-none flex-shrink-0"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {detailFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setDetailFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[320px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm">Chi tiết tin nhắn</h4>
              <button onClick={() => setDetailFor(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Người gửi</div>
                <div className="text-sm font-medium text-gray-800">{detailFor.nguoi_gui}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Nội dung</div>
                <div className="text-sm text-gray-800 break-words bg-gray-50 rounded-lg p-3">{detailFor.noi_dung}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Thời gian gửi</div>
                <div className="text-sm font-medium text-gray-800">
                  {new Date(detailFor.thoi_gian_gui).toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit',
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Trạng thái</div>
                <div className="text-sm font-medium text-gray-800">
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
          <div className="bg-white rounded-2xl shadow-2xl w-[320px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <BellRing size={16} className="text-amber-500" /> Đặt nhắc hẹn
              </h4>
              <button onClick={closeReminder} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Tin nhắn</div>
                <div className="text-sm text-gray-800 break-words bg-gray-50 rounded-lg p-3">
                  {reminderFor.da_thu_hoi ? 'Tin nhắn đã thu hồi' : reminderFor.noi_dung}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Ngày</div>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Giờ</div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
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

      <button
        onClick={() => toggleChat()}
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300 relative group"
      >
        <MessageCircle size={28} className="group-hover:scale-110 transition-transform duration-300" />
        {unreadCounts.total > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
            {unreadCounts.total}
          </span>
        )}
      </button>
    </div>
  );
}
