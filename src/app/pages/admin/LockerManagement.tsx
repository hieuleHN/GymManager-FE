import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, XCircle, Loader2, Plus, HelpCircle, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface LockerIssue {
  _id: string;
  lockerNumber: string;
  issueType: 'broken' | 'dirty' | 'lost-key' | 'other';
  description: string;
  image?: string | null;
  reporterName: string;
  createdAt: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  rejectionReason?: string | null;
  priority: 'high' | 'medium' | 'low';
}

const emptyForm = { lockerNumber: '', issueType: 'broken' as const, description: '' };

export function LockerManagement() {
  const headers = getAuthHeaders();
  const { selectedClub, clubs } = useClub();
  const [issues, setIssues] = useState<LockerIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, resolved: 0 });

  const today = new Date().toISOString().split('T')[0];

  const validateDates = (from: string, to: string) => {
    if (from && to && from > to) {
      setDateError('Ngày bắt đầu không được sau ngày kết thúc');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    validateDates(value, toDate);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    validateDates(fromDate, value);
  };

  const fetchIssues = async (p = page) => {
    if (dateError) return;
    setLoading(true);
    try {
      const base = selectedClub && selectedClub !== 'all'
        ? `/api/lockers?locationId=${selectedClub}`
        : '/api/lockers';
      const url = `${base}${base.includes('?') ? '&' : '?'}page=${p}&limit=15${fromDate ? `&fromDate=${fromDate}` : ''}${toDate ? `&toDate=${toDate}` : ''}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const allIssues = data.data || [];
      setIssues(allIssues);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setStats({
        pending: allIssues.filter((i: LockerIssue) => i.status === 'pending').length,
        resolved: allIssues.filter((i: LockerIssue) => i.status === 'resolved').length,
      });
    } catch {
      toast.error('Không thể tải danh sách vấn đề');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchIssues(1); }, [selectedClub, fromDate, toDate]);

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
      case 'pending': return 'Chờ xử lý';
      case 'in-progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'rejected': return 'Đã từ chối';
    }
  };

  const getPriorityColor = (priority: LockerIssue['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'low': return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityText = (priority: LockerIssue['priority']) => {
    switch (priority) {
      case 'high': return 'Ưu tiên cao';
      case 'medium': return 'Ưu tiên TB';
      case 'low': return 'Thấp';
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
      const body: any = { ...formData };
      if (selectedClub && selectedClub !== 'all') body.locationId = selectedClub;
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Báo cáo vấn đề thành công!');
      setShowModal(false);
      setFormData(emptyForm);
      setPage(1); fetchIssues(1);
    } catch {
      toast.error('Gửi báo cáo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/lockers/${id}/resolve`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã đánh dấu hoàn thành!');
      fetchIssues(page);
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/lockers/${rejectingId}/reject`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã từ chối báo cáo!');
      setRejectingId(null);
      setRejectionReason('');
      fetchIssues(page);
    } catch {
      toast.error('Từ chối thất bại');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tủ đồ</h1>
            <p className="text-slate-600 mt-2">
              {selectedClub === 'all' ? 'Tất cả cơ sở' : clubs.find(c => c._id === selectedClub)?.address || 'Đã chọn'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === null ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><Lock className="w-6 h-6 text-indigo-600" /><h3 className="font-semibold text-slate-900">Tổng số vấn đề</h3></div>
            <p className="text-3xl font-bold text-slate-900">{total}</p>
          </button>
          <button onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'pending' ? 'border-yellow-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-6 h-6 text-yellow-600" /><h3 className="font-semibold text-slate-900">Chờ xử lý</h3></div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </button>
          <button onClick={() => setStatusFilter('resolved')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'resolved' ? 'border-green-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-600" /><h3 className="font-semibold text-slate-900">Đã giải quyết</h3></div>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Tìm tủ:</span>
            </div>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập số tủ..."
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-40" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                Xóa
              </button>
            )}
            <div className="flex items-center gap-2 text-slate-700 font-semibold ml-2">
              <Calendar className="w-4 h-4" />
              <span>Lọc theo ngày:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Từ</label>
              <input type="date" value={fromDate} max={today} onChange={(e) => handleFromDateChange(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Đến</label>
              <input type="date" value={toDate} max={today} onChange={(e) => handleToDateChange(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); setDateError(''); }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                Xóa bộ lọc ngày
              </button>
            )}
          </div>
          {dateError && <p className="text-red-500 text-sm mt-2">{dateError}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách vấn đề</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {issues.filter(i => !statusFilter || i.status === statusFilter).filter(i => !searchTerm || i.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase())).map((issue) => (
                <div key={issue._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeIcon(issue.issueType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">Tủ số {issue.lockerNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeName(issue.issueType)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>{getStatusText(issue.status)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>{getPriorityText(issue.priority)}</span>
                      </div>
                      <p className="text-slate-700 mb-3">{issue.description}</p>
                      {issue.image && (
                        <img src={`/uploads/lockers/${issue.image}`} alt="Ảnh báo cáo"
                          className="w-40 h-40 object-cover rounded-lg border border-slate-200 mb-3" />
                      )}
                      {issue.status === 'rejected' && issue.rejectionReason && (
                        <p className="text-sm text-red-600 mb-2">Lý do từ chối: {issue.rejectionReason}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Báo cáo bởi: <span className="font-semibold">{issue.reporterName}</span></span>
                        <span>•</span>
                        <span>{new Date(issue.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {issue.status !== 'resolved' && issue.status !== 'rejected' && (
                        <>
                          <button onClick={() => handleResolve(issue._id)} disabled={resolvingId === issue._id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
                            {resolvingId === issue._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} {resolvingId === issue._id ? 'Đang xử lý...' : 'Hoàn thành'}
                          </button>
                          <button onClick={() => { setRejectingId(issue._id); setRejectionReason(''); }}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {issues.filter(i => !statusFilter || i.status === statusFilter).filter(i => !searchTerm || i.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  {searchTerm ? 'Không tìm thấy tủ phù hợp' : statusFilter ? 'Không có vấn đề nào phù hợp' : 'Chưa có vấn đề nào được báo cáo'}
                </div>
              )}
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
      {rejectingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Từ chối báo cáo</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Lý do từ chối <span className="text-red-500">*</span></label>
              <textarea autoFocus value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows={3}
                placeholder="Vd: Báo cáo trùng lặp với vấn đề đã ghi nhận trước đó" />
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={handleReject} disabled={rejecting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                {rejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
              <button onClick={() => setRejectingId(null)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
