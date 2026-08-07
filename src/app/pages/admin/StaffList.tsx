import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

interface Staff {
  _id: string;
  account: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  job: { _id: string; name: string; salary: number };
  startDate: string;
  address: string;
  status: string;
  baseSalary: number;
  avatar?: string;
}

export function StaffList() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedClub } = useClub();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchStaff = async (p = page) => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${getApiUrl()}/api/staff${base}${base.endsWith('?') ? '' : '&'}page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setStaff(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => {
    setPage(1);
    fetchStaff(1);
    fetchReportCounts();
  }, [selectedClub]);

  const fetchReportCounts = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/reports?page=1&limit=1000`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const reports = data?.data || (Array.isArray(data) ? data : []);
      const counts: Record<string, number> = {};
      reports.forEach((r: any) => {
        const targetId = r.targetId?._id || r.targetId;
        if (targetId) counts[targetId] = (counts[targetId] || 0) + 1;
      });
      setReportCounts(counts);
    } catch {}
    setLoadingReports(false);
  };

  const filteredStaff = staff.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.job?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.account?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        alert('Đã xóa nhân viên!');
        fetchStaff(page);
      }
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách nhân viên</h1>
          <p className="text-slate-600">Quản lý thông tin nhân viên</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên, tài khoản, chức vụ, email..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Họ và tên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tài khoản</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Công việc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giới tính</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Địa chỉ</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Báo cáo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person, index) => (
                  <tr key={person._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-100">
                          {person.avatar ? (
                            <img src={person.avatar} alt={person.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-600">
                              {person.fullName?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{person.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.account}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{person.job?.name || 'Chưa xác định'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.gender}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{person.address}</td>
                    <td className="px-6 py-4 text-center">
                      {reportCounts[person._id] > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {reportCounts[person._id]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{loadingReports ? '-' : '0'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/admin/staff/${person._id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(person._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">Không tìm thấy nhân viên nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchStaff(p); }} />
        </div>
      </div>
    </AdminLayout>
  );
}