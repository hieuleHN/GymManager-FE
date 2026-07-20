import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

interface SalaryRecord {
  _id: string;
  staffId: { _id: string; fullName: string };
  baseSalary: number;
  bonus: number;
  totalSalary: number;
  month: number;
  year: number;
  paidAt: string;
  paidBy: { _id: string; fullName: string };
}

export function StaffSalaryHistory() {
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = async (p = page) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/salary/history?page=${p}&limit=15`, { headers: getAuthHeaders() });
      const data = await res.json();
      setHistory(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => { fetchHistory(1); }, []);

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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tháng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền được thưởng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tổng tiền lương</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Đã trả vào ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Người trả</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.staffId?.fullName || 'Đã xóa'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">Tháng {record.month}/{record.year}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">{record.bonus.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{record.baseSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{record.totalSalary.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(record.paidAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.paidBy?.fullName || 'Hệ thống'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Chưa có lịch sử trả lương</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchHistory(p); }} />
        </div>
      </div>
    </AdminLayout>
  );
}