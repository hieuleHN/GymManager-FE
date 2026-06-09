import { useState } from 'react';
import { Lock, AlertTriangle, Key, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface LockerIssue {
  id: string;
  lockerNumber: string;
  issueType: 'broken' | 'dirty' | 'lost-key';
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'in-progress' | 'resolved';
}

export function LockerManagement() {
  const [issues] = useState<LockerIssue[]>([
    {
      id: '1',
      lockerNumber: 'A15',
      issueType: 'broken',
      description: 'Khóa bị hỏng, không mở được',
      reportedBy: 'Nguyễn Văn A',
      reportedAt: '2026-06-04T10:30:00',
      status: 'pending'
    },
    {
      id: '2',
      lockerNumber: 'B23',
      issueType: 'dirty',
      description: 'Tủ bẩn, khách không dọn dẹp sau khi sử dụng',
      reportedBy: 'Nhân viên vệ sinh',
      reportedAt: '2026-06-04T09:15:00',
      status: 'in-progress'
    },
    {
      id: '3',
      lockerNumber: 'C08',
      issueType: 'lost-key',
      description: 'Khách mất chìa khóa',
      reportedBy: 'Trần Thị B',
      reportedAt: '2026-06-03T16:20:00',
      status: 'resolved'
    }
  ]);

  const [showReportModal, setShowReportModal] = useState(false);

  const getIssueTypeIcon = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken':
        return <AlertTriangle className="w-5 h-5" />;
      case 'dirty':
        return <Trash2 className="w-5 h-5" />;
      case 'lost-key':
        return <Key className="w-5 h-5" />;
    }
  };

  const getIssueTypeName = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken':
        return 'Hỏng hóc';
      case 'dirty':
        return 'Bẩn';
      case 'lost-key':
        return 'Mất chìa khóa';
    }
  };

  const getIssueTypeColor = (type: LockerIssue['issueType']) => {
    switch (type) {
      case 'broken':
        return 'bg-red-100 text-red-700';
      case 'dirty':
        return 'bg-orange-100 text-orange-700';
      case 'lost-key':
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusColor = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
    }
  };

  const getStatusText = (status: LockerIssue['status']) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'in-progress':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý tủ đồ</h1>
          <p className="text-slate-600 mt-2">Quản lý các vấn đề liên quan đến tủ đồ</p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          Báo cáo vấn đề mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Tổng số vấn đề</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{issues.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="font-semibold text-slate-900">Chờ xử lý</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {issues.filter(i => i.status === 'pending').length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Đang xử lý</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {issues.filter(i => i.status === 'in-progress').length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-slate-900">Đã giải quyết</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {issues.filter(i => i.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Danh sách vấn đề</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {issues.map((issue) => (
            <div key={issue.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getIssueTypeColor(issue.issueType)}`}>
                  {getIssueTypeIcon(issue.issueType)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">Tủ số {issue.lockerNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueTypeColor(issue.issueType)}`}>
                      {getIssueTypeName(issue.issueType)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                      {getStatusText(issue.status)}
                    </span>
                  </div>

                  <p className="text-slate-700 mb-3">{issue.description}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>Báo cáo bởi: <span className="font-semibold">{issue.reportedBy}</span></span>
                    <span>•</span>
                    <span>{new Date(issue.reportedAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {issue.status !== 'resolved' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                      Đánh dấu hoàn thành
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Báo cáo vấn đề tủ đồ</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Số tủ</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Vd: A15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Loại vấn đề</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="broken">Hỏng hóc</option>
                    <option value="dirty">Bẩn</option>
                    <option value="lost-key">Mất chìa khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả chi tiết</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                  placeholder="Mô tả chi tiết vấn đề..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Người báo cáo</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tên người báo cáo"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                Gửi báo cáo
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
