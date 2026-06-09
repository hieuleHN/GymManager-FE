import { AdminLayout } from '../../components/AdminLayout';

const salaryHistory = [
  {
    id: 1,
    name: 'Nguyễn Văn X',
    job: 'Quản lý',
    bonus: 2000000,
    baseSalary: 15000000,
    totalSalary: 17000000,
    paidDate: '2024-05-25'
  },
  {
    id: 2,
    name: 'Trần Thị Y',
    job: 'Lễ tân',
    bonus: 500000,
    baseSalary: 7000000,
    totalSalary: 7500000,
    paidDate: '2024-05-25'
  },
  {
    id: 3,
    name: 'Lê Văn Z',
    job: 'Huấn luyện viên',
    bonus: 1000000,
    baseSalary: 10000000,
    totalSalary: 11000000,
    paidDate: '2024-05-24'
  },
  {
    id: 4,
    name: 'Phạm Thị T',
    job: 'Kế toán',
    bonus: 800000,
    baseSalary: 9000000,
    totalSalary: 9800000,
    paidDate: '2024-05-23'
  },
  {
    id: 5,
    name: 'Võ Văn K',
    job: 'Huấn luyện viên',
    bonus: 1200000,
    baseSalary: 10500000,
    totalSalary: 11700000,
    paidDate: '2024-05-22'
  }
];

export function StaffSalaryHistory() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử trả lương nhân viên</h1>
          <p className="text-slate-600">Xem lại lịch sử trả lương cho nhân viên</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Họ và tên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Công việc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền được thưởng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tổng tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đã trả vào ngày</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.map((record, index) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.name}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{record.job}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">{record.bonus.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{record.baseSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{record.totalSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.paidDate}</td>
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
