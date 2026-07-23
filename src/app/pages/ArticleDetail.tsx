import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Calendar, Eye, Clock, User, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';

const API_URL = '';

const CATEGORY_LABELS: Record<string, string> = {
  'tin-tuc': 'Tin tức',
  'meo-tap': 'Mẹo tập',
  'dinh-duong': 'Dinh dưỡng',
  'su-kien': 'Sự kiện',
  'khac': 'Khác',
};

export function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/api/articles/${id}`)
      .then(data => {
        setArticle(data);
        api.get<any>(`/api/articles/${id}/related?category=${data.category || 'tin-tuc'}&limit=4`)
          .then(rel => setRelated(rel || []))
          .catch(() => {});
        api.post(`/api/articles/${id}/view`).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Đang tải...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy bài viết</h2>
          <Link to="/" className="text-indigo-600 hover:underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {article.image && (
            <div className="w-full h-[400px] overflow-hidden">
              <img src={`${API_URL}${article.image}`} alt={article.title}
                className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                {CATEGORY_LABELS[article.category] || article.category}
              </span>
              {article.status === 'published' && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                  Đã đăng
                </span>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.authorName || 'Admin'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(article.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.views || 0} lượt xem
              </span>
              {article.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Đăng lúc: {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(r => (
                <Link key={r._id} to={`/articles/${r._id}`}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {r.image && (
                    <div className="h-40 overflow-hidden">
                      <img src={`${API_URL}${r.image}`} alt={r.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-xs font-semibold text-indigo-600">{CATEGORY_LABELS[r.category]}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{r.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <Eye className="w-3 h-3" />{r.views || 0}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
