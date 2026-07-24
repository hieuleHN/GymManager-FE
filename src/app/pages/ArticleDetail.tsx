import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Calendar, Eye, ArrowLeft, ChevronRight, FileText, User } from 'lucide-react';
import { getApiUrl } from '../context/AuthContext';

interface Article {
  _id: string;
  title: string;
  content: string;
  image: string;
  category: string;
  authorName: string;
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

export function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/articles/${id}`);
      const data = await res.json();
      setArticle(data);

      await fetch(`${getApiUrl()}/api/articles/${id}/view`, { method: 'POST' });

      if (data.category) {
        const relRes = await fetch(`${getApiUrl()}/api/articles/${id}/related?category=${data.category}&limit=3`);
        const relData = await relRes.json();
        setRelated(Array.isArray(relData) ? relData : []);
      }
    } catch { }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">Không tìm thấy bài viết</p>
          <Link to="/articles" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" className="hover:text-indigo-600">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/articles" className="hover:text-indigo-600">Bài viết</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium truncate max-w-[200px]">{article.title}</span>
        </nav>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {article.image && (
            <div className="h-72 md:h-96 overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                {categoryLabels[article.category] || 'Khác'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.views} lượt xem
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
              {article.title}
            </h1>

            {article.authorName && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
                <User className="w-4 h-4" />
                <span>{article.authorName}</span>
              </div>
            )}

            <div
              className="prose prose-lg max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="mt-10 pt-6 border-t border-slate-100">
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách bài viết
              </Link>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item._id}
                  to={`/articles/${item._id}`}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="h-36 bg-slate-100 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500">{formatDate(item.publishedAt || item.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
