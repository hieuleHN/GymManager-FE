import { AdminLayout } from '../../components/AdminLayout';
import { Search, Calendar } from 'lucide-react';
import { useState } from 'react';

const attendanceHistoryRecords = [
  { id: 1, member: 'Nguyễn Văn A', checkIn: '08:30', date: '2024-05-26', phone: '0901234567', package: 'PREMIUM - Gym', timeRemaining: '45 ngày', daysInMonth: 22 },
  { id: 2, member: 'Trần Thị B', checkIn: '09:15', date: '2024-05-26', phone: '0912345678', package: 'STANDARD - Yoga', timeRemaining: '30 ngày', daysInMonth: 18 },
  { id: 3, member: 'Lê Văn C', checkIn: '10:00', date: '2024-05-26', phone: '0923456789', package: 'VIP - Boxing', timeRemaining: '60 ngày', daysInMonth: 25 },
  { id: 4, member: 'Phạm Thị D', checkIn: '14:00', date: '2024-05-26', phone: '0934567890', package: 'PREMIUM - Gym', timeRemaining: '15 ngày', daysInMonth: 20 },
  { id: 5, member: 'Hoàng Văn E', checkIn: '16:20', date: '2024-05-26', phone: '0945678901', package: 'STANDARD - Pilates', timeRemaining: '22 ngày', daysInMonth: 16 },
  { id: 6, member: 'Võ Thị F', checkIn: '07:45', date: '2024-05-25', phone: '0956789012', package: 'VIP - Combo', timeRemaining: '50 ngày', daysInMonth: 24 },
  { id: 7, member: 'Đặng Văn G', checkIn: '11:30', date: '2024-05-25', phone: '0967890123', package: 'PREMIUM - Gym', timeRemaining: '38 ngày', daysInMonth: 21 }
];

export function AttendanceHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2024-05-26');

  const filteredRecords = attendanceHistoryRecords.filter(record =>
    record.member.toLowerCase().includes(searchTerm.toLowerCase()) &&
    record.date === selectedDate
  );

  const totalAttendance = filteredRecords.length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử điểm danh</h1>
          <p className="text-slate-600">Xem lại lịch sử điểm danh của hội viên</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tổng số điểm danh</p>
              <p className="text-3xl font-bold text-slate-900">{totalAttendance}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hội viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Hội viên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Check-in</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Gói tập</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời gian còn lại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số ngày điểm danh trong tháng</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.member}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.checkIn}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.package}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{record.timeRemaining}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-bold">{record.daysInMonth} ngày</td>
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
