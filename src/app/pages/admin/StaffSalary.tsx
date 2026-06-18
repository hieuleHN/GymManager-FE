import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

interface SalaryDetail {
  _id: string;
  name: string;
  job: string;
  bonus: number;
  baseSalary: number;
  totalSalary: number;
  isPaid: boolean;
  salaryId: string | null;
}

export function StaffSalary() {
  const [staffList, setStaffList] = useState<SalaryDetail[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<SalaryDetail | null>(null);
  const [newSalary, setNewSalary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async (p = page) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/salary/details?page=${p}&limit=15`, { headers: getAuthHeaders() });
      const data = await res.json();
      setStaffList(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => { fetchData(1); }, []);

  const handleUpdateSalary = (staff: SalaryDetail) => {
    setSelectedStaff(staff);
    setNewSalary('');
    setErrors({});
    setShowUpdateModal(true);
  };

  const handleBlur = () => {
    if (!newSalary || parseFloat(newSalary) <= 0) {
      setErrors({ newSalary: 'Vui lòng nhập lương hợp lệ' });
    } else {
      setErrors({});
    }
  };

  const validateAll = () => {
    if (!newSalary || parseFloat(newSalary) <= 0) {
      setErrors({ newSalary: 'Vui lòng nhập lương hợp lệ' });
      return false;
    }
    return true;
  };

  const handleSubmitUpdate = async () => {
    if (!validateAll()) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/salary/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ staffId: selectedStaff?._id, baseSalary: parseFloat(newSalary) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Cập nhật lương thành công!');
      setShowUpdateModal(false);
      setSelectedStaff(null);
      setNewSalary('');
      fetchData(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePaySalary = async (staffId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/salary/pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ staffId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Trả lương thành công! Tiền thưởng đã được reset về 0.');
      fetchData(page);
    } catch (err: any) {
      alert(err.message);
    }
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
                  <tr key={staff._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{staff.name}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{staff.job}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">{staff.bonus.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{staff.baseSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{staff.totalSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outlined" onClick={() => handleUpdateSalary(staff)}
                          sx={{ borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' }, textTransform: 'none', borderRadius: 2, px: 2, py: 1, fontSize: '0.875rem' }}>
                          Cập nhật lương
                        </Button>
                        <Button variant="contained" onClick={() => handlePaySalary(staff._id)} disabled={staff.isPaid}
                          sx={{ bgcolor: staff.isPaid ? '#10b981' : '#4f46e5', '&:hover': { bgcolor: staff.isPaid ? '#059669' : '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 2, py: 1, fontSize: '0.875rem' }}>
                          {staff.isPaid ? 'Đã trả' : 'Trả lương'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Không có dữ liệu lương</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchData(p); }} />
        </div>
      </div>

      {showUpdateModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Cập nhật lương</h3>
              <button onClick={() => { setShowUpdateModal(false); setSelectedStaff(null); setNewSalary(''); }}
                className="p-2 hover:bg-slate-100 rounded-lg">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Lương cập nhật <span className="text-red-500">*</span></label>
                <input type="number" value={newSalary} onChange={(e) => { setNewSalary(e.target.value); setErrors({}); }}
                  onBlur={handleBlur}
                  className={`w-full p-3 border ${errors.newSalary ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} placeholder="Nhập lương mới" min="0" />
                {errors.newSalary && <p className="text-red-500 text-sm mt-1">{errors.newSalary}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" onClick={() => { setShowUpdateModal(false); setSelectedStaff(null); setNewSalary(''); }}
                sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
                Hủy
              </Button>
              <Button variant="contained" onClick={handleSubmitUpdate}
                sx={{ flex: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2 }}>
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}