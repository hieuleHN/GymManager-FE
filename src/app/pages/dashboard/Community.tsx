import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Send } from 'lucide-react';
import { useState } from 'react';

const posts = [
  {
    id: 1,
    author: {
      name: 'Nguyễn Thùy Anh',
      avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=100',
      role: 'Huấn luyện viên'
    },
    content: 'Chúc mừng các bạn đã hoàn thành thử thách 30 ngày tập luyện! Sự kiên trì của các bạn thật đáng ngưỡng mộ. Hãy tiếp tục duy trì nhé! 💪',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600',
    likes: 124,
    comments: 18,
    shares: 5,
    timestamp: '2 giờ trước'
  },
  {
    id: 2,
    author: {
      name: 'Trần Minh Khoa',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
      role: 'Hội viên'
    },
    content: 'Sau 3 tháng tập luyện tại ZenFitness, mình đã giảm được 8kg! Cảm ơn các HLV đã hỗ trợ nhiệt tình.',
    likes: 89,
    comments: 12,
    shares: 3,
    timestamp: '5 giờ trước'
  },
  {
    id: 3,
    author: {
      name: 'Lê Phương Anh',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
      role: 'Hội viên'
    },
    content: 'Buổi tập Yoga sáng nay thật tuyệt vời! Ai cũng nên thử lớp của cô Thùy Anh nhé 🧘‍♀️',
    likes: 56,
    comments: 8,
    shares: 2,
    timestamp: '1 ngày trước'
  }
];

export function Community() {
  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});

  const handlePost = () => {
    if (newPost.trim()) {
      // Handle post creation
      setNewPost('');
    }
  };

  const handleComment = (postId: number) => {
    if (commentText[postId]?.trim()) {
      // Handle comment creation
      setCommentText({ ...commentText, [postId]: '' });
    }
  };

  const toggleComments = (postId: number) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cộng đồng</h1>
          <p className="text-slate-600">Kết nối và chia sẻ với cộng đồng ZenFitness</p>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Ảnh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <Video className="w-5 h-5" />
                <span className="text-sm font-medium">Video</span>
              </button>
            </div>
            <Button
              variant="contained"
              onClick={handlePost}
              disabled={!newPost.trim()}
              sx={{
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                textTransform: 'none',
                borderRadius: 2,
                px: 4
              }}
            >
              Đăng bài
            </Button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{post.author.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{post.author.role}</span>
                    <span>•</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-slate-700 mb-4">{post.content}</p>

              {/* Post Image */}
              {post.image && (
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full rounded-xl mb-4 object-cover max-h-96"
                />
              )}

              {/* Post Stats */}
              <div className="flex items-center gap-4 py-3 border-y border-slate-100 text-sm text-slate-600">
                <span>{post.likes} lượt thích</span>
                <span>{post.comments} bình luận</span>
                <span>{post.shares} chia sẻ</span>
              </div>

              {/* Post Actions */}
              <div className="flex items-center gap-2 pt-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Heart className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Thích</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Bình luận</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Share2 className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Chia sẻ</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                      alt="You"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        placeholder="Viết bình luận..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentText[post.id]?.trim()}
                        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}