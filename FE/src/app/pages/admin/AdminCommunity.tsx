import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Post {
  _id: string;
  authorId: { _id: string; fullName: string; avatar?: string; [key: string]: any };
  authorModel: 'Customer' | 'Staff';
  content: string;
  images: string[];
  likes: { userId: string }[];
  commentCount: number;
  shareCount: number;
  status: string;
  createdAt: string;
}

export function AdminCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/community/posts`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data?.data) {
        const enriched = await Promise.all(data.data.map(async (post: any) => {
          const author = await fetchAuthor(post.authorId, post.authorModel);
          return { ...post, authorId: author };
        }));
        setPosts(enriched);
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
        return { _id: data._id, fullName: data.fullName, avatar: data.avatar || '' };
      }
    } catch {
      return { _id: authorId, fullName: 'Unknown', avatar: '' };
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/community/comments/post/${postId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data?.data) {
        const enriched = await Promise.all(data.data.map(async (c: any) => {
          const author = await fetchAuthor(c.authorId, c.authorModel);
          return { ...c, authorId: author };
        }));
        setComments(prev => ({ ...prev, [postId]: enriched }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImagePreviews(prev => [...prev, ev.target.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const form = new FormData();
      form.append('content', newPost);
      form.append('type', 'announcement');
      selectedImages.forEach(img => form.append('images', img));

      const res = await fetch(`${getApiUrl()}/api/community/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: form
      });
      if (res.ok) {
        setNewPost('');
        setSelectedImages([]);
        setImagePreviews([]);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

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

  const handleToggleComment = (postId: string) => {
    const newVal = !showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: newVal }));
    if (newVal && !comments[postId]) fetchComments(postId);
  };

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
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cộng đồng</h1>
          <p className="text-slate-600">Quản lý bài viết cộng đồng ZenFitness</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Tạo thông báo mới..."
            className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt="" className="w-24 h-24 object-cover rounded-lg" />
                  <button onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
            <Button variant="contained" onClick={handlePost} disabled={!newPost.trim() || posting}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
              {posting ? 'Đang đăng...' : 'Đăng bài'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map((post) => {
            const author = post.authorId as any;
            const authorName = author?.fullName || 'Unknown';
            const authorAvatar = author?.avatar
              ? `${getApiUrl()}/uploads/customers/${author.avatar}`
              : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100';

            return (
              <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={authorAvatar} alt={authorName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{authorName}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{post.authorModel === 'Staff' ? 'Nhân viên' : 'Hội viên'}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(post._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((img, idx) => (
                      <img key={idx} src={`${getApiUrl()}/uploads/community/${img}`} alt=""
                        className="w-full rounded-xl object-cover max-h-96" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 py-3 border-y border-slate-100 text-sm text-slate-600">
                  <span>{post.likes?.length || 0} lượt thích</span>
                  <span>{post.commentCount || 0} bình luận</span>
                  <span>{post.shareCount || 0} chia sẻ</span>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50">
                    <Heart className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Thích</span>
                  </button>
                  <button onClick={() => handleToggleComment(post._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50">
                    <MessageCircle className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Bình luận</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50">
                    <Share2 className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Chia sẻ</span>
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {comments[post._id]?.map((comment) => {
                      const cAuthor = comment.authorId as any;
                      const cAvatar = cAuthor?.avatar
                        ? `${getApiUrl()}/uploads/customers/${cAuthor.avatar}`
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';
                      return (
                        <div key={comment._id} className="flex gap-3">
                          <img src={cAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2">
                            <p className="text-sm font-bold text-slate-900">{cAuthor?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
