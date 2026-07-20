import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';

const historyData = [
  {
    id: 1,
    memberName: 'Phạm Văn D',
    requestType: 'Chuyển cơ sở',
    currentClub: 'ZenFitness Quận 1',
    targetClub: 'ZenFitness Quận 5',
    reason: 'Chuyển công ty',
    requestDate: '2024-05-15',
    processedDate: '2024-05-16',
    status: 'accepted'
  },
  {
    id: 2,
    memberName: 'Hoàng Thị E',
    requestType: 'Chuyển cơ sở',
    currentClub: 'ZenFitness Quận 3',
    targetClub: 'ZenFitness Quận 7',
    reason: 'Gần nhà hơn',
    requestDate: '2024-05-14',
    processedDate: '2024-05-15',
    status: 'rejected'
  },
  {
    id: 3,
    memberName: 'Đỗ Văn F',
    requestType: 'Tạm ngưng gói tập',
    currentClub: 'ZenFitness Quận 2',
    targetClub: '-',
    reason: 'Bận công việc',
    requestDate: '2024-05-13',
    processedDate: '2024-05-14',
    status: 'accepted'
  },
  {
    id: 4,
    memberName: 'Vũ Thị G',
    requestType: 'Chuyển cơ sở',
    currentClub: 'ZenFitness Quận 6',
    targetClub: 'ZenFitness Quận 1',
    reason: 'Phù hợp lịch làm việc',
    requestDate: '2024-05-12',
    processedDate: '2024-05-13',
    status: 'accepted'
  },
  {
    id: 5,
    memberName: 'Bùi Văn H',
    requestType: 'Tạm ngưng gói tập',
    currentClub: 'ZenFitness Quận 4',
    targetClub: '-',
    reason: 'Du lịch dài ngày',
    requestDate: '2024-05-11',
    processedDate: '2024-05-12',
    status: 'rejected'
  }
];

export function ServiceHistory() {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  const filteredHistory = historyData.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử dịch vụ</h1>
          <p className="text-slate-600">Lịch sử các yêu cầu đã xử lý</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{
              bgcolor: filter === 'all' ? '#4f46e5' : 'transparent',
              color: filter === 'all' ? '#fff' : '#475569',
              borderColor: '#cbd5e1',
              '&:hover': {
                bgcolor: filter === 'all' ? '#4338ca' : '#f8fafc',
                borderColor: '#94a3b8'
              },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === 'accepted' ? 'contained' : 'outlined'}
            onClick={() => setFilter('accepted')}
            sx={{
              bgcolor: filter === 'accepted' ? '#10b981' : 'transparent',
              color: filter === 'accepted' ? '#fff' : '#475569',
              borderColor: '#cbd5e1',
              '&:hover': {
                bgcolor: filter === 'accepted' ? '#059669' : '#f0fdf4',
                borderColor: '#94a3b8'
              },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Đã chấp nhận
          </Button>
          <Button
            variant={filter === 'rejected' ? 'contained' : 'outlined'}
            onClick={() => setFilter('rejected')}
            sx={{
              bgcolor: filter === 'rejected' ? '#ef4444' : 'transparent',
              color: filter === 'rejected' ? '#fff' : '#475569',
              borderColor: '#cbd5e1',
              '&:hover': {
                bgcolor: filter === 'rejected' ? '#dc2626' : '#fef2f2',
                borderColor: '#94a3b8'
              },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Đã từ chối
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tên hội viên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Loại yêu cầu</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cơ sở hiện tại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cơ sở mong muốn</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Lý do</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày yêu cầu</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày xử lý</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.memberName}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{item.requestType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.currentClub}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.targetClub}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">{item.reason}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.requestDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.processedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
