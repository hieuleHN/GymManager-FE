import { DashboardLayout } from '../../components/DashboardLayout';
import { Heart, MessageCircle, Calendar, User, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Profile {
  _id: string;
  fullName: string;
  avatar: string;
  bio: string;
  gender: string;
  registerDate: string;
  status: string;
}

interface Post {
  _id: string;
  content: string;
  images: string[];
  likes: { userId: string }[];
  commentCount: number;
  createdAt: string;
}

export function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/customers/profile/${id}`),
          fetch(`${getApiUrl()}/api/community/posts/author/${id}/Customer`, {
            headers: getAuthHeaders()
          })
        ]);
        const profileData = await profileRes.json();
        const postsData = await postsRes.json();
        if (!profileData.error) setProfile(profileData);
        if (postsData?.data) setPosts(postsData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-slate-500">Không tìm thấy hội viên!</p>
          <button onClick={() => navigate('/dashboard/community')}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium">
            Quay lại cộng đồng
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-6">
            <img
              src={profile.avatar
                ? `${getApiUrl()}/uploads/customers/${profile.avatar}`
                : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'}
              alt={profile.fullName}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-indigo-100"
            />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{profile.fullName}</h1>
              <p className="text-indigo-600 font-medium mt-1">Hội viên</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Tham gia: {new Date(profile.registerDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{profile.gender || 'Chưa cập nhật'}</span>
                </div>
              </div>
              {profile.bio && (
                <p className="mt-3 text-slate-700">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Bài viết ({posts.length})</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <p className="text-slate-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((img, idx) => (
                      <img key={idx} src={`${getApiUrl()}/uploads/community/${img}`} alt=""
                        className="w-full rounded-xl object-cover max-h-80" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <span>{post.commentCount || 0} bình luận</span>
                  <span className="ml-auto">{formatDate(post.createdAt)}</span>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-slate-500 py-10">Chưa có bài viết nào</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
