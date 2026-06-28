import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Edit2, Save, X, Loader2, Check, X as XIcon, Search, FileText, User, Package, MapPin } from 'lucide-react';
import { Button } from '@mui/material';
import { AdminLayout } from '../../components/AdminLayout';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { toast } from 'sonner';

interface PaymentData {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  qrImage: string;
}

interface Registration {
  _id: string;
  customer_id: { _id: string; fullName: string; email: string; phone: string; account: string };
  package_id: { _id: string; name: string; unitPrice: number };
  locationId: { _id: string; title: string };
  duration_months: number;
  total_price: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  payment_expires_at: string;
  contract_pdf: string;
  createdAt: string;
}

const emptyPayment: PaymentData = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  branch: '',
  qrImage: '',
};

export function PaymentManagement() {
  const { selectedClub, clubs } = useClub();
  const headers = getAuthHeaders();

  const [activeTab, setActiveTab] = useState<'bank' | 'qr' | 'registrations'>('bank');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isEditingQR, setIsEditingQR] = useState(false);
  const [payment, setPayment] = useState<PaymentData>(emptyPayment);
  const [loading, setLoading] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  // Registration approval state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [regFilter, setRegFilter] = useState<'all' | 'pending_payment' | 'paid_pending' | 'active' | 'cancelled'>('all');

  const selectedClubData = clubs.find(c => c._id === selectedClub);

  useEffect(() => {
    if (!selectedClub || selectedClub === 'all') {
      setPayment(emptyPayment);
      setIsEditingBank(false);
      setIsEditingQR(false);
      return;
    }
    const fetchPayment = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/${selectedClub}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPayment({
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          branch: data.branch || '',
          qrImage: data.qrImage || '',
        });
      } catch {
        toast.error('Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [selectedClub]);

  const handleBankSave = async () => {
    if (!selectedClub || selectedClub === 'all') return;
    setSavingBank(true);
    try {
      const res = await fetch(`/api/locations/${selectedClub}/payment`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: payment.bankName,
          accountNumber: payment.accountNumber,
          accountName: payment.accountName,
          branch: payment.branch,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Cập nhật thông tin chuyển khoản thành công!');
      setIsEditingBank(false);
    } catch {
      toast.error('Lưu thông tin thất bại');
    } finally {
      setSavingBank(false);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClub || selectedClub === 'all') return;

    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append('qrImage', file);
      const res = await fetch(`/api/locations/${selectedClub}/qr`, {
        method: 'POST',
        headers: { Authorization: headers?.Authorization || '' },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setPayment(prev => ({ ...prev, qrImage: data.qrImage }));
      toast.success('Cập nhật mã QR thành công!');
      setIsEditingQR(false);
    } catch {
      toast.error('Tải ảnh QR thất bại');
    } finally {
      setUploadingQR(false);
    }
  };

  const qrImageUrl = payment.qrImage
    ? `/uploads/locations/${payment.qrImage}`
    : '';

  // Registration approval
  const fetchRegistrations = async () => {
    setRegLoading(true);
    try {
      let url = `${getApiUrl()}/api/user-packages/all`;
      if (selectedClub !== 'all') url += `?locationId=${selectedClub}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setRegistrations(data?.data || []);
    } catch {}
    setRegLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab, selectedClub]);

  const handleApproveReg = async (id: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/${id}/approve`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); fetchRegistrations(); }
      else toast.error(data.error);
    } catch { toast.error('Lỗi hệ thống!'); }
  };

  const handleRejectReg = async (id: string) => {
    if (!confirm('Từ chối đăng ký này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/${id}/approve`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); fetchRegistrations(); }
      else toast.error(data.error);
    } catch { toast.error('Lỗi hệ thống!'); }
  };

  const filteredRegs = registrations.filter(r => {
    const matchSearch = !searchTerm ||
      r.customer_id?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_id?.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.package_id?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (regFilter === 'all') return true;
    if (regFilter === 'pending_payment') return r.status === 'chờ xác nhận' && r.payment_status === 'pending';
    if (regFilter === 'paid_pending') return r.status === 'chờ xác nhận' && r.payment_status === 'paid';
    if (regFilter === 'active') return r.status === 'đang hoạt động' || r.status === 'còn 10 ngày';
    if (regFilter === 'cancelled') return r.status === 'đã hủy';
    return true;
  });

  const formatPrice = (p: number) => (p || 0).toLocaleString('vi-VN') + 'đ';
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  const regCount = (filter: string) => {
    if (filter === 'all') return registrations.length;
    if (filter === 'pending_payment') return registrations.filter(r => r.status === 'chờ xác nhận' && r.payment_status === 'pending').length;
    if (filter === 'paid_pending') return registrations.filter(r => r.status === 'chờ xác nhận' && r.payment_status === 'paid').length;
    if (filter === 'active') return registrations.filter(r => r.status === 'đang hoạt động' || r.status === 'còn 10 ngày').length;
    if (filter === 'cancelled') return registrations.filter(r => r.status === 'đã hủy').length;
    return 0;
  };

  const regStatusBadge = (reg: Registration) => {
    if (reg.status === 'đang hoạt động' || reg.status === 'còn 10 ngày')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">{reg.status}</span>;
    if (reg.status === 'chờ xác nhận' && reg.payment_status === 'paid')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Đã thanh toán - chờ duyệt</span>;
    if (reg.status === 'chờ xác nhận' && reg.payment_status === 'pending')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Chưa thanh toán</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{reg.status}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý thanh toán</h1>
          <p className="text-slate-600 mt-2">
            {selectedClub === 'all'
              ? 'Vui lòng chọn một cơ sở từ dropdown phía trên'
              : `Quản lý thông tin thanh toán: ${selectedClubData?.address || ''}`
            }
          </p>
        </div>

        {selectedClub === 'all' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            <p className="text-lg font-medium">Chọn một cơ sở phòng tập từ dropdown góc phải trên cùng để quản lý thanh toán</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'bank'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Chuyển khoản
                </div>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'qr'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Mã QR
                </div>
              </button>
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'registrations'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Xác nhận đăng ký
                </div>
              </button>
            </div>

            {/* Bank Transfer Tab */}
            {activeTab === 'bank' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Thông tin chuyển khoản</h2>
                  {!isEditingBank ? (
                    <button
                      onClick={() => setIsEditingBank(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleBankSave}
                        disabled={savingBank}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu
                      </button>
                      <button
                        onClick={() => setIsEditingBank(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tên ngân hàng
                    </label>
                    {isEditingBank ? (
                      <input
                        type="text"
                        value={payment.bankName}
                        onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 text-lg font-semibold">{payment.bankName || 'Chưa cập nhật'}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Số tài khoản
                      </label>
                      {isEditingBank ? (
                        <input
                          type="text"
                          value={payment.accountNumber}
                          onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-900 text-lg font-mono font-bold">{payment.accountNumber || 'Chưa cập nhật'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tên tài khoản
                      </label>
                      {isEditingBank ? (
                        <input
                          type="text"
                          value={payment.accountName}
                          onChange={(e) => setPayment({ ...payment, accountName: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-900 text-lg font-semibold">{payment.accountName || 'Chưa cập nhật'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Chi nhánh
                    </label>
                    {isEditingBank ? (
                      <input
                        type="text"
                        value={payment.branch}
                        onChange={(e) => setPayment({ ...payment, branch: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 text-lg">{payment.branch || 'Chưa cập nhật'}</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-2">Lưu ý khi chuyển khoản</h3>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Vui lòng ghi rõ nội dung chuyển khoản: "Họ tên + Số điện thoại"</li>
                    <li>• Thanh toán sẽ được xác nhận trong vòng 5-10 phút</li>
                    <li>• Liên hệ hotline nếu cần hỗ trợ: 1900 1234</li>
                  </ul>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Mã QR thanh toán</h2>
                  {!isEditingQR ? (
                    <button
                      onClick={() => setIsEditingQR(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Thay đổi QR
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Lưu
                      </button>
                      <button
                        onClick={() => setIsEditingQR(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code"
                        className="w-80 h-80 object-contain border-4 border-slate-200 rounded-2xl shadow-lg"
                      />
                    ) : (
                      <div className="w-80 h-80 border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                        <QrCode className="w-16 h-16" />
                      </div>
                    )}
                    {isEditingQR && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <label className="cursor-pointer bg-white px-6 py-3 rounded-lg font-medium text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-2">
                          {uploadingQR && <Loader2 className="w-4 h-4 animate-spin" />}
                          {uploadingQR ? 'Đang tải...' : 'Chọn ảnh mới'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQRUpload}
                            className="hidden"
                            disabled={uploadingQR}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 text-center max-w-md">
                    <h3 className="font-semibold text-slate-900 mb-2">Hướng dẫn quét QR</h3>
                    <p className="text-sm text-slate-600">
                      Mở ứng dụng ngân hàng trên điện thoại, chọn chức năng quét mã QR và hướng camera vào mã QR trên để thực hiện thanh toán nhanh chóng.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
              <div className="space-y-6">
                {/* Filter tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                  <div className="flex gap-2 overflow-x-auto">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'pending_payment', label: 'Chưa thanh toán' },
                      { key: 'paid_pending', label: 'Chờ duyệt' },
                      { key: 'active', label: 'Đang hoạt động' },
                      { key: 'cancelled', label: 'Đã hủy' }
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setRegFilter(tab.key as typeof regFilter)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                          regFilter === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}>
                        {tab.label}
                        {regCount(tab.key) > 0 && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            regFilter === tab.key ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {regCount(tab.key)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Tìm kiếm hội viên, gói tập..."
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Table */}
                {regLoading ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <p className="text-slate-500">Đang tải...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Hội viên</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Gói tập</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thời hạn</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Tổng tiền</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cơ sở</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày đăng ký</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegs.map((reg, index) => (
                            <tr key={reg._id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{reg.customer_id?.fullName || reg.customer_id?.account || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{reg.customer_id?.phone || ''}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-indigo-400" />
                                  <span className="text-sm font-medium text-slate-900">{reg.package_id?.name || 'Đã xóa'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{reg.duration_months} tháng</td>
                              <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{formatPrice(reg.total_price)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <MapPin className="w-3 h-3" />
                                  {reg.locationId?.title || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{formatDate(reg.createdAt)}</td>
                              <td className="px-6 py-4">{regStatusBadge(reg)}</td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 items-center">
                                  {reg.status === 'chờ xác nhận' && reg.payment_status === 'paid' && (
                                    <>
                                      <button onClick={() => handleApproveReg(reg._id)}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Xác nhận">
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleRejectReg(reg._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Từ chối">
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  {reg.contract_pdf && (
                                    <a href={`${getApiUrl()}/api/user-packages/${reg._id}/contract-pdf?token=${encodeURIComponent(JSON.parse(localStorage.getItem('auth_user') || '{}').token || '')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem PDF">
                                      <FileText className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredRegs.length === 0 && (
                            <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Không có đăng ký nào</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
