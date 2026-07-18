import { DashboardLayout } from '../../components/DashboardLayout';
import { Send, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { useState } from 'react';

const conversations = [
  {
    id: 1,
    name: 'Nguyễn Thùy Anh',
    role: 'Huấn luyện viên Yoga',
    avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=100',
    lastMessage: 'Buổi tập ngày mai vẫn diễn ra bình thường nhé!',
    timestamp: '10 phút trước',
    unread: 2,
    online: true
  },
  {
    id: 2,
    name: 'Lê Minh Tuấn',
    role: 'Huấn luyện viên Gym',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100',
    lastMessage: 'Chương trình tập tuần này mình đã gửi cho bạn rồi nhé',
    timestamp: '2 giờ trước',
    unread: 0,
    online: false
  },
  {
    id: 3,
    name: 'Trần Phương Anh',
    role: 'Huấn luyện viên Boxing',
    avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=100',
    lastMessage: 'Tuyệt vời! Tiến độ của bạn rất tốt',
    timestamp: '1 ngày trước',
    unread: 0,
    online: true
  },
  {
    id: 4,
    name: 'ZenFitness Support',
    role: 'Hỗ trợ khách hàng',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    lastMessage: 'Cảm ơn bạn đã liên hệ với chúng tôi',
    timestamp: '2 ngày trước',
    unread: 0,
    online: true
  }
];

const messages = [
  {
    id: 1,
    senderId: 1,
    content: 'Chào bạn! Bạn có thắc mắc gì về buổi tập sắp tới không?',
    timestamp: '9:30 AM',
    isOwn: false
  },
  {
    id: 2,
    senderId: 'me',
    content: 'Dạ em muốn hỏi về tư thế yoga mà em đang gặp khó khăn ạ',
    timestamp: '9:32 AM',
    isOwn: true
  },
  {
    id: 3,
    senderId: 1,
    content: 'Không vấn đề gì! Bạn đang gặp khó khăn với tư thế nào vậy?',
    timestamp: '9:33 AM',
    isOwn: false
  },
  {
    id: 4,
    senderId: 'me',
    content: 'Dạ em đang tập tư thế downward dog nhưng em cảm thấy đau ở vai ạ',
    timestamp: '9:35 AM',
    isOwn: true
  },
  {
    id: 5,
    senderId: 1,
    content: 'À đúng rồi, có thể là do bạn đang gồng vai quá mức. Ngày mai mình sẽ điều chỉnh tư thế cho bạn nhé!',
    timestamp: '9:36 AM',
    isOwn: false
  },
  {
    id: 6,
    senderId: 1,
    content: 'Buổi tập ngày mai vẫn diễn ra bình thường nhé!',
    timestamp: '9:40 AM',
    isOwn: false
  }
];

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle send message
      setMessageText('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                  selectedConversation.id === conv.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{conv.name}</h3>
                    <span className="text-xs text-slate-500">{conv.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{conv.role}</p>
                  <p className="text-sm text-slate-600 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {selectedConversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedConversation.name}</h3>
                <p className="text-sm text-slate-500">{selectedConversation.role}</p>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md ${message.isOwn ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.isOwn
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-900'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <p className={`text-xs text-slate-500 mt-1 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}