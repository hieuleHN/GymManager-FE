import { AdminLayout } from '../../components/AdminLayout';
import { Send, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useChatContext } from '../../context/ChatContext';

export function AdminMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');

  const {
    contacts,
    selectedContact,
    messages,
    unreadCounts,
    onlineStatuses,
    selectContact,
    sendMessage
  } = useChatContext();

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        (contact.fullName || contact.account || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [contacts, searchQuery]
  );

  const handleSendMessage = () => {
    if (!selectedContact || !messageText.trim()) return;
    sendMessage(messageText);
    setMessageText('');
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex">
        <div className="w-80 border-r border-slate-200 flex flex-col">
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

          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact) => {
              const unread = unreadCounts.byContact[contact._id] || 0;
              return (
                <button
                  key={contact._id}
                  onClick={() => selectContact(contact._id, contact)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    selectedContact?._id === contact._id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.fullName || contact.account} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-semibold">
                          {(contact.fullName || contact.account || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {onlineStatuses[contact._id] && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{contact.fullName || contact.account}</h3>
                      <span className="text-xs text-slate-500">{unread > 0 ? `${unread} mới` : ''}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{contact.role || 'Huấn luyện viên'}</p>
                    <p className="text-sm text-slate-600 truncate">Nhấn để mở trò chuyện</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                {selectedContact?.avatar ? (
                  <img src={selectedContact.avatar} alt={selectedContact.fullName || selectedContact.account} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-semibold">
                    {(selectedContact?.fullName || selectedContact?.account || 'U')[0].toUpperCase()}
                  </div>
                )}
                {selectedContact && onlineStatuses[selectedContact._id] && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedContact?.fullName || selectedContact?.account || 'Chọn cuộc trò chuyện'}</h3>
                <p className="text-sm text-slate-500">{selectedContact?.role || 'Huấn luyện viên'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {selectedContact ? (
              messages.length === 0 ? (
                <div className="text-center text-slate-500 py-20">Không có tin nhắn nào trong cuộc trò chuyện này.</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.nguoi_gui_tin_nhan === 'hoi_vien';
                  return (
                    <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                        <div className={`p-4 rounded-2xl ${isMine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'}`}>
                          <p>{message.noi_dung}</p>
                        </div>
                        <p className={`text-xs text-slate-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                          {new Date(message.thoi_gian_gui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="text-center text-slate-500 py-20">Chọn một liên hệ để xem cuộc trò chuyện.</div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={selectedContact ? 'Nhập tin nhắn...' : 'Chọn cuộc trò chuyện trước khi gửi tin nhắn'}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!selectedContact}
                onKeyPress={(e) => {
                  if (e.Key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!selectedContact || !messageText.trim()}
                className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
