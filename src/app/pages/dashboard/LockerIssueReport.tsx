import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, XCircle, Loader2, Plus, Clock, HelpCircle, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { getAuthHeaders } from '../../context/AuthContext';
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
}

const emptyForm = { lockerNumber: '', issueType: 'broken' as const, description: '' };

export function LockerIssueReport() {
  const headers = getAuthHeaders();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [issues, setIssues] = useState<LockerIssue[]>([]);
  const [editingIssue, setEditingIssue] = useState<LockerIssue | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/lockers?page=1&limit=9999', { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const allIssues = data.data || [];
      setStats({
        total: allIssues.length,
        pending: allIssues.filter((i: LockerIssue) => i.status === 'pending').length,
        resolved: allIssues.filter((i: LockerIssue) => i.status === 'resolved').length,
      });
    } catch {
      // ignore
    }
  };

  const fetchIssues = async (p = page) => {
    if (dateError) return;
    setLoading(true);
    try {
      let url = `/api/lockers?page=${p}&limit=15`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setIssues(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Không thể tải danh sách báo cáo của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchIssues(1); }, [statusFilter, fromDate, toDate]);
  useEffect(() => { fetchStats(); }, []);

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
      const fd = new FormData();
      fd.append('lockerNumber', formData.lockerNumber);
      fd.append('issueType', formData.issueType);
      fd.append('description', formData.description);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { Authorization: headers.Authorization || '' },
        body: fd,
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã gửi báo cáo, chờ admin xem xét!');
      setShowModal(false);
      setFormData(emptyForm);
      setImageFile(null);
      fetchIssues(1);
      fetchStats();
      setPage(1);
    } catch {
      toast.error('Gửi báo cáo thất bại');
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('lockerNumber', editingIssue.lockerNumber);
      fd.append('issueType', editingIssue.issueType);
      fd.append('description', editingIssue.description);
      if (editImageFile) fd.append('image', editImageFile);

      const res = await fetch(`/api/lockers/${editingIssue._id}`, {
        method: 'PUT',
        headers: { Authorization: headers.Authorization || '' },
        body: fd,
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã cập nhật báo cáo!');
      setEditingIssue(null);
      setEditImageFile(null);
      fetchIssues(page);
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa báo cáo này không?');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/lockers/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã xóa báo cáo!');
      fetchIssues(page);
      fetchStats();
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setDeletingId(null);
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
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
                      {issue.image && (
                        <img src={`/uploads/lockers/${issue.image}`} alt="Ảnh báo cáo"
                          className="w-40 h-40 object-cover rounded-lg border border-slate-200 mb-2" />
                      )}
                      {issue.status === 'rejected' && issue.rejectionReason && (
                        <p className="text-sm text-red-600 mb-2">Lý do từ chối: {issue.rejectionReason}</p>
                      )}
                      {issue.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => { setEditingIssue({ ...issue }); setEditImageFile(null); }}
                            className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(issue._id)}
                            disabled={deletingId === issue._id}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === issue._id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
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

      {editingIssue && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingIssue(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Sửa báo cáo</h3>
            </div>
            <form onSubmit={handleEdit}>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số tủ</label>
                    <input type="text" required value={editingIssue.lockerNumber}
                      onChange={(e) => setEditingIssue({ ...editingIssue, lockerNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Loại vấn đề</label>
                    <select required value={editingIssue.issueType}
                      onChange={(e) => setEditingIssue({ ...editingIssue, issueType: e.target.value as LockerIssue['issueType'] })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="broken">Hỏng hóc</option>
                      <option value="dirty">Bẩn</option>
                      <option value="lost-key">Mất chìa khóa</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả chi tiết</label>
                  <textarea required value={editingIssue.description}
                    onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh hiện tại</label>
                  {editingIssue.image ? (
                    <img src={`/uploads/lockers/${editingIssue.image}`}
                      alt="Ảnh hiện tại" className="w-40 h-40 object-cover rounded-lg border border-slate-200 mb-2" />
                  ) : (
                    <p className="text-sm text-slate-500 mb-2">Chưa có ảnh</p>
                  )}
                  <label className="block text-sm font-medium text-slate-700 mb-2">Thay đổi ảnh</label>
                  <input type="file" accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" onClick={() => setEditingIssue(null)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ảnh thực tế (nếu có)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
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
