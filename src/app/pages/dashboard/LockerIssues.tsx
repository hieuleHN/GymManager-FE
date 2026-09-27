import { useState, useEffect, useRef } from 'react';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, Loader2, Plus, HelpCircle, Image as ImageIcon, X } from 'lucide-react';
import { getAuthHeaders } from '../../context/AuthContext';
import { Pagination } from '../../components/Pagination';
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

export function LockerIssues() {
  const headers = getAuthHeaders();
  const [issues, setIssues] = useState<LockerIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockerNumber, setLockerNumber] = useState('');
  const [issueType, setIssueType] = useState<'broken' | 'dirty' | 'lost-key' | 'other'>('broken');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchIdRef = useRef(0);

  const fetchIssues = async (p: number) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/lockers?page=${p}&limit=15`, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (id !== fetchIdRef.current) return;
      setIssues(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      if (id === fetchIdRef.current) toast.error('Không thể tải danh sách vấn đề');
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchIssues(1);
    return () => { fetchIdRef.current++; };
  }, []);

  const resetForm = () => {
    setLockerNumber('');
    setIssueType('broken');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh phải nhỏ hơn 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockerNumber.trim()) { toast.error('Vui lòng nhập số tủ'); return; }
    if (!description.trim()) { toast.error('Vui lòng nhập mô tả'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('lockerNumber', lockerNumber.trim());
      formData.append('issueType', issueType);
      formData.append('description', description.trim());
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { 'Authorization': headers['Authorization'] },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Báo cáo vấn đề thành công!');
      resetForm();
      setShowForm(false);
      setPage(1);
      fetchIssues(1);
    } catch (e: any) {
      toast.error(e.message || 'Gửi báo cáo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa báo cáo này?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lockers/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã xóa báo cáo!');
      fetchIssues(page);
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

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

  const filtered = issues
    .filter(i => !statusFilter || i.status === statusFilter)
    .filter(i => !searchTerm || i.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Báo cáo sự cố tủ đồ</h1>
          <p className="text-slate-600 mt-2">Quản lý và theo dõi vấn đề tủ đồ của bạn</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === null ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><Lock className="w-6 h-6 text-indigo-600" /><h3 className="font-semibold text-slate-900">Tổng số</h3></div>
            <p className="text-3xl font-bold text-slate-900">{total}</p>
          </button>
          <button onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'pending' ? 'border-yellow-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-6 h-6 text-yellow-600" /><h3 className="font-semibold text-slate-900">Chờ xử lý</h3></div>
            <p className="text-3xl font-bold text-yellow-600">{issues.filter(i => i.status === 'pending').length}</p>
          </button>
          <button onClick={() => setStatusFilter('resolved')}
            className={`bg-white rounded-xl p-6 border-2 transition-all text-left ${statusFilter === 'resolved' ? 'border-green-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-600" /><h3 className="font-semibold text-slate-900">Đã giải quyết</h3></div>
            <p className="text-3xl font-bold text-green-600">{issues.filter(i => i.status === 'resolved').length}</p>
          </button>
        </div>

        {/* Form báo cáo inline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><Plus className="w-5 h-5 text-indigo-600" /></div>
              <span className="font-semibold text-slate-900">Báo cáo vấn đề mới</span>
            </div>
            <Plus className={`w-5 h-5 text-slate-400 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          </button>

          {showForm && (
            <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4 border-t border-slate-100">
              <div className="pt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Số tủ <span className="text-red-500">*</span></label>
                  <input type="text" value={lockerNumber} onChange={e => setLockerNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Vd: A15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Loại vấn đề <span className="text-red-500">*</span></label>
                  <select value={issueType} onChange={e => setIssueType(e.target.value as any)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="broken">Hỏng hóc</option>
                    <option value="dirty">Bẩn</option>
                    <option value="lost-key">Mất chìa khóa</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows={3}
                  placeholder="Mô tả chi tiết vấn đề..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh minh họa (không bắt buộc)</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm">Chọn ảnh (tối đa 5MB)</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">Hủy</button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-4">
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
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách báo cáo của tôi</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filtered.map((issue) => (
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
                        <span>{new Date(issue.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {issue.status === 'pending' && (
                        <button onClick={() => handleDelete(issue._id)} disabled={deletingId === issue._id}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
                          {deletingId === issue._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  {searchTerm ? 'Không tìm thấy tủ phù hợp' : statusFilter ? 'Không có vấn đề nào phù hợp' : 'Chưa có báo cáo nào'}
                </div>
              )}
            </div>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchIssues(p); }} />}
        </div>
      </div>
    </div>
  );
}
