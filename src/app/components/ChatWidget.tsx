import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';

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
    sendMessage
  } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStaff = user?.isStaff;
  const userType = isStaff ? 'huan_luyen_vien' : 'hoi_vien';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen && selectedContact) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, selectedContact]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedContact) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  if (!user || user.isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 transition-all duration-300">
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
            <button onClick={() => closeChat()} className="hover:bg-white/20 p-1 rounded-full transition">
              <X size={20} />
            </button>
          </div>

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
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">Bắt đầu trò chuyện!</div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.nguoi_gui_tin_nhan === userType;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl ${isMine
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/20'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm'
                        }`}>
                          <p className="break-words text-sm leading-relaxed">{msg.noi_dung}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.thoi_gian_gui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
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
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-full px-4 py-2 text-sm transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all duration-200 shadow-md disabled:shadow-none flex-shrink-0"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>
          )}
        </div>
      )}

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
