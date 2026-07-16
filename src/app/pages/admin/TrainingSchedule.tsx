import { useState } from 'react';
import { Calendar, Clock, User, AlertCircle, Check, X } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface ScheduleItem {
  id: string;
  memberName: string;
  memberAvatar: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'transfer-requested';
  note?: string;
}

export function TrainingSchedule() {
  const [schedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      memberName: 'Nguyễn Văn A',
      memberAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
      date: '2026-06-05',
      time: '08:00 - 09:00',
      status: 'confirmed'
    },
    {
      id: '2',
      memberName: 'Trần Thị B',
      memberAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
      date: '2026-06-05',
      time: '10:00 - 11:00',
      status: 'pending'
    },
    {
      id: '3',
      memberName: 'Lê Văn C',
      memberAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
      date: '2026-06-06',
      time: '15:00 - 16:00',
      status: 'transfer-requested',
      note: 'Yêu cầu chuyển cho PT khác vì bận gấp'
    }
  ]);

  const [showTransferModal, setShowTransferModal] = useState(false);

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'transfer-requested':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusText = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'transfer-requested':
        return 'Yêu cầu chuyển';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lịch tập</h1>
        <p className="text-slate-600 mt-2">Quản lý lịch tập của huấn luyện viên</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
          <Calendar className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-bold text-slate-900">Đặt lịch mới</h3>
          <p className="text-sm text-slate-600 mt-1">Tạo lịch tập cho hội viên</p>
        </button>

        <button
          onClick={() => setShowTransferModal(true)}
          className="p-6 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
        >
          <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-bold text-slate-900">Chuyển lịch</h3>
          <p className="text-sm text-slate-600 mt-1">Chuyển cho đồng nghiệp khi bận</p>
        </button>

        <button className="p-6 bg-white rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left">
          <Clock className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-bold text-slate-900">Xem lịch tháng</h3>
          <p className="text-sm text-slate-600 mt-1">Xem toàn bộ lịch trong tháng</p>
        </button>
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Lịch tập sắp tới</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <img
                  src={schedule.memberAvatar}
                  alt={schedule.memberName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{schedule.memberName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(schedule.status)}`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(schedule.date).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {schedule.time}
                    </div>
                  </div>

                  {schedule.note && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-900">
                        <span className="font-semibold">Ghi chú:</span> {schedule.note}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {schedule.status === 'pending' && (
                    <>
                      <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Check className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {schedule.status === 'transfer-requested' && (
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold">
                      Xử lý yêu cầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Chuyển lịch cho đồng nghiệp</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn lịch cần chuyển</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option>05/06/2026 - 08:00-09:00 - Nguyễn Văn A</option>
                  <option>05/06/2026 - 10:00-11:00 - Trần Thị B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn đồng nghiệp</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option>HLV Nguyễn Văn D</option>
                  <option>HLV Trần Thị E</option>
                  <option>HLV Lê Văn F</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý do chuyển lịch</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Nhập lý do..."
                />
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  <span className="font-semibold">Lưu ý:</span> Hội viên sẽ nhận được thông báo về việc thay đổi huấn luyện viên và cần xác nhận.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                Gửi yêu cầu chuyển lịch
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
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
