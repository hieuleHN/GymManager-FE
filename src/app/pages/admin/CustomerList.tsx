import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Search, Edit, Trash2, Eye, X, Check, X as XIcon, Clock, Package, Star, ScanFace, Loader2, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';

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
  faceDescriptor?: number[];
}

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  features: string[];
  durations: { months: number; discount: number }[];
  disciplineId?: { _id: string; name: string };
  locationId?: { _id: string; title: string };
  is_active: boolean;
}

function FaceRegisterModal({
  customer,
  isOpen,
  onClose,
  onSuccess
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !customer) return null;

  const handleCaptureAndRegister = async () => {
    if (!webcamRef.current || !webcamRef.current.video) return;

    setLoading(true);
    setError('');

    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      const video = webcamRef.current.video;
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Không phát hiện khuôn mặt rõ ràng. Vui lòng nhìn thẳng vào camera!');
        setLoading(false);
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);
      const backendUrl = getApiUrl() || 'http://localhost:5000';

      const res = await axios.post(`${backendUrl}/api/checkin/face/register`, {
        customerId: customer._id,
        faceDescriptor: descriptorArray
      }, { headers: getAuthHeaders() });

      if (res.status === 200) {
        setSuccess(true);
        toast.success(`Đã đăng ký FaceID thành công cho ${customer.fullName}`);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Đăng ký khuôn mặt thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ScanFace className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Đăng ký khuôn mặt FaceID</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Hội viên: <b className="text-indigo-600">{customer.fullName}</b></p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-3 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-emerald-600 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <p className="font-bold text-sm">Đăng ký FaceID thành công!</p>
          </div>
        ) : (
          <>
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black relative mb-4 border border-slate-200">
              <Webcam
                ref={webcamRef}
                audio={false}
                className="w-full h-full object-cover"
                screenshotFormat="image/jpeg"
              />
              <div className="absolute inset-0 border-2 border-dashed border-indigo-400/70 rounded-full m-8 pointer-events-none" />
            </div>

            <button
              onClick={handleCaptureAndRegister}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {loading ? 'Đang trích xuất dữ liệu...' : 'Chụp và Lưu FaceID'}
            </button>
          </>
        )}
      </div>
    </div>
  );
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
  const [showRegModal, setShowRegModal] = useState(false);
  const [regCustomer, setRegCustomer] = useState<Customer | null>(null);
  const [regPackages, setRegPackages] = useState<PackageItem[]>([]);
  const [regSelectedPkg, setRegSelectedPkg] = useState<PackageItem | null>(null);
  const [regSelectedDuration, setRegSelectedDuration] = useState<{ months: number; discount: number } | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { selectedClub } = useClub();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [faceModal, setFaceModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null
  });

  const backendUrl = getApiUrl() || 'http://localhost:5000';

  const fetchCustomers = async (p = page) => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${backendUrl}/api/customers${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() as any });
      const data = await res.json();
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch { }
  };

  useEffect(() => { setPage(1); fetchCustomers(1); }, [selectedClub]);

  const fetchReviews = async (customerId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${backendUrl}/api/reviews/customer/${customerId}`, {
        headers: getAuthHeaders() as any
      });
      const data = await res.json();
      setCustomerReviews(Array.isArray(data) ? data : []);
    } catch { setCustomerReviews([]); }
    setLoadingReviews(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
    ));
  };

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    if (activeTab === 'all') return matchSearch;
    return matchSearch && c.status === activeTab;
  });

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/customers/${id}/approve`, { method: 'POST', headers: getAuthHeaders() as any });
      if (res.ok) {
        toast.success('Đã xác nhận khách hàng!');
        fetchCustomers(page);
      }
    } catch { }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await fetch(`${backendUrl}/api/customers/${rejectTarget}/reject`, {
        method: 'POST',
        headers: {
          ...(getAuthHeaders() as any),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason || 'Thông tin không đúng' })
      });
      if (res.ok) {
        toast.success('Đã từ chối khách hàng!');
        setShowRejectModal(false);
        setRejectTarget(null);
        setRejectReason('');
        fetchCustomers(page);
      }
    } catch { }
  };

  const openRegModal = async (customer: Customer) => {
    setRegCustomer(customer);
    setRegSelectedPkg(null);
    setRegSelectedDuration(null);
    setShowRegModal(true);
    try {
      const res = await fetch(`${backendUrl}/api/packages?page=1&limit=50`, {
        headers: getAuthHeaders() as any
      });
      const json = await res.json();
      const list = json?.data || (Array.isArray(json) ? json : []);
      setRegPackages(list.filter((p: PackageItem) => p.is_active));
    } catch { }
  };

  const handleRegSubmit = async () => {
    if (!regCustomer || !regSelectedPkg || !regSelectedDuration) {
      toast.error('Vui lòng chọn đầy đủ thông tin!');
      return;
    }
    setRegSubmitting(true);
    try {
      const body = {
        customerId: regCustomer._id,
        package_id: regSelectedPkg._id,
        locationId: (regCustomer as any).locationId || (selectedClub !== 'all' ? selectedClub : null),
        duration_months: regSelectedDuration.months,
        total_price: regSelectedPkg.unitPrice * regSelectedDuration.months * (1 - (regSelectedDuration.discount || 0) / 100),
        signature: ''
      };

      const res = await fetch(`${backendUrl}/api/user-packages/admin-register`, {
        method: 'POST',
        headers: {
          ...(getAuthHeaders() as any),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Đăng ký thất bại!');
      toast.success('Đăng ký gói tập thành công!');
      setShowRegModal(false);
      fetchCustomers(page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() as any });
      if (res.ok) {
        toast.success('Đã xóa khách hàng!');
        fetchCustomers(page);
      }
    } catch { }
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
          <p className="text-slate-600">Quản lý thông tin khách hàng và FaceID</p>
        </div>

        <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-x-auto">
          {(['all', 'pending', 'pending_approval', 'approved', 'rejected'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFaceModal({ open: true, customer })}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Đăng ký FaceID"
                        >
                          <ScanFace className="w-4 h-4" />
                        </button>

                        <button onClick={() => { setSelectedCustomer(customer); fetchReviews(customer._id); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Chi tiết">
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
                        {customer.status === 'approved' && (
                          <button onClick={() => openRegModal(customer)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Đăng ký gói tập">
                            <Package className="w-4 h-4" />
                          </button>
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

        <FaceRegisterModal
          isOpen={faceModal.open}
          customer={faceModal.customer}
          onClose={() => setFaceModal({ open: false, customer: null })}
          onSuccess={() => fetchCustomers(page)}
        />

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
                        <img src={`${backendUrl}/uploads/customers/${selectedCustomer.idCardFront}`} alt="Front" className="w-full rounded-xl border border-slate-200" />
                      </div>
                    )}
                    {selectedCustomer.idCardBack && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Mặt sau căn cước</p>
                        <img src={`${backendUrl}/uploads/customers/${selectedCustomer.idCardBack}`} alt="Back" className="w-full rounded-xl border border-slate-200" />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" /> Đánh giá của khách hàng
                  </h3>
                  {loadingReviews ? (
                    <p className="text-sm text-slate-500">Đang tải...</p>
                  ) : customerReviews.length === 0 ? (
                    <p className="text-sm text-slate-400">Chưa có đánh giá nào</p>
                  ) : (
                    <div className="space-y-3">
                      {customerReviews.map((r: any) => (
                        <div key={r._id} className="p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex">{renderStars(r.rating)}</div>
                            <span className="text-sm font-semibold text-slate-900">{r.trainerId?.fullName || 'HLV'}</span>
                          </div>
                          {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                          <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

        {showRegModal && regCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRegModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Đăng ký gói tập cho {regCustomer.fullName}</h2>
                <button onClick={() => setShowRegModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">1. Chọn gói tập</h3>
                  <select
                    value={regSelectedPkg?._id || ''}
                    onChange={(e) => {
                      const pkg = regPackages.find(p => p._id === e.target.value) || null;
                      setRegSelectedPkg(pkg);
                      if (pkg?.durations?.length > 0) setRegSelectedDuration(pkg.durations[0]);
                      else setRegSelectedDuration({ months: 1, discount: 0 });
                    }}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn gói tập --</option>
                    {regPackages.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} - {p.unitPrice?.toLocaleString('vi-VN')}đ/tháng
                        {p.disciplineId?.name ? ` (${p.disciplineId.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {regSelectedPkg && (
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">2. Thông tin gói tập</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Tên gói:</strong> {regSelectedPkg.name}</p>
                      <p><strong>Đơn giá:</strong> {regSelectedPkg.unitPrice?.toLocaleString('vi-VN')}đ / tháng</p>
                      {regSelectedPkg.features?.length > 0 && (
                        <div>
                          <strong>Quyền lợi:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1 text-slate-600">
                            {regSelectedPkg.features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {regSelectedPkg && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">3. Chọn thời gian tập</h3>
                    {regSelectedPkg.durations && regSelectedPkg.durations.length > 0 ? (
                      <>
                        {regSelectedPkg.durations.some(d => d.months >= 12) && (
                          <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                              onClick={() => {
                                const monthlyDurs = regSelectedPkg.durations.filter(d => d.months < 12);
                                if (monthlyDurs.length > 0) {
                                  const stillExists = monthlyDurs.some(d => d.months === regSelectedDuration?.months);
                                  if (!stillExists) setRegSelectedDuration(monthlyDurs[0]);
                                }
                              }}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${(regSelectedDuration?.months || 1) < 12
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                              Theo tháng
                            </button>
                            <button
                              onClick={() => {
                                const yearlyDurs = regSelectedPkg.durations.filter(d => d.months >= 12);
                                if (yearlyDurs.length > 0) {
                                  const stillExists = yearlyDurs.some(d => d.months === regSelectedDuration?.months);
                                  if (!stillExists) setRegSelectedDuration(yearlyDurs[0]);
                                }
                              }}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${(regSelectedDuration?.months || 0) >= 12
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                              Theo năm
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {regSelectedPkg.durations
                            .filter(d => (regSelectedDuration?.months || 1) < 12 ? d.months < 12 : d.months >= 12)
                            .map((dur, idx) => {
                              const isSelected = regSelectedDuration?.months === dur.months && regSelectedDuration?.discount === dur.discount;
                              const price = regSelectedPkg.unitPrice * dur.months * (1 - (dur.discount || 0) / 100);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setRegSelectedDuration(dur)}
                                  className={`p-4 rounded-xl border-2 transition-all text-center ${isSelected
                                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                  <div className="font-bold text-slate-900 mb-1">{dur.months} tháng</div>
                                  <div className="text-xl font-extrabold text-indigo-600 mb-1">
                                    {price.toLocaleString('vi-VN')}đ
                                  </div>
                                  {dur.discount > 0 && (
                                    <div className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                      -{dur.discount}%
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-xl border-2 border-slate-200 bg-white text-center">
                        <div className="font-bold text-slate-900 mb-1">1 tháng</div>
                        <div className="text-xl font-extrabold text-indigo-600 mb-1">
                          {regSelectedPkg.unitPrice?.toLocaleString('vi-VN') || '0'}đ
                        </div>
                        <div className="text-xs text-slate-400">Giá mặc định</div>
                      </div>
                    )}
                  </div>
                )}

                {regSelectedPkg && regSelectedDuration && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-600">Tổng tiền:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {(regSelectedPkg.unitPrice * regSelectedDuration.months * (1 - (regSelectedDuration.discount || 0) / 100)).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {regSelectedDuration.discount > 0 && (
                      <div className="text-right text-sm text-green-600 mb-4">
                        Đã giảm {regSelectedDuration.discount}%
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outlined" onClick={() => setShowRegModal(false)}
                        sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
                        Hủy
                      </Button>
                      <Button variant="contained" onClick={handleRegSubmit} disabled={regSubmitting}
                        sx={{ flex: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2 }}>
                        {regSubmitting ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}