import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { X } from 'lucide-react';

const staffSalaryData = [
  {
    id: 1,
    name: 'Nguyễn Văn X',
    job: 'Quản lý',
    bonus: 2000000,
    baseSalary: 15000000,
    totalSalary: 17000000,
    isPaid: false
  },
  {
    id: 2,
    name: 'Trần Thị Y',
    job: 'Lễ tân',
    bonus: 500000,
    baseSalary: 7000000,
    totalSalary: 7500000,
    isPaid: false
  },
  {
    id: 3,
    name: 'Lê Văn Z',
    job: 'Huấn luyện viên',
    bonus: 1000000,
    baseSalary: 10000000,
    totalSalary: 11000000,
    isPaid: false
  },
  {
    id: 4,
    name: 'Phạm Thị T',
    job: 'Kế toán',
    bonus: 800000,
    baseSalary: 9000000,
    totalSalary: 9800000,
    isPaid: false
  }
];

export function StaffSalary() {
  const [staffList, setStaffList] = useState(staffSalaryData);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<typeof staffSalaryData[0] | null>(null);
  const [newSalary, setNewSalary] = useState('');

  const handleUpdateSalary = (staff: typeof staffSalaryData[0]) => {
    setSelectedStaff(staff);
    setNewSalary('');
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = () => {
    if (!newSalary || parseFloat(newSalary) <= 0) {
      alert('Vui lòng nhập lương hợp lệ!');
      return;
    }

    setStaffList(staffList.map(s =>
      s.id === selectedStaff?.id
        ? { ...s, baseSalary: parseFloat(newSalary), totalSalary: parseFloat(newSalary) + s.bonus }
        : s
    ));

    alert('Cập nhật lương thành công!');
    setShowUpdateModal(false);
    setSelectedStaff(null);
    setNewSalary('');
  };

  const handlePaySalary = (id: number) => {
    setStaffList(staffList.map(s =>
      s.id === id ? { ...s, isPaid: true } : s
    ));
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết lương nhân viên</h1>
          <p className="text-slate-600">Quản lý thông tin lương của nhân viên</p>
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, index) => (
                  <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{staff.name}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{staff.job}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">{staff.bonus.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{staff.baseSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{staff.totalSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outlined"
                          onClick={() => handleUpdateSalary(staff)}
                          sx={{
                            borderColor: '#4f46e5',
                            color: '#4f46e5',
                            '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' },
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            fontSize: '0.875rem'
                          }}
                        >
                          Cập nhật lương
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handlePaySalary(staff.id)}
                          disabled={staff.isPaid}
                          sx={{
                            bgcolor: staff.isPaid ? '#10b981' : '#4f46e5',
                            '&:hover': { bgcolor: staff.isPaid ? '#059669' : '#4338ca' },
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            fontSize: '0.875rem'
                          }}
                        >
                          {staff.isPaid ? 'Đã trả' : 'Trả lương'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Salary Modal */}
      {showUpdateModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Cập nhật lương</h3>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedStaff(null);
                  setNewSalary('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Nhân viên:</p>
                <p className="font-semibold text-slate-900">{selectedStaff.name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Lương ban đầu:</p>
                <p className="text-lg font-bold text-indigo-600">{selectedStaff.baseSalary.toLocaleString('vi-VN')}đ</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lương cập nhật <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập lương mới"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedStaff(null);
                  setNewSalary('');
                }}
                sx={{
                  flex: 1,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitUpdate}
                sx={{
                  flex: 1,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
