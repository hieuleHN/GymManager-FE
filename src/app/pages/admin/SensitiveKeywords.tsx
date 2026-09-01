import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Search, Trash2, ToggleLeft, ToggleRight, Shield, Loader2, Pencil, X, Check } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Keyword {
  _id: string;
  keyword: string;
  normalized: string;
  level: 'low' | 'high';
  enabled: boolean;
  note: string;
  createdAt: string;
}

export function SensitiveKeywords() {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newLevel, setNewLevel] = useState<'high' | 'low'>('high');
  const [newNote, setNewNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const isAdmin = user?.isAdmin === true;

  const fetchKeywords = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/sensitive-keywords`, { headers: getAuthHeaders() });
      if (res.ok) {
        setKeywords(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-500">Bạn không có quyền truy cập trang này.</div>
      </AdminLayout>
    );
  }

  const handleAdd = async () => {
    const kw = newKeyword.trim();
    if (!kw) {
      toast.error('Vui lòng nhập từ khoá!');
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/sensitive-keywords`, {
        method: 'POST',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ keyword: kw, level: newLevel, note: newNote })
      });
      if (res.ok) {
        toast.success(`Đã thêm từ khoá "${kw}"`);
        setNewKeyword('');
        setNewNote('');
        setShowAdd(false);
        fetchKeywords();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Thêm thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const handleToggle = async (kw: Keyword) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/sensitive-keywords/${kw._id}`, {
        method: 'PUT',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ keyword: kw.keyword, level: kw.level, enabled: !kw.enabled, note: kw.note })
      });
      if (res.ok) {
        fetchKeywords();
      } else {
        toast.error('Cập nhật thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const handleDelete = async (kw: Keyword) => {
    if (!window.confirm(`Xoá từ khoá "${kw.keyword}"?`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/sensitive-keywords/${kw._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success('Đã xoá từ khoá!');
        fetchKeywords();
      } else {
        toast.error('Xoá thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const handleSaveEdit = async (kw: Keyword) => {
    const text = editText.trim();
    if (!text) {
      toast.error('Từ khoá không được rỗng!');
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/sensitive-keywords/${kw._id}`, {
        method: 'PUT',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ keyword: text, level: kw.level, enabled: kw.enabled, note: kw.note })
      });
      if (res.ok) {
        toast.success('Đã cập nhật!');
        setEditing(null);
        fetchKeywords();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Cập nhật thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const filtered = keywords.filter((k) => {
    const q = search.toLowerCase();
    return k.keyword.toLowerCase().includes(q) || k.normalized.toLowerCase().includes(q);
  });

  const activeCount = keywords.filter((k) => k.enabled).length;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" /> Quản lý từ khoá cấm
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Các từ khoá bị phát hiện sẽ được đánh dấu trong giám sát tin nhắn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5">
              {activeCount} / {keywords.length} đang bật
            </span>
            <button
              onClick={() => setShowAdd((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={16} /> Thêm từ khoá
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Thêm từ khoá mới</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Từ khoá *</label>
                <input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="VD: hẹn hò, yêu nhau..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Mức độ</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as 'high' | 'low')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="high">Cao (cảnh báo ngay)</option>
                  <option value="low">Thấp (chỉ ghi nhận)</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-slate-500 mb-1 block">Ghi chú (tuỳ chọn)</label>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="VD: nghi ngờ HLV - hội viên hẹn hò"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Lưu từ khoá
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm từ khoá..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400">Không có từ khoá nào</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((kw) => (
                <div key={kw._id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    {editing === kw._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(kw)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Lưu"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                          title="Huỷ"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${kw.enabled ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                            {kw.keyword}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kw.level === 'high' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'}`}>
                            {kw.level === 'high' ? 'Cao' : 'Thấp'}
                          </span>
                          {kw.note && (
                            <span className="text-xs text-slate-400 truncate max-w-[240px]">{kw.note}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Chuẩn hoá: {kw.normalized}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(kw._id);
                        setEditText(kw.keyword);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleToggle(kw)}
                      className={`p-2 rounded-lg transition-colors ${kw.enabled ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}
                      title={kw.enabled ? 'Tắt' : 'Bật'}
                    >
                      {kw.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(kw)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
