import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, Calendar, User, Search, X, Image as ImageIcon, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Button } from '@mui/material';

interface Article {
  _id: string;
  title: string;
  content: string;
  image: string;
  category: string;
  authorName: string;
  authorId: string;
  status: string;
  views: number;
  publishedAt: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  'tin-tuc': 'Tin tức',
  'meo-tap': 'Mẹo tập',
  'dinh-duong': 'Dinh dưỡng',
  'su-kien': 'Sự kiện',
  'khac': 'Khác'
};

const statusLabels: Record<string, string> = {
  'draft': 'Bản nháp',
  'published': 'Đã đăng',
  'hidden': 'Đã ẩn'
};

const statusColors: Record<string, string> = {
  'draft': 'bg-gray-100 text-gray-700',
  'published': 'bg-green-100 text-green-700',
  'hidden': 'bg-red-100 text-red-700'
};

export function ArticleManagement() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('tin-tuc');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const res = await fetch(`${getApiUrl()}/api/articles?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data?.data) {
        setArticles(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, statusFilter, categoryFilter]);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('tin-tuc');
    setFormImage(null);
    setFormImagePreview('');
    setFormImageUrl('');
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (article: Article) => {
    setFormTitle(article.title);
    setFormContent(article.content);
    setFormCategory(article.category);
    setFormImageUrl(article.image || '');
    setFormImagePreview(article.image || '');
    setEditingId(article._id);
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setFormImagePreview(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle);
      formData.append('content', formContent);
      formData.append('category', formCategory);
      if (formImage) formData.append('image', formImage);
      else if (formImageUrl) formData.append('image', formImageUrl);
      formData.append('authorName', user?.fullName || user?.username || '');
      formData.append('status', 'published');

      const url = editingId
        ? `${getApiUrl()}/api/articles/${editingId}`
        : `${getApiUrl()}/api/articles`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: formData
      });

      if (res.ok) {
        resetForm();
        fetchArticles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await fetch(`${getApiUrl()}/api/articles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (article: Article) => {
    try {
      const action = article.status === 'published' ? 'unpublish' : 'publish';
      await fetch(`${getApiUrl()}/api/articles/${article._id}/${action}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
            <p className="text-slate-600 mt-2">Quản lý bài viết tin tức, kiến thức</p>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm bài viết
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã đăng</option>
            <option value="draft">Bản nháp</option>
            <option value="hidden">Đã ẩn</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Chưa có bài viết nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Bài viết</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Danh mục</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Trạng thái</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Tác giả</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Lượt xem</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Ngày đăng</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((article) => (
                    <tr key={article._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                            {article.image ? (
                              <img src={article.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[250px]">{article.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          {categoryLabels[article.category] || 'Khác'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[article.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[article.status] || article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="w-3.5 h-3.5" />
                          {article.authorName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                          <Eye className="w-3.5 h-3.5" />
                          {article.views}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(article.publishedAt || article.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(article)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              article.status === 'published'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {article.status === 'published' ? 'Ẩn' : 'Đăng'}
                          </button>
                          <button
                            onClick={() => openEditForm(article)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(article._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Trước
              </button>
              <span className="text-sm text-slate-600">Trang {page}/{totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Danh mục</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ảnh đại diện</label>
                <label className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {formImagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img src={formImagePreview} alt="" className="w-40 h-28 object-cover rounded-xl" />
                    <button
                      onClick={() => { setFormImage(null); setFormImagePreview(''); setFormImageUrl(''); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nội dung</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Viết nội dung bài viết (hỗ trợ HTML)..."
                  rows={12}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">Có thể sử dụng thẻ HTML để định dạng nội dung</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!formTitle.trim() || !formContent.trim() || submitting}
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Đăng bài'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
