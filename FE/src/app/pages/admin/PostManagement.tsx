import { useState, useEffect } from 'react';
import { FileText, Users, Bell, Eye, Edit2, Trash2, Flag } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface PostItem {
  _id: string;
  content: string;
  title: string;
  authorId: any;
  authorModel: string;
  type: string;
  views: number;
  createdAt: string;
}

export function PostManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'member-posts'>('announcements');
  const [announcements, setAnnouncements] = useState<PostItem[]>([]);
  const [memberPosts, setMemberPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [announceRes, memberRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/community/posts?type=announcement`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/community/posts?type=member`, { headers: getAuthHeaders() })
      ]);
      const announceData = await announceRes.json();
      const memberData = await memberRes.json();

      if (announceData?.data) {
        const enriched = await Promise.all(announceData.data.map(async (p: any) => {
          const author = await fetchAuthor(p.authorId, p.authorModel);
          return { ...p, authorId: author };
        }));
        setAnnouncements(enriched);
      }
      if (memberData?.data) {
        const enriched = await Promise.all(memberData.data.map(async (p: any) => {
          const author = await fetchAuthor(p.authorId, p.authorModel);
          return { ...p, authorId: author };
        }));
        setMemberPosts(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthor = async (authorId: string, authorModel: string) => {
    try {
      if (authorModel === 'Customer') {
        const res = await fetch(`${getApiUrl()}/api/customers/profile/${authorId}`);
        return await res.json();
      } else {
        const res = await fetch(`${getApiUrl()}/api/staff/${authorId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        return { _id: data._id, fullName: data.fullName };
      }
    } catch {
      return { _id: authorId, fullName: 'Unknown' };
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await fetch(`${getApiUrl()}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const currentPosts = activeTab === 'announcements' ? announcements : memberPosts;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
            <p className="text-slate-600 mt-2">Quản lý thông báo và bài viết của cộng đồng</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-3 font-medium text-sm transition-all ${
              activeTab === 'announcements'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Danh sách thông báo
            </div>
          </button>
          <button
            onClick={() => setActiveTab('member-posts')}
            className={`px-6 py-3 font-medium text-sm transition-all ${
              activeTab === 'member-posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Danh sách bài viết hội viên
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'announcements' ? 'Thông báo' : 'Bài viết hội viên'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">Tổng cộng {currentPosts.length} bài viết</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {currentPosts.map((post) => {
              const author = post.authorId as any;
              const authorName = author?.fullName || 'Unknown';
              return (
                <div key={post._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-indigo-100 rounded-lg shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{post.content}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <span>Tác giả: <span className="font-semibold">{authorName}</span></span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views || 0} lượt xem
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleDelete(post._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {currentPosts.length === 0 && (
              <div className="p-10 text-center text-slate-500">Chưa có bài viết nào</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
