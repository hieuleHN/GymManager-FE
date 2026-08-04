import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { AlertCircle, CheckCircle2, Clock, Wrench, Search } from 'lucide-react';

interface LockerIssue {
    id: string;
    lockerCode: string;
    reportedBy: string;
    issueDescription: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
}

export function LockerIssuesV2() {
    const [searchTerm, setSearchTerm] = useState('');
    const [issues, setIssues] = useState<LockerIssue[]>([
        { id: '1', lockerCode: 'LK-103', reportedBy: 'Nguyễn Văn A', issueDescription: 'Hỏng khóa từ, không quét được thẻ', status: 'PENDING', createdAt: '2026-08-03' },
        { id: '2', lockerCode: 'LK-205', reportedBy: 'Trần Thị B', issueDescription: 'Kẹt bản lề cánh cửa tủ', status: 'IN_PROGRESS', createdAt: '2026-08-02' },
        { id: '3', lockerCode: 'LK-302', reportedBy: 'Lê Văn C', issueDescription: 'Quên mật khẩu tủ VIP', status: 'RESOLVED', createdAt: '2026-08-01' }
    ]);

    const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
        setIssues(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    };

    const filteredIssues = issues.filter(issue =>
        issue.lockerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sự cố & Báo trì Tủ đồ V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Theo dõi các báo cáo hỏng hóc tủ đồ từ hội viên và nhân viên</p>
                    </div>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo số tủ hoặc nội dung sự cố..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-sm focus:outline-none"
                    />
                </div>

                {/* Bảng danh sách sự cố */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Số Tủ</th>
                                <th className="p-4">Người Báo</th>
                                <th className="p-4">Nội dung Sự cố</th>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredIssues.map(issue => (
                                <tr key={issue.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-black text-slate-800">{issue.lockerCode}</td>
                                    <td className="p-4 font-medium">{issue.reportedBy}</td>
                                    <td className="p-4">{issue.issueDescription}</td>
                                    <td className="p-4 text-xs text-slate-400">{issue.createdAt}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${issue.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                                issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {issue.status === 'RESOLVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {issue.status === 'IN_PROGRESS' && <Wrench className="w-3.5 h-3.5" />}
                                            {issue.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                            {issue.status === 'RESOLVED' ? 'Đã xử lý' : issue.status === 'IN_PROGRESS' ? 'Đang sửa' : 'Chờ xử lý'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {issue.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => handleUpdateStatus(issue.id, 'RESOLVED')}
                                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                                            >
                                                Hoàn thành
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}