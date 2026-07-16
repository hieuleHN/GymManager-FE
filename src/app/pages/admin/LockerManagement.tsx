import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { getAuthHeaders } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';

interface LockerIssue {
  _id: string;
  lockerNumber: string;
  issueType: 'broken' | 'dirty' | 'lost-key';
  description: string;
  reportedBy: string;
  reportedAt: string;
  createdAt: string;
  status: 'pending' | 'in-progress' | 'resolved';
}

type LockerFormData = {
  lockerNumber: string;
  issueType: 'broken' | 'dirty' | 'lost-key';
  description: string;
  reportedBy: string;
};

export function LockerManagement() {
  const headers = getAuthHeaders();
  const { selectedClub, clubs } = useClub();
  const [issues, setIssues] = useState<LockerIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LockerFormData>({
    defaultValues: { lockerNumber: '', issueType: 'broken', description: '', reportedBy: '' },
  });

  const fetchIdRef = useRef(0);

  const fetchIssues = async (p: number) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      const base = selectedClub && selectedClub !== 'all'
        ? `/api/lockers?locationId=${selectedClub}`
        : '/api/lockers';
      const url = `${base}${base.includes('?') ? '&' : '?'}page=${p}&limit=15`;
      const res = await fetch(url, { headers });
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
  }, [selectedClub]);

  const getIssueTypeIcon = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return <AlertTriangle className="w-5 h-5" />;
      case 'dirty': return <Trash2 className="w-5 h-5" />;
      case 'lost-key': return <Key className="w-5 h-5" />;
    }
  };

  const getIssueTypeName = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return 'Hỏng hóc';
      case 'dirty': return 'Bẩn';
      case 'lost-key': return 'Mất chìa khóa';
    }
  };

  const getIssueTypeColor = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken': return 'bg-red-100 text-red-700';
      case 'dirty': return 'bg-orange-100 text-orange-700';
      case 'lost-key': return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusColor = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusText = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'in-progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
    }
  };

  const onSubmit = async (data: LockerFormData) => {
    setSubmitting(true);
    try {
      const body: any = { ...data };
      if (selectedClub && selectedClub !== 'all') body.locationId = selectedClub;
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Báo cáo vấn đề thành công!');
      setShowModal(false);
      reset();
      setPage(1); fetchIssues(1);
    } catch {
      toast.error('Gửi báo cáo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/lockers/${id}/resolve`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã đánh dấu hoàn thành!');
      fetchIssues(page);
    } catch {
      toast.error('Cập nhật thất bại');
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
          <button onClick={() => { reset(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            <Plus className="w-5 h-5" /> Báo cáo vấn đề mới
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2"><Lock className="w-6 h-6 text-indigo-600" /><h3 className="font-semibold text-slate-900">Tổng số vấn đề</h3></div>
            <p className="text-3xl font-bold text-slate-900">{issues.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-6 h-6 text-yellow-600" /><h3 className="font-semibold text-slate-900">Chờ xử lý</h3></div>
            <p className="text-3xl font-bold text-yellow-600">{issues.filter(i => i.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-600" /><h3 className="font-semibold text-slate-900">Đã giải quyết</h3></div>
            <p className="text-3xl font-bold text-green-600">{issues.filter(i => i.status === 'resolved').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Danh sách vấn đề</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {issues.map((issue) => (
                <div key={issue._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeIcon(issue.issueType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">Tủ số {issue.lockerNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueTypeColor(issue.issueType)}`}>{getIssueTypeName(issue.issueType)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>{getStatusText(issue.status)}</span>
                      </div>
                      <p className="text-slate-700 mb-3">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Báo cáo bởi: <span className="font-semibold">{issue.reportedBy}</span></span>
                        <span>•</span>
                        <span>{new Date(issue.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {issue.status !== 'resolved' && (
                        <button onClick={() => handleResolve(issue._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Hoàn thành
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {issues.length === 0 && <div className="p-8 text-center text-slate-500">Chưa có vấn đề nào được báo cáo</div>}
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
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số tủ <span className="text-red-500">*</span></label>
                    <input type="text" {...register('lockerNumber', { required: 'Vui lòng nhập số tủ', validate: v => v.trim() !== '' || 'Vui lòng nhập số tủ' })}
                      className={`w-full px-4 py-3 border ${errors.lockerNumber ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} placeholder="Vd: A15" />
                    {errors.lockerNumber && <span className="text-red-500 text-sm mt-1">{errors.lockerNumber.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Loại vấn đề <span className="text-red-500">*</span></label>
                    <select {...register('issueType', { required: 'Vui lòng chọn loại vấn đề' })}
                      className={`w-full px-4 py-3 border ${errors.issueType ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}>
                      <option value="broken">Hỏng hóc</option>
                      <option value="dirty">Bẩn</option>
                      <option value="lost-key">Mất chìa khóa</option>
                    </select>
                    {errors.issueType && <span className="text-red-500 text-sm mt-1">{errors.issueType.message}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                  <textarea {...register('description', { required: 'Vui lòng nhập mô tả', validate: v => v.trim() !== '' || 'Vui lòng nhập mô tả' })}
                    className={`w-full px-4 py-3 border ${errors.description ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none`} rows={4} placeholder="Mô tả chi tiết vấn đề..." />
                  {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Người báo cáo <span className="text-red-500">*</span></label>
                  <input type="text" {...register('reportedBy', { required: 'Vui lòng nhập tên người báo cáo', validate: v => v.trim() !== '' || 'Vui lòng nhập tên người báo cáo' })}
                    className={`w-full px-4 py-3 border ${errors.reportedBy ? 'border-red-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`} placeholder="Tên người báo cáo" />
                  {errors.reportedBy && <span className="text-red-500 text-sm mt-1">{errors.reportedBy.message}</span>}
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
