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
  baseSalary: number;
  bonus: number;
  attendanceBonus: number;
  latePenalty: number;
  commissionPackage: number;
  commissionPT: number;
  revenueShare: number;
  totalSalary: number;
  isPaid: boolean;
  salaryId: string | null;
}

interface FormFields {
  baseSalary: string;
  bonus: string;
  attendanceBonus: string;
  latePenalty: string;
  commissionPackage: string;
  commissionPT: string;
  revenueShare: string;
}

const emptyForm: FormFields = {
  baseSalary: '', bonus: '', attendanceBonus: '', latePenalty: '',
  commissionPackage: '', commissionPT: '', revenueShare: ''
};

export function StaffSalary() {
  const [staffList, setStaffList] = useState<SalaryDetail[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<SalaryDetail | null>(null);
  const [form, setForm] = useState<FormFields>(emptyForm);
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
    setForm({
      baseSalary: String(staff.baseSalary),
      bonus: String(staff.bonus),
      attendanceBonus: String(staff.attendanceBonus),
      latePenalty: String(staff.latePenalty),
      commissionPackage: String(staff.commissionPackage),
      commissionPT: String(staff.commissionPT),
      revenueShare: String(staff.revenueShare),
    });
    setErrors({});
    setShowUpdateModal(true);
  };

  const handleChange = (key: keyof FormFields, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const { [key]: _, ...rest } = prev; return rest; });
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const fields: (keyof FormFields)[] = ['baseSalary', 'bonus', 'attendanceBonus', 'latePenalty', 'commissionPackage', 'commissionPT', 'revenueShare'];
    for (const key of fields) {
      const val = form[key];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        newErrors[key] = 'Vui lòng nhập số hợp lệ';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitUpdate = async () => {
    if (!validateAll()) return;
    try {
      const body: any = { staffId: selectedStaff?._id };
      const fields: (keyof FormFields)[] = ['baseSalary', 'bonus', 'attendanceBonus', 'latePenalty', 'commissionPackage', 'commissionPT', 'revenueShare'];
      for (const key of fields) {
        if (form[key] !== '') body[key] = Number(form[key]);
      }
      const res = await fetch(`${getApiUrl()}/api/salary/update`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Cập nhật lương thành công!');
      setShowUpdateModal(false);
      setSelectedStaff(null);
      fetchData(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePaySalary = async (staffId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/salary/pay`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ staffId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Trả lương thành công! Các khoản đã được reset về 0.');
      fetchData(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết lương nhân viên</h1>
          <p className="text-slate-600">Quản lý thông tin lương của nhân viên</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-left font-bold text-slate-900">STT</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-900">Họ tên</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-900">CV</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-900">Lương CB</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-900">Đi làm đủ</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-900">HH bán gói</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-900">Hoa hồng dạy</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-900">Doanh thu</th>
                  <th className="px-3 py-3 text-right font-bold text-red-600">Phạt</th>
                  <th className="px-3 py-3 text-right font-bold text-indigo-600">Tổng</th>
                  <th className="px-3 py-3 text-center font-bold text-slate-900">TT</th>
                  <th className="px-3 py-3 text-center font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s, i) => (
                  <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-900">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">{s.name}</td>
                    <td className="px-3 py-3 text-indigo-600 font-semibold text-xs">{s.job}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{fmt(s.baseSalary)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(s.attendanceBonus)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(s.commissionPackage)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(s.commissionPT)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(s.revenueShare)}</td>
                    <td className="px-3 py-3 text-right text-red-500 font-semibold">{s.latePenalty ? `-${fmt(s.latePenalty)}` : '0₫'}</td>
                    <td className="px-3 py-3 text-right text-indigo-600 font-bold">{fmt(s.totalSalary)}</td>
                    <td className="px-3 py-3 text-center">
                      {s.isPaid ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold">Đã trả</span> : <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-semibold">Chưa</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 justify-center">
                        <Button variant="outlined" onClick={() => handleUpdateSalary(s)}
                          sx={{ borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' }, textTransform: 'none', borderRadius: 1.5, px: 1.5, py: 0.5, fontSize: '0.75rem', minWidth: 0 }}>
                          Sửa
                        </Button>
                        <Button variant="contained" onClick={() => handlePaySalary(s._id)} disabled={s.isPaid}
                          sx={{ bgcolor: s.isPaid ? '#10b981' : '#4f46e5', '&:hover': { bgcolor: s.isPaid ? '#059669' : '#4338ca' }, textTransform: 'none', borderRadius: 1.5, px: 1.5, py: 0.5, fontSize: '0.75rem', minWidth: 0 }}>
                          {s.isPaid ? 'Đã trả' : 'Trả'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">Không có dữ liệu lương</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchData(p); }} />
        </div>
      </div>

      {showUpdateModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Cập nhật lương - {selectedStaff.name}</h3>
              <button onClick={() => { setShowUpdateModal(false); setSelectedStaff(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {([['baseSalary', 'Lương cơ bản'], ['bonus', 'Thưởng thêm'], ['attendanceBonus', 'Đi làm đủ'],
                ['commissionPackage', 'Hoa hồng bán gói tập'], ['commissionPT', 'Hoa hồng dạy'],
                ['revenueShare', 'Doanh thu chi nhánh'], ['latePenalty', 'Phạt đi muộn/về sớm']] as [keyof FormFields, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input type="number" value={form[key]} onChange={e => handleChange(key, e.target.value)}
                    className={`w-full p-2.5 border ${errors[key] ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="0" min="0" />
                  {errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
                </div>
              ))}
              <div className="bg-indigo-50 rounded-xl p-3 mt-2">
                <p className="text-sm font-semibold text-indigo-700">
                  Tổng: {fmt(
                    (Number(form.baseSalary) || 0) + (Number(form.bonus) || 0) +
                    (Number(form.attendanceBonus) || 0) + (Number(form.commissionPackage) || 0) +
                    (Number(form.commissionPT) || 0) + (Number(form.revenueShare) || 0) -
                    (Number(form.latePenalty) || 0)
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" onClick={() => { setShowUpdateModal(false); setSelectedStaff(null); }}
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
