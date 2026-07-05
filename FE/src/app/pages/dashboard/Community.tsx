import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, MoreHorizontal, Flag, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { useNavigate } from 'react-router';

interface Post {
  _id: string;
  authorId: { _id: string; fullName: string; avatar?: string; account: string; [key: string]: any };
  authorModel: 'Customer' | 'Staff';
  content: string;
  images: string[];
  likes: { userId: string; userModel: string }[];
  commentCount: number;
  shareCount: number;
  views: number;
  status: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  authorId: { _id: string; fullName: string; avatar?: string; account: string; [key: string]: any };
  authorModel: 'Customer' | 'Staff';
  content: string;
  createdAt: string;
}

export function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [newPostImages, setNewPostImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<{ [key: string]: boolean }>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      console.error('Error fetching posts:', err);
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
        return { _id: data._id, fullName: data.fullName, avatar: data.avatar };
      }
    } catch {
      return { _id: authorId, fullName: 'Unknown', avatar: '' };
    }
  };

  const fetchComments = async (postId: string) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
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
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewPostImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImagePreviews(prev => [...prev, ev.target.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNewPostImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const form = new FormData();
      form.append('content', newPost);
      form.append('type', 'member');
      newPostImages.forEach(img => form.append('images', img));

      const res = await fetch(`${getApiUrl()}/api/community/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        setNewPost('');
        setNewPostImages([]);
        setImagePreviews([]);
        fetchPosts();
      } else {
        alert(data.error || 'Lỗi đăng bài!');
      }
    } catch (err) {
      alert('Lỗi kết nối!');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText[postId]?.trim()) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/community/comments/post/${postId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText[postId] })
      });
      if (res.ok) {
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        if (comments[postId]) fetchComments(postId);
        fetchPosts();
      }
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/dashboard/community`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(post.content)}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
    try {
      await fetch(`${getApiUrl()}/api/community/posts/${post._id}/share`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      fetchPosts();
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const toggleComments = (postId: string) => {
    const newVal = !showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: newVal }));
    if (newVal && !comments[postId]) fetchComments(postId);
  };

  const openReport = (postId: string) => {
    setOpenMenu(null);
    setReportPostId(postId);
    setReportTitle('');
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportTitle || !reportReason) return;
    setSubmittingReport(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/community/reports`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: reportPostId, title: reportTitle, reason: reportReason })
      });
      const data = await res.json();
      if (res.ok) {
        setShowReportModal(false);
        alert('Báo cáo thành công! Cảm ơn bạn đã đóng góp.');
      } else {
        alert(data.error || 'Lỗi báo cáo!');
      }
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const navigateToProfile = (authorId: string, authorModel: string) => {
    if (authorModel === 'Customer') {
      navigate(`/dashboard/profile/${authorId}`);
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cộng đồng</h1>
          <p className="text-slate-600">Kết nối và chia sẻ với cộng đồng ZenFitness</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                  <button onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
            <Button
              variant="contained"
              onClick={handlePost}
              disabled={!newPost.trim() || posting}
              sx={{
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                textTransform: 'none',
                borderRadius: 2,
                px: 4
              }}
            >
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
            const isLiked = post.likes?.some(l => l.userId === user?.id);

            return (
              <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => navigateToProfile(author._id, post.authorModel)}
                  />
                  <div className="flex-1">
                    <h3
                      className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigateToProfile(author._id, post.authorModel)}
                    >
                      {authorName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{post.authorModel === 'Staff' ? 'Nhân viên' : 'Hội viên'}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === post._id ? null : post._id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openMenu === post._id && (
                      <div ref={menuRef} className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1">
                        <button
                          onClick={() => openReport(post._id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Flag className="w-4 h-4 text-red-500" />
                          Báo cáo bài viết
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`${getApiUrl()}/uploads/community/${img}`}
                        alt="Post"
                        className="w-full rounded-xl object-cover max-h-96"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 py-3 border-y border-slate-100 text-sm text-slate-600">
                  <span>{post.likes?.length || 0} lượt thích</span>
                  <span>{post.commentCount || 0} bình luận</span>
                  <span>{post.shareCount || 0} chia sẻ</span>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${isLiked ? 'text-red-500 bg-red-50' : 'hover:bg-slate-50'}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                    <span className="font-medium text-slate-700">Thích</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Bình luận</span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Chia sẻ</span>
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {commentsLoading[post._id] ? (
                      <p className="text-sm text-slate-500 text-center">Đang tải bình luận...</p>
                    ) : (
                      comments[post._id]?.map((comment) => {
                        const cAuthor = comment.authorId as any;
                        const cAvatar = cAuthor?.avatar
                          ? `${getApiUrl()}/uploads/customers/${cAuthor.avatar}`
                          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';
                        return (
                          <div key={comment._id} className="flex gap-3">
                            <img
                              src={cAvatar}
                              alt={cAuthor?.fullName || 'User'}
                              className="w-8 h-8 rounded-full object-cover cursor-pointer"
                              onClick={() => navigateToProfile(cAuthor?._id, comment.authorModel)}
                            />
                            <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2">
                              <p
                                className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                                onClick={() => navigateToProfile(cAuthor?._id, comment.authorModel)}
                              >
                                {cAuthor?.fullName || 'Unknown'}
                              </p>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {(!comments[post._id] || comments[post._id].length === 0) && !commentsLoading[post._id] && (
                      <p className="text-sm text-slate-500 text-center">Chưa có bình luận</p>
                    )}
                    <div className="flex gap-3">
                      <img
                        src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                        alt="You"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentText[post._id] || ''}
                          onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                          placeholder="Viết bình luận..."
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleComment(post._id);
                          }}
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          disabled={!commentText[post._id]?.trim()}
                          className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Báo cáo bài viết</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề báo cáo</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="VD: Nội dung không phù hợp"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lý do báo cáo</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Mô tả chi tiết lý do báo cáo..."
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button
                variant="contained"
                onClick={submitReport}
                disabled={!reportTitle || !reportReason || submittingReport}
                fullWidth
                sx={{
                  bgcolor: '#dc2626',
                  '&:hover': { bgcolor: '#b91c1c' },
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                {submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
