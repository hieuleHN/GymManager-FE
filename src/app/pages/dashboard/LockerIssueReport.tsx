import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, XCircle, Loader2, Plus, Clock, HelpCircle } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface LockerIssue {
  _id: string;
  lockerNumber: string;
  issueType: 'broken' | 'dirty' | 'lost-key' | 'other';
  description: string;
  reporterName: string;
  createdAt: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  rejectionReason?: string | null;
}

const emptyForm = { lockerNumber: '', issueType: 'broken' as const, description: '' };

export function LockerIssueReport() {
  const headers = getAuthHeaders();
  const [issues, setIssues] = useState<LockerIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Không truyền reporterId lên đây: BE tự lọc "chỉ báo cáo của tôi" dựa vào token
  // (xem lockerController.list) nên FE không thể/không cần tự lọc hay giả mạo.
  const fetchIssues = async (p = page) => {
    setLoading(true);
    try {
      let url = `/api/lockers?page=${p}&limit=15`;
    if (statusFilter) url += `&status=${statusFilter}`;
    const res = await fetch(url, { headers });
      // const res = await fetch(`/api/lockers?page=${p}&limit=15`, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const allIssues = data.data || [];
      setIssues(allIssues);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setStats({
        total: data.total || 0,
        pending: allIssues.filter((i: LockerIssue) => i.status === 'pending').length,
        resolved: allIssues.filter((i: LockerIssue) => i.status === 'resolved').length,
      });
    } catch {
      toast.error('Không thể tải danh sách báo cáo của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchIssues(1); }, [statusFilter]);

  const getIssueTypeIcon = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return <AlertTriangle className="w-5 h-5" />;
      case 'dirty': return <Trash2 className="w-5 h-5" />;
      case 'lost-key': return <Key className="w-5 h-5" />;
      case 'other': return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getIssueTypeName = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return 'Hỏng hóc';
      case 'dirty': return 'Bẩn';
      case 'lost-key': return 'Mất chìa khóa';
      case 'other': return 'Khác';

    }
  };

  const getIssueTypeColor = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return 'bg-red-100 text-red-700';
      case 'dirty': return 'bg-orange-100 text-orange-700';
      case 'lost-key': return 'bg-yellow-100 text-yellow-700';
      case 'other': return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusText = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending': return 'Chờ admin xem xét';
      case 'in-progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'rejected': return 'Đã bị từ chối';
    }
  };

  const getStatusIcon = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'in-progress': return <Loader2 className="w-3.5 h-3.5" />;
      case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const handleBlur = (field: string) => {
    let error = '';
    if (field === 'lockerNumber' && !formData.lockerNumber.trim()) error = 'Vui lòng nhập số tủ';
    else if (field === 'issueType' && !formData.issueType) error = 'Vui lòng chọn loại vấn đề';
    else if (field === 'description' && !formData.description.trim()) error = 'Vui lòng nhập mô tả';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.lockerNumber.trim()) newErrors.lockerNumber = 'Vui lòng nhập số tủ';
    if (!formData.issueType) newErrors.issueType = 'Vui lòng chọn loại vấn đề';
    if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      // Không gửi reporterId/reporterName - BE tự lấy từ req.user (token) khi tạo báo cáo.
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã gửi báo cáo, chờ admin xem xét!');
      setShowModal(false);
      setFormData(emptyForm);
      fetchIssues(1);
      setPage(1);
    } catch {
      toast.error('Gửi báo cáo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Báo cáo sự cố tủ đồ</h1>
            <p className="text-slate-600 mt-2">Danh sách báo cáo bạn đã gửi và trạng thái xử lý</p>
          </div>
          <button onClick={() => { setFormData(emptyForm); setErrors({}); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            <Plus className="w-5 h-5" /> Báo cáo vấn đề mới
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === null ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Tổng số báo cáo</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </button>

          <button onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'pending' ? 'border-yellow-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <h3 className="font-semibold text-slate-900">Chờ xử lý</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </button>

          <button onClick={() => setStatusFilter('resolved')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'resolved' ? 'border-green-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-slate-900">Đã giải quyết</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Báo cáo của tôi</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {issues.map((issue) => (
                <div key={issue._id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeIcon(issue.issueType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">Tủ số {issue.lockerNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeName(issue.issueType)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)} {getStatusText(issue.status)}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-2">{issue.description}</p>
                      {issue.status === 'rejected' && issue.rejectionReason && (
                        <p className="text-sm text-red-600 mb-2">Lý do từ chối: {issue.rejectionReason}</p>
                      )}
                      <span className="text-sm text-slate-500">{new Date(issue.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {issues.length === 0 && <div className="p-8 text-center text-slate-500">Bạn chưa báo cáo vấn đề nào</div>}
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchIssues(p); }} />}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Báo cáo vấn đề tủ đồ</h3>
            </div>
            <form onSubmit={handleReport}>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số tủ <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.lockerNumber} onChange={(e) => { setFormData({ ...formData, lockerNumber: e.target.value }); setErrors(prev => ({ ...prev, lockerNumber: '' })); }}
                      onBlur={() => handleBlur('lockerNumber')}
                      className={`w-full px-4 py-3 border ${errors.lockerNumber ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} placeholder="Vd: A15" />
                    {errors.lockerNumber && <p className="text-red-500 text-sm mt-1">{errors.lockerNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Loại vấn đề <span className="text-red-500">*</span></label>
                    <select required value={formData.issueType} onChange={(e) => { setFormData({ ...formData, issueType: e.target.value as any }); setErrors(prev => ({ ...prev, issueType: '' })); }}
                      onBlur={() => handleBlur('issueType')}
                      className={`w-full px-4 py-3 border ${errors.issueType ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}>
                      <option value="broken">Hỏng hóc</option>
                      <option value="dirty">Bẩn</option>
                      <option value="lost-key">Mất chìa khóa</option>
                      <option value="other">Khác</option>
                    </select>
                    {errors.issueType && <p className="text-red-500 text-sm mt-1">{errors.issueType}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                  <textarea required value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors(prev => ({ ...prev, description: '' })); }}
                    onBlur={() => handleBlur('description')}
                    className={`w-full px-4 py-3 border ${errors.description ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none`} rows={4} placeholder="Mô tả chi tiết vấn đề..." />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
