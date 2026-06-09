import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

const tasks = [
  {
    id: 1,
    title: 'Bảo trì máy chạy bộ',
    assignee: 'Nguyễn Văn X',
    priority: 'high',
    status: 'pending',
    dueDate: '2024-05-28',
    description: 'Kiểm tra và bảo trì tất cả máy chạy bộ'
  },
  {
    id: 2,
    title: 'Cập nhật hợp đồng khách hàng',
    assignee: 'Trần Thị Y',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2024-05-30',
    description: 'Cập nhật hợp đồng cho khách hàng sắp hết hạn'
  },
  {
    id: 3,
    title: 'Tổng kết doanh thu tháng 5',
    assignee: 'Phạm Thị T',
    priority: 'high',
    status: 'pending',
    dueDate: '2024-05-31',
    description: 'Lập báo cáo doanh thu tháng 5'
  },
  {
    id: 4,
    title: 'Kiểm tra thiết bị an toàn',
    assignee: 'Lê Văn Z',
    priority: 'low',
    status: 'completed',
    dueDate: '2024-05-25',
    description: 'Kiểm tra tất cả thiết bị an toàn trong phòng tập'
  }
];

export function Tasks() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = tasks.filter(task =>
    statusFilter === 'all' || task.status === statusFilter
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang làm';
      case 'pending': return 'Chờ xử lý';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý công việc</h1>
            <p className="text-slate-600">Theo dõi và phân công công việc cho nhân viên</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus className="w-5 h-5" />}
            sx={{
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              textTransform: 'none',
              borderRadius: 2,
              px: 4
            }}
          >
            Tạo công việc
          </Button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex gap-3">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'in_progress', label: 'Đang làm' },
              { value: 'completed', label: 'Hoàn thành' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  statusFilter === filter.value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex-1">{task.title}</h3>
                {task.status === 'completed' && (
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 mb-4">{task.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Người phụ trách:</span>
                  <span className="font-semibold text-slate-900">{task.assignee}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Hạn hoàn thành:</span>
                  <span className="font-semibold text-slate-900">{task.dueDate}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                    {getPriorityText(task.priority)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
