import { useState } from 'react';
import { FileText, Users, Bell, Eye, Edit2, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export function PostManagement() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'member-posts'>('announcements');

  const announcements = [
    { id: '1', title: 'Thông báo bảo trì hệ thống', author: 'Admin', date: '2026-06-04', views: 245 },
    { id: '2', title: 'Lịch nghỉ lễ 2/9', author: 'PT Trần Văn B', date: '2026-06-03', views: 189 },
    { id: '3', title: 'Khai trương chi nhánh mới', author: 'Admin', date: '2026-06-02', views: 456 }
  ];

  const memberPosts = [
    { id: '1', title: 'Tìm đồ thất lạc', author: 'Nguyễn Văn A', date: '2026-06-04', views: 34 },
    { id: '2', title: 'Chia sẻ bài tập giảm cân', author: 'Lê Thị C', date: '2026-06-03', views: 128 },
    { id: '3', title: 'Review gói tập 6 tháng', author: 'Trần Văn D', date: '2026-06-02', views: 91 }
  ];

  const currentPosts = activeTab === 'announcements' ? announcements : memberPosts;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
        <p className="text-slate-600 mt-2">Quản lý thông báo và bài viết của cộng đồng</p>
      </div>

      {/* Tabs */}
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

      {/* Posts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'announcements' ? 'Thông báo' : 'Bài viết hội viên'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">Tổng cộng {currentPosts.length} bài viết</p>
          </div>
          {activeTab === 'announcements' && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
              Tạo thông báo mới
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-200">
          {currentPosts.map((post) => (
            <div key={post.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{post.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Tác giả: <span className="font-semibold">{post.author}</span></span>
                      <span>•</span>
                      <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views} lượt xem
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
