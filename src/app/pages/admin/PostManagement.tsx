import { useState, useEffect } from 'react';
import { FileText, Bell, Eye, Edit2, Trash2, Plus, X, Send, Save, Image as ImageIcon, Search, ChevronDown } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { api } from '../../../lib/api';

const CATEGORIES = [
  { value: 'tin-tuc', label: 'Tin tức' },
  { value: 'meo-tap', label: 'Mẹo tập' },
  { value: 'dinh-duong', label: 'Dinh dưỡng' },
  { value: 'su-kien', label: 'Sự kiện' },
  { value: 'khac', label: 'Khác' },
];

export function PostManagement() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: 'tin-tuc', image: '', status: 'draft' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const API_URL = '';

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/api/articles?status=all&sort=newest');
      setArticles(res.data || []);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', content: '', category: 'tin-tuc', image: '', status: 'draft' });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (article: any) => {
    setEditingId(article._id);
    setForm({
      title: article.title || '',
      content: article.content || '',
      category: article.category || 'tin-tuc',
      image: article.image || '',
      status: article.status || 'draft',
    });
    setImagePreview(article.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('category', form.category);
      fd.append('status', form.status);
      if (imageFile) fd.append('image', imageFile);
      else fd.append('image', form.image);

      if (editingId) {
        await api.upload(`/api/articles/${editingId}`, fd, 'PUT');
      } else {
        await api.upload('/api/articles', fd);
      }
      setShowModal(false);
      fetchArticles();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/api/articles/${id}/publish`);
      fetchArticles();
    } catch { }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.put(`/api/articles/${id}/unpublish`);
      fetchArticles();
    } catch { }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await api.delete(`/api/articles/${id}`);
      fetchArticles();
    } catch { }
  };

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Đã đăng</span>;
      case 'draft': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Bản nháp</span>;
      case 'hidden': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Ẩn</span>;
      default: return null;
    }
  };

  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
            <p className="text-slate-600 mt-1">Tạo và quản lý các bài viết, thông báo</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
            <Plus className="w-5 h-5" />
            Tạo bài viết
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text" placeholder="Tìm kiếm bài viết..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Chưa có bài viết nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filtered.map(article => (
                <div key={article._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {article.image ? (
                        <img src={`${API_URL}${article.image}`} alt=""
                          className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <FileText className="w-8 h-8 text-indigo-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{article.title}</h3>
                          {statusBadge(article.status)}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-2">{article.content?.replace(/<[^>]*>/g, '').substring(0, 150)}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-medium text-indigo-600">{categoryLabel(article.category)}</span>
                          <span>•</span>
                          <span>{article.authorName || 'Admin'}</span>
                          <span>•</span>
                          <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {article.status === 'draft' && (
                        <button onClick={() => handlePublish(article._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Đăng bài">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {article.status === 'published' && (
                        <button onClick={() => handleUnpublish(article._id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Ẩn bài">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(article)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(article._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Sửa bài viết' : 'Tạo bài viết mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề</label>
                <input
                  type="text" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-500">Chọn ảnh</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview.startsWith('blob:') ? imagePreview : `${API_URL}${imagePreview}`}
                        alt="" className="w-16 h-16 rounded-lg object-cover" />
                      <button onClick={() => { setImagePreview(''); setImageFile(null); setForm({ ...form, image: '' }); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nội dung</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Nhập nội dung bài viết..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, status: 'draft' })}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-600'}`}>
                  Lưu nháp
                </button>
                <button
                  onClick={() => setForm({ ...form, status: 'published' })}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${form.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  Đăng ngay
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Hủy
                </button>
                <button onClick={handleSave} disabled={saving || !form.title || !form.content}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50">
                  {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo bài viết')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
