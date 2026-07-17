import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Search, Edit, Trash2, Eye, X, Check, X as XIcon, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

interface Customer {
  _id: string;
  account: string;
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
  idCardFront?: string;
  idCardBack?: string;
  registerDate: string;
  status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'locked';
  rejectionReason?: string;
  createdAt: string;
}

export function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'pending_approval' | 'approved' | 'rejected'>('all');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const { selectedClub } = useClub();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomers = async (p = page) => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${getApiUrl()}/api/customers${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => { setPage(1); fetchCustomers(1); }, [selectedClub]);

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    if (activeTab === 'all') return matchSearch;
    return matchSearch && c.status === activeTab;
  });

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/${id}/approve`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        alert('Đã xác nhận khách hàng!');
        fetchCustomers(page);
      }
    } catch {}
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/${rejectTarget}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: rejectReason || 'Thông tin không đúng' })
      });
      if (res.ok) {
        alert('Đã từ chối khách hàng!');
        setShowRejectModal(false);
        setRejectTarget(null);
        setRejectReason('');
        fetchCustomers(page);
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        alert('Đã xóa khách hàng!');
        fetchCustomers(page);
      }
    } catch {}
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      locked: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      pending: 'Chưa điền TT',
      pending_approval: 'Chờ xác nhận',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      locked: 'Đã khóa'
    };
    return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || ''}`}>{labels[status] || status}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách khách hàng</h1>
          <p className="text-slate-600">Quản lý thông tin khách hàng</p>
        </div>

        <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-x-auto">
          {(['all', 'pending', 'pending_approval', 'approved', 'rejected'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {tab === 'all' ? 'Tất cả' : tab === 'pending' ? 'Chưa điền TT' : tab === 'pending_approval' ? 'Chờ xác nhận' : tab === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              {tab === 'pending_approval' && customers.filter(c => c.status === 'pending_approval').length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => c.status === 'pending_approval').length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên, tài khoản, số điện thoại..." value={searchTerm}
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Giới tính</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Số điện thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.fullName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.account}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.gender || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.registerDate ? new Date(customer.registerDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.email || '-'}</td>
                    <td className="px-6 py-4">{statusBadge(customer.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedCustomer(customer)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/admin/customers/${customer._id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        {customer.status === 'pending_approval' && (
                          <>
                            <button onClick={() => handleApprove(customer._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Chấp nhận">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setRejectTarget(customer._id); setShowRejectModal(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Từ chối">
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(customer._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Không tìm thấy khách hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchCustomers(p); }} />
        </div>

        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Chi tiết khách hàng</h2>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Họ và tên</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.fullName || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Tài khoản</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.account}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Giới tính</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.gender || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Số điện thoại</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Số căn cước</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.idNumber || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Ngày đăng ký</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.registerDate ? new Date(selectedCustomer.registerDate).toLocaleDateString('vi-VN') : ''}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Trạng thái</p>
                    <p className="text-lg font-semibold">{statusBadge(selectedCustomer.status)}</p>
                  </div>
                  {selectedCustomer.rejectionReason && (
                    <div className="bg-red-50 p-4 rounded-xl md:col-span-2">
                      <p className="text-sm text-red-600 mb-1">Lý do từ chối</p>
                      <p className="text-lg font-semibold text-red-700">{selectedCustomer.rejectionReason}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Địa chỉ</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedCustomer.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                {(selectedCustomer.idCardFront || selectedCustomer.idCardBack) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    {selectedCustomer.idCardFront && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Mặt trước căn cước</p>
                        <img src={`${getApiUrl()}/uploads/customers/${selectedCustomer.idCardFront}`} alt="Front" className="w-full rounded-xl border border-slate-200" />
                      </div>
                    )}
                    {selectedCustomer.idCardBack && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Mặt sau căn cước</p>
                        <img src={`${getApiUrl()}/uploads/customers/${selectedCustomer.idCardBack}`} alt="Back" className="w-full rounded-xl border border-slate-200" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Từ chối khách hàng</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý do từ chối</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập lý do từ chối..." />
              </div>
              <div className="flex gap-3">
                <Button variant="outlined" onClick={() => setShowRejectModal(false)}
                  sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
                  Hủy
                </Button>
                <Button variant="contained" onClick={handleReject} color="error"
                  sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}>
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
