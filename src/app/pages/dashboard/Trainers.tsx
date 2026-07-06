import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect, useRef } from 'react';
import { Star, Calendar, MoreVertical, Flag, X, Send, MessageCircle } from 'lucide-react';
import { Button } from '@mui/material';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Trainer {
  _id: string;
  fullName: string;
  avatar: string;
  coverImage: string;
  description: string;
  specialties: string[];
  gallery: string[];
  rating: number;
  totalReviews: number;
  experience: string;
  pricePerSession: number;
  disciplineId: { _id: string; name: string } | null;
  locationId: { _id: string; title: string } | null;
  gender: string;
  job: { name: string; isAdmin: boolean };
  phone: string;
  email: string;
}

interface Discipline {
  _id: string;
  name: string;
}

interface ChatMessage {
  id: number;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export function Trainers() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState<{ trainer: Trainer; step: 'title' | 'form' } | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatTrainer, setChatTrainer] = useState<Trainer | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, content: 'Chào bạn! Tôi có thể giúp gì cho bạn?', timestamp: '9:30 AM', isOwn: false },
    { id: 2, content: 'Dạ em muốn hỏi về lịch tập ạ', timestamp: '9:32 AM', isOwn: true },
    { id: 3, content: 'Được thôi, bạn muốn đặt lịch vào ngày nào?', timestamp: '9:33 AM', isOwn: false },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainerRes, discRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/staff/trainers?locationId=${user?.locationId || ''}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${getApiUrl()}/api/disciplines?locationId=${user?.locationId || ''}`)
        ]);
        const trainerData = await trainerRes.json();
        const discData = await discRes.json();
        if (Array.isArray(trainerData)) setTrainers(trainerData);
        if (discData?.data && Array.isArray(discData.data)) setDisciplines(discData.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredTrainers = selectedDiscipline === 'all'
    ? trainers
    : trainers.filter(t => {
        const discName = disciplines.find(d => d._id === selectedDiscipline)?.name?.toLowerCase() || '';
        return t.disciplineId?._id === selectedDiscipline ||
          t.specialties?.some(s => s.toLowerCase() === discName) ||
          t.job?.name?.toLowerCase().includes(discName);
      });

  const handleReport = async () => {
    if (!reportModal || !reportReason.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${getApiUrl()}/api/reports`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: reportModal.trainer._id,
          title: reportTitle,
          reason: reportReason
        })
      });
      alert('Gửi báo cáo thành công!');
      setReportModal(null);
      setReportTitle('');
      setReportReason('');
    } catch (e) {
      alert('Lỗi gửi báo cáo');
    }
    setSubmitting(false);
  };

  const openChat = (trainer: Trainer) => {
    setChatTrainer(trainer);
    setChatMessages([
      { id: 1, content: `Chào bạn! Tôi là ${trainer.fullName}, tôi có thể giúp gì cho bạn?`, timestamp: 'Vừa xong', isOwn: false },
    ]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: chatMessages.length + 1,
      content: chatInput,
      timestamp: 'Vừa xong',
      isOwn: true
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: prev.length + 1,
        content: 'Cảm ơn bạn đã liên hệ! Tôi sẽ phản hồi sớm nhất.',
        timestamp: 'Vừa xong',
        isOwn: false
      }]);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Đặt lịch / Liên hệ HLV</h1>
          <p className="text-slate-600">Chọn huấn luyện viên phù hợp với mục tiêu của bạn</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Đang tải...</div>
        ) : (
          <>
            <div className="max-w-xs">
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Tất cả bộ môn</option>
                {disciplines.map((disc) => (
                  <option key={disc._id} value={disc._id}>{disc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer) => (
                <motion.div
                  key={trainer._id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative"
                >
                  <div className="absolute top-3 right-3 z-10">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModal({ trainer, step: 'title' });
                        }}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/dashboard/trainers/${trainer._id}`}>
                    <div className="relative h-64">
                      <img
                        src={trainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400'}
                        alt={trainer.fullName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-slate-900">{trainer.rating || 0}</span>
                        <span className="text-xs text-slate-500">({trainer.totalReviews || 0})</span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-6">
                    <Link to={`/dashboard/trainers/${trainer._id}`}>
                      <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-indigo-600 transition-colors">{trainer.fullName}</h3>
                    </Link>
                    <p className="text-indigo-600 text-sm font-medium mb-3">
                      {trainer.disciplineId?.name || trainer.job?.name || 'HLV'}
                    </p>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {trainer.description || 'Chưa có mô tả'}
                    </p>

                    {trainer.specialties && trainer.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {trainer.specialties.map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to={`/dashboard/trainers/${trainer._id}/book`} className="flex-1">
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
                          startIcon={<Calendar size={18} />}
                        >
                          Đặt lịch tập
                        </Button>
                      </Link>
                      <Button
                        variant="outlined"
                        onClick={() => openChat(trainer)}
                        startIcon={<MessageCircle size={18} />}
                        sx={{ borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' }, textTransform: 'none', whiteSpace: 'nowrap' }}
                      >
                        Liên hệ HLV
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTrainers.length === 0 && (
              <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
                Không có huấn luyện viên nào
              </div>
            )}
          </>
        )}

        {/* Chat Modal */}
        {chatTrainer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setChatTrainer(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full h-[600px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={chatTrainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=100'}
                    alt={chatTrainer.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">{chatTrainer.fullName}</h3>
                    <p className="text-sm text-green-600">Đang hoạt động</p>
                  </div>
                </div>
                <button onClick={() => setChatTrainer(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                      <div className={`p-4 rounded-2xl ${msg.isOwn ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-slate-500 mt-1 ${msg.isOwn ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                  />
                  <button onClick={sendChatMessage} disabled={!chatInput.trim()}
                    className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReportModal(null)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  Báo cáo HLV
                </h3>
                <button onClick={() => setReportModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportModal.step === 'title' ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 mb-4">Chọn lý do báo cáo {reportModal.trainer.fullName}:</p>
                  {['Spam', 'Quấy rối', 'Thông tin sai lệch', 'Hành vi không phù hợp', 'Khác'].map(title => (
                    <button
                      key={title}
                      onClick={() => { setReportTitle(title); setReportModal({ ...reportModal, step: 'form' }); }}
                      className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium text-slate-700"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Lý do: <span className="text-indigo-600">{reportTitle}</span></p>
                    <textarea
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      placeholder="Nhập chi tiết lý do báo cáo..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outlined" onClick={() => setReportModal({ ...reportModal, step: 'title' })}
                      sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}>
                      Quay lại
                    </Button>
                    <Button variant="contained" onClick={handleReport} disabled={!reportReason.trim() || submitting}
                      startIcon={<Send size={16} />}
                      sx={{ flex: 1, textTransform: 'none', borderRadius: 2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
                      {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
