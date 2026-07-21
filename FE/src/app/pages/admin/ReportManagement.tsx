import { AdminLayout } from '../../components/AdminLayout';
import { Flag, CheckCircle, XCircle, EyeOff, RotateCcw, Trash2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Report {
  _id: string;
  reporterId: { _id: string; fullName: string; account: string };
  postId: { _id: string; content: string; images: string[]; authorId: any; status: string; createdAt: string };
  title: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function ReportManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `${getApiUrl()}/api/community/reports${filter ? `?status=${filter}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data?.data) setReports(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleHide = async (postId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/community/posts/${postId}/hide`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnhide = async (postId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/community/posts/${postId}/unhide`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await Promise.all([
        fetch(`${getApiUrl()}/api/community/posts/${postId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        }),
        fetch(`${getApiUrl()}/api/community/reports/${reportId}/resolve`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' })
        })
      ]);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/community/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/community/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      pending: { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-700' },
      resolved: { label: 'Đã xử lý', class: 'bg-green-100 text-green-700' },
      dismissed: { label: 'Đã bỏ qua', class: 'bg-slate-100 text-slate-600' }
    };
    const b = map[status];
    return b ? <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.class}`}>{b.label}</span> : null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý báo cáo</h1>
          <p className="text-slate-600 mt-2">Xử lý báo cáo từ cộng đồng</p>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'pending', label: 'Chờ xử lý' },
            { value: 'resolved', label: 'Đã xử lý' },
            { value: 'dismissed', label: 'Đã bỏ qua' }
          ].map((tab) => (
            <button key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-6 py-3 font-medium text-sm transition-all ${filter === tab.value
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Đang tải...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Không có báo cáo nào</div>
          ) : (
            reports.map((report) => {
              const postStatus = report.postId?.status;
              return (
                <div key={report._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Flag className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-slate-900">{report.title}</h3>
                        {statusBadge(report.status)}
                        {postStatus === 'hidden' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Bài viết đã ẩn</span>
                        )}
                      </div>

                      <div className="text-sm text-slate-600 space-y-2 mb-4">
                        <p><span className="font-semibold">Người báo cáo:</span> {report.reporterId?.fullName || report.reporterId?.account || 'Unknown'}</p>
                        <p><span className="font-semibold">Lý do:</span> {report.reason}</p>
                        <p><span className="font-semibold">Ngày báo cáo:</span> {formatDate(report.createdAt)}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Nội dung bài viết bị báo cáo:</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.postId?.content || 'Đã bị xóa'}</p>
                        {report.postId?.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {report.postId.images.map((img, idx) => (
                              <img key={idx} src={`${getApiUrl()}/uploads/community/${img}`} alt=""
                                className="w-20 h-20 object-cover rounded-lg" />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {report.status === 'pending' && (
                          <>
                            <button onClick={async () => { await handleHide(report.postId?._id); await resolveReport(report._id); }}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                              <EyeOff className="w-4 h-4" />
                              Ẩn bài viết
                            </button>
                            <button onClick={() => handleDeletePost(report.postId?._id, report._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                              <Trash2 className="w-4 h-4" />
                              Xóa bài
                            </button>
                            <button onClick={() => handleDismiss(report._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                              <XCircle className="w-4 h-4" />
                              Bỏ qua
                            </button>
                          </>
                        )}
                        {report.status === 'resolved' && postStatus === 'hidden' && (
                          <>
                            <button onClick={() => handleUnhide(report.postId?._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                              <RotateCcw className="w-4 h-4" />
                              Khôi phục bài
                            </button>
                            <button onClick={() => handleDeletePost(report.postId?._id, report._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                              <Trash2 className="w-4 h-4" />
                              Xóa bài
                            </button>
                          </>
                        )}
                        {report.status === 'dismissed' && (
                          <span className="flex items-center gap-2 text-sm text-slate-500">
                            <XCircle className="w-4 h-4" />
                            Đã bỏ qua
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
