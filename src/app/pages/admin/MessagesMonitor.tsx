import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { toast } from 'sonner';
import {
  Shield, Search, MessageCircle, AlertTriangle, Loader2, X, Trash2,
  Check, Eye, Filter, MapPin, Users, Flag, FileText, ImageIcon
} from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

interface Conversation {
  key: string;
  id_hoi_vien: string;
  id_huan_luyen_vien: string | null;
  loai: string;
  memberName: string;
  memberAccount: string;
  memberAvatar: string;
  memberLocationId: string | null;
  staffName: string | null;
  staffRole: string | null;
  lastMessage: string;
  lastTime: string;
  lastSender: string;
  flaggedCount: number;
  totalCount: number;
  flagReasons: string[];
}

interface TranscriptMsg {
  _id: string;
  noi_dung: string;
  nguoi_gui_tin_nhan: string;
  thoi_gian_gui: string;
  loai_tin_nhan?: string;
  flagged?: boolean;
  flag_reasons?: { keyword: string; level: string }[];
  flag_status?: string;
  da_thu_hoi?: boolean;
  attachment?: { fileName: string; fileType: string; fileUrl: string };
  attachments?: { fileName: string; fileType: string; fileUrl: string }[];
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  flaggedMessages: number;
  pendingFlags: number;
  highFlags: number;
  lowFlags: number;
  byLocation: { locationId: string; name: string; count: number }[];
  flaggedByLocation: { locationId: string; name: string; count: number }[];
  byStaff: { name: string; count: number }[];
  byDay: { day: string; count: number }[];
}

export function MessagesMonitor() {
  const { user } = useAuth();
  const { clubs } = useClub();
  const isAdmin = user?.isAdmin === true;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptMsg[] | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  const [filter, setFilter] = useState({
    loai: 'all',
    flagStatus: 'all',
    level: 'all',
    keyword: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.loai !== 'all') params.set('loai', filter.loai);
      if (filter.flagStatus !== 'all') params.set('flagStatus', filter.flagStatus);
      if (filter.level !== 'all') params.set('level', filter.level);
      if (filter.keyword.trim()) params.set('keyword', filter.keyword.trim());
      const qs = params.toString();

      const [convRes, statsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/messages-monitor/conversations${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/messages-monitor/stats`, { headers: getAuthHeaders() })
      ]);
      if (convRes.ok) setConversations(await convRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-500">Bạn không có quyền truy cập trang này.</div>
      </AdminLayout>
    );
  }

  const openTranscript = async (conv: Conversation) => {
    setActiveConv(conv);
    setTranscript(null);
    const params = new URLSearchParams({
      memberId: conv.id_hoi_vien,
      loai: conv.loai
    });
    if (conv.id_huan_luyen_vien) params.set('staffId', conv.id_huan_luyen_vien);
    try {
      const res = await fetch(`${getApiUrl()}/api/messages-monitor/transcript?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) setTranscript(await res.json());
    } catch {
      toast.error('Không tải được transcript!');
    }
  };

  const handleResolve = async (msgId: string, status: 'resolved' | 'ignored') => {
    try {
      const res = await fetch(`${getApiUrl()}/api/messages-monitor/resolve`, {
        method: 'POST',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ messageId: msgId, status })
      });
      if (res.ok) {
        toast.success(status === 'resolved' ? 'Đã đánh dấu xử lý xong!' : 'Đã bỏ qua!');
        if (activeConv) openTranscript(activeConv);
        fetchData();
      } else {
        toast.error('Xử lý thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (!window.confirm('Xoá vĩnh viễn tin nhắn này khỏi hệ thống?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/messages-monitor/messages/${msgId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success('Đã xoá tin nhắn!');
        if (activeConv) openTranscript(activeConv);
        fetchData();
      } else {
        toast.error('Xoá thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const clubName = (id: string | null) => {
    if (!id) return '—';
    return clubs.find((c) => c._id === id)?.address || 'Cơ sở';
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    return new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Giám sát tin nhắn
          </h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi toàn bộ cuộc trò chuyện giữa HLV / lễ tân với hội viên</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setFilter((p) => ({ ...p, flagStatus: 'all', level: 'all' }))}
              className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                filter.flagStatus === 'all' && filter.level === 'all' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1"><MessageCircle size={14} /> Tổng cuộc trò chuyện</div>
              <div className="text-2xl font-black text-slate-900">{stats.totalConversations}</div>
            </button>
            <button
              onClick={() => setFilter((p) => ({ ...p, flagStatus: 'all', level: 'high' }))}
              className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                filter.level === 'high' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-1"><AlertTriangle size={14} /> Vi phạm cấp độ cao</div>
              <div className="text-2xl font-black text-red-600">{stats.highFlags}</div>
            </button>
            <button
              onClick={() => setFilter((p) => ({ ...p, flagStatus: 'all', level: 'low' }))}
              className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                filter.level === 'low' ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-sky-500 text-xs font-medium mb-1"><AlertTriangle size={14} /> Vi phạm cấp độ thấp</div>
              <div className="text-2xl font-black text-sky-600">{stats.lowFlags}</div>
            </button>
            <button
              onClick={() => setFilter((p) => ({ ...p, flagStatus: 'pending', level: 'all' }))}
              className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                filter.flagStatus === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-500 text-xs font-medium mb-1"><Flag size={14} /> Chờ xử lý</div>
              <div className="text-2xl font-black text-amber-600">{stats.pendingFlags}</div>
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filter.loai}
            onChange={(e) => setFilter((p) => ({ ...p, loai: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="truc_tiep">HLV - Hội viên</option>
            <option value="ho_tro">Hỗ trợ - Hội viên</option>
          </select>
          <select
            value={filter.flagStatus}
            onChange={(e) => setFilter((p) => ({ ...p, flagStatus: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="flagged">Có vi phạm</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="ignored">Đã bỏ qua</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filter.keyword}
              onChange={(e) => setFilter((p) => ({ ...p, keyword: e.target.value }))}
              placeholder="Tìm theo tên hội viên / HLV..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Đang tải...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Không có cuộc trò chuyện nào phù hợp</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <div key={conv.key} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => openTranscript(conv)}
                    className="flex-1 flex items-center gap-4 min-w-0 text-left"
                  >
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden">
                      {conv.memberAvatar ? (
                        <img src={conv.memberAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        conv.memberName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-slate-900 truncate">{conv.memberName}</span>
                          <span className="text-xs text-slate-400">↔</span>
                          <span className="font-semibold text-indigo-600 truncate">{conv.staffName || 'Chưa có nhân viên'}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${conv.loai === 'ho_tro' ? 'bg-sky-100 text-sky-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {conv.loai === 'ho_tro' ? 'Hỗ trợ' : 'Trực tiếp'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">{formatTime(conv.lastTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={11} className="text-slate-300 flex-shrink-0" />
                        <span className="text-xs text-slate-400 truncate">{clubName(conv.memberLocationId)}</span>
                        {conv.staffRole && (
                          <>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-400 truncate">{conv.staffRole}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 truncate mt-1">
                        <span className={`font-medium ${conv.lastSender === 'hoi_vien' ? 'text-slate-800' : 'text-indigo-600'}`}>
                          {conv.lastSender === 'hoi_vien' ? conv.memberName : conv.staffName}:
                        </span>{" "}
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conv.flaggedCount > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <AlertTriangle size={10} /> {conv.flaggedCount} vi phạm
                        </span>
                        <span className="text-[10px] text-slate-400 max-w-[140px] truncate">
                          {conv.flagReasons.join(', ')}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => openTranscript(conv)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem transcript"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {activeConv && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setActiveConv(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Shield size={15} className="text-indigo-600" />
                  {activeConv.memberName} ↔ {activeConv.staffName || 'Chưa có nhân viên'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeConv.loai === 'ho_tro' ? 'Hỗ trợ' : 'Trực tiếp'} • {clubName(activeConv.memberLocationId)} • {activeConv.totalCount} tin
                </p>
              </div>
              <button
                onClick={() => setActiveConv(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {!transcript ? (
                <div className="text-center text-slate-400 py-8">
                  <Loader2 className="w-5 h-5 animate-spin inline-block" />
                </div>
              ) : transcript.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Chưa có tin nhắn</div>
              ) : (
                transcript.map((msg) => {
                  const isMember = msg.nguoi_gui_tin_nhan === 'hoi_vien';
                  const flagged = msg.flagged;
                  const pending = flagged && msg.flag_status !== 'resolved' && msg.flag_status !== 'ignored';
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMember ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 border ${
                          flagged
                            ? 'bg-red-50 border-red-200'
                            : isMember
                              ? 'bg-white border-slate-200'
                              : 'bg-indigo-600 text-white border-indigo-600'
                        }`}
                      >
                        <div className={`flex items-center justify-between gap-3 mb-1`}>
                          <span className={`text-[10px] font-semibold ${flagged ? 'text-red-500' : isMember ? 'text-slate-400' : 'text-indigo-100'}`}>
                            {isMember ? activeConv.memberName : activeConv.staffName}
                          </span>
                          <span className={`text-[10px] ${flagged ? 'text-red-400' : isMember ? 'text-slate-400' : 'text-indigo-200'}`}>
                            {formatTime(msg.thoi_gian_gui)}
                          </span>
                        </div>

                        {flagged && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-100 rounded-lg px-2 py-1 mb-2">
                            <AlertTriangle size={12} />
                            Vi phạm: {(msg.flag_reasons || []).map((r) => r.keyword).join(', ')}
                          </div>
                        )}

                        {msg.da_thu_hoi ? (
                          <p className="italic opacity-70 text-sm">Tin nhắn đã thu hồi</p>
                        ) : msg.loai_tin_nhan === 'image' || msg.loai_tin_nhan === 'file' ? (
                          <div>
                            {msg.attachments && msg.attachments.length > 0 ? (
                              <div className="space-y-1">
                                {msg.attachments.map((a, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    {a.fileType.startsWith('image/') ? (
                                      <ImageIcon size={14} />
                                    ) : (
                                      <FileText size={14} />
                                    )}
                                    <a href={a.fileUrl} target="_blank" rel="noreferrer" className={`underline ${flagged ? 'text-red-500' : isMember ? 'text-indigo-600' : 'text-indigo-100'}`}>
                                      {a.fileName}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : msg.attachment ? (
                              <div className="flex items-center gap-2 text-sm">
                                {msg.attachment.fileType.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                                <a href={msg.attachment.fileUrl} target="_blank" rel="noreferrer" className="underline">{msg.attachment.fileName}</a>
                              </div>
                            ) : null}
                            {msg.noi_dung && <p className="text-sm mt-1">{msg.noi_dung}</p>}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.noi_dung}</p>
                        )}

                        {pending && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-100">
                            <button
                              onClick={() => handleResolve(msg._id, 'resolved')}
                              className="flex items-center gap-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Check size={12} /> Đã xử lý
                            </button>
                            <button
                              onClick={() => handleResolve(msg._id, 'ignored')}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Bỏ qua
                            </button>
                            <button
                              onClick={() => handleDeleteMsg(msg._id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={12} /> Xoá
                            </button>
                          </div>
                        )}

                        {flagged && !pending && (
                          <div className="mt-2 pt-2 border-t border-red-100 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{msg.flag_status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}</span>
                            <button
                              onClick={() => handleDeleteMsg(msg._id)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12} /> Xoá
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
