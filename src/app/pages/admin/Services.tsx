import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

const serviceRequests = [
  {
    id: 1,
    memberName: 'Nguyễn Văn A',
    requestType: 'Chuyển cơ sở',
    currentClub: 'ZenFitness Quận 1',
    targetClub: 'ZenFitness Quận 3',
    reason: 'Gần nơi làm việc mới hơn',
    requestDate: '2024-05-20'
  },
  {
    id: 2,
    memberName: 'Trần Thị B',
    requestType: 'Chuyển cơ sở',
    currentClub: 'ZenFitness Quận 7',
    targetClub: 'ZenFitness Quận 2',
    reason: 'Chuyển nhà đến khu vực mới',
    requestDate: '2024-05-19'
  },
  {
    id: 3,
    memberName: 'Lê Văn C',
    requestType: 'Tạm ngưng gói tập',
    currentClub: 'ZenFitness Quận 5',
    targetClub: '-',
    reason: 'Đi công tác dài hạn',
    requestDate: '2024-05-18'
  }
];

export function Services() {
  const [requests, setRequests] = useState(serviceRequests);

  const handleAccept = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn chấp nhận yêu cầu này?')) {
      setRequests(requests.filter(req => req.id !== id));
      alert('Đã chấp nhận yêu cầu!');
    }
  };

  const handleReject = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
      setRequests(requests.filter(req => req.id !== id));
      alert('Đã từ chối yêu cầu!');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách yêu cầu dịch vụ</h1>
          <p className="text-slate-600">Xử lý các yêu cầu dịch vụ từ hội viên</p>
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{request.memberName}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{request.requestType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{request.currentClub}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{request.targetClub}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">{request.reason}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{request.requestDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Chấp nhận"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Từ chối"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
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
