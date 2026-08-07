import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Calendar, Eye, FileText } from 'lucide-react';
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

const categoryColors: Record<string, string> = {
  'tin-tuc': 'bg-blue-100 text-blue-700',
  'meo-tap': 'bg-green-100 text-green-700',
  'dinh-duong': 'bg-orange-100 text-orange-700',
  'su-kien': 'bg-purple-100 text-purple-700',
  'khac': 'bg-slate-100 text-slate-700'
};

export function Articles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchArticles();
  }, [page, category]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '12' });
      if (category) params.set('category', category);
      const res = await fetch(`${getApiUrl()}/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch { }
    setLoading(false);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Bài viết</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Cập nhật kiến thức thể hình, dinh dưỡng và các sự kiện mới nhất từ ZENFITNESS
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <button
            onClick={() => { setCategory(''); setPage(1); setSearchParams({}); }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!category ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            Tất cả
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setCategory(key); setPage(1); setSearchParams({ category: key }); }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${category === key ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Đang tải bài viết...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Chưa có bài viết nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article._id}
                to={`/articles/${article._id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="h-48 bg-slate-100 overflow-hidden">
                  {article.image ? (
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <FileText className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${categoryColors[article.category] || categoryColors['khac']}`}>
                    {categoryLabels[article.category] || 'Khác'}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {stripHtml(article.content)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {article.views} lượt xem
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-50 hover:bg-slate-100"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${p === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 hover:bg-slate-100'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-50 hover:bg-slate-100"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
