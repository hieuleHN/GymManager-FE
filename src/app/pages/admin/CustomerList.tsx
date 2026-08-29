import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Search, Edit, Trash2, Eye, X, Check, X as XIcon, Clock, Package, Star, ScanFace, Loader2, Camera, ArrowRightLeft, Lock, KeyRound } from 'lucide-react';
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
  const [kpi, setKpi] = useState<any>(null);
  const [detail360, setDetail360] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'packages' | 'checkins' | 'payment'>('info');
  const [freezeMonthsAll, setFreezeMonthsAll] = useState(2);
  const [freezingPkgId, setFreezingPkgId] = useState<string | null>(null);
  const [freezeMonthsSingle, setFreezeMonthsSingle] = useState(2);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMonths, setBulkMonths] = useState(2);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferCustomer, setTransferCustomer] = useState<Customer | null>(null);
  const [transferPackageId, setTransferPackageId] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelCustomer, setCancelCustomer] = useState<Customer | null>(null);
  const [cancelPackageId, setCancelPackageId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNoRefund, setCancelNoRefund] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showLockerModal, setShowLockerModal] = useState(false);
  const [lockerCustomer, setLockerCustomer] = useState<Customer | null>(null);
  const [lockers, setLockers] = useState<any[]>([]);
  const [selectedLocker, setSelectedLocker] = useState('');
  const [lockerDays, setLockerDays] = useState(7);
  const [lockerReason, setLockerReason] = useState('');
  const [lockerSubmitting, setLockerSubmitting] = useState(false);
  const [lockerFee, setLockerFee] = useState(0);
  const [filterNoActive, setFilterNoActive] = useState(false);
  const [filterNoFace, setFilterNoFace] = useState(false);

  const backendUrl = getApiUrl() || 'http://localhost:5000';

  const fetchCustomers = async (p = page) => {
    try {
      const params = new URLSearchParams();
      if (selectedClub !== 'all') params.set('locationId', selectedClub);
      params.set('page', String(p));
      params.set('limit', '15');
      if (filterNoActive) params.set('hasActivePackage', 'false');
      if (filterNoFace) params.set('hasFaceId', 'false');
      const url = `${backendUrl}/api/customers?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() as any });
      const data = await res.json();
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch { }
  };

  const fetchKpi = async () => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '';
      const res = await fetch(`${backendUrl}/api/customers/kpi${base}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (res.ok) setKpi(data);
    } catch {}
  };

  const fetchDetail360 = async (customerId: string) => {
    setLoading360(true);
    try {
      const res = await fetch(`${backendUrl}/api/customers/${customerId}/detail360`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (res.ok) setDetail360(data);
      else setDetail360(null);
    } catch { setDetail360(null); }
    setLoading360(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCustomers.map(c => c._id)));
  };
  const handleBulkLock = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Khóa ${selectedIds.size} tài khoản?`)) return;
    const res = await fetch(`${backendUrl}/api/customers/bulk/lock`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
    const d = await res.json(); if (!res.ok) toast.error(d.error); else { toast.success(d.message); setSelectedIds(new Set()); fetchCustomers(page); fetchKpi(); }
  };
  const handleBulkUnlock = async () => {
    if (!selectedIds.size) return;
    const res = await fetch(`${backendUrl}/api/customers/bulk/unlock`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
    const d = await res.json(); if (!res.ok) toast.error(d.error); else { toast.success(d.message); setSelectedIds(new Set()); fetchCustomers(page); fetchKpi(); }
  };
  const handleBulkFreeze = async () => {
    if (!selectedIds.size) return;
    const res = await fetch(`${backendUrl}/api/customers/bulk/freeze`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds), months: bulkMonths }) });
    const d = await res.json(); if (!res.ok) toast.error(d.error); else { toast.success(d.message); setSelectedIds(new Set()); }
  };
  const handleBulkUnfreeze = async () => {
    if (!selectedIds.size) return;
    const res = await fetch(`${backendUrl}/api/customers/bulk/unfreeze`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
    const d = await res.json(); if (!res.ok) toast.error(d.error); else { toast.success(d.message); setSelectedIds(new Set()); }
  };

  const openTransferModal = async (customer: Customer, pkgId?: string) => {
    setTransferCustomer(customer); setTransferPackageId(pkgId||''); setTransferRecipient(''); setTransferReason(''); setShowTransferModal(true);
    if (!detail360 || detail360.customer?._id !== customer._id) await fetchDetail360(customer._id);
  };
  const handleTransferSubmit = async () => {
    if (!transferCustomer || !transferPackageId || !transferRecipient.trim()) { toast.error('Chọn gói và nhập người nhận (SĐT/tài khoản)'); return; }
    setTransferSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/customers/${transferCustomer._id}/transfer-request`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: transferPackageId, recipient: transferRecipient.trim(), reason: transferReason })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      toast.success('Đã tạo yêu cầu chuyển nhượng -> admin/services chờ duyệt'); setShowTransferModal(false);
    } catch (e:any) { toast.error(e.message); } finally { setTransferSubmitting(false); }
  };
  const openCancelModal = (customer: Customer, pkgId: string) => {
    setCancelCustomer(customer); setCancelPackageId(pkgId); setCancelReason(''); setCancelNoRefund(false); setShowCancelModal(true);
  };
  const handleCancelSubmit = async () => {
    if (!cancelCustomer || !cancelPackageId) { toast.error('Thiếu gói'); return; }
    setCancelSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/customers/${cancelCustomer._id}/cancel-refund-request`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: cancelPackageId, reason: cancelReason, noRefund: cancelNoRefund })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      toast.success('Đã tạo yêu cầu hủy/hoàn phí -> admin/services chờ duyệt'); setShowCancelModal(false);
    } catch (e:any) { toast.error(e.message); } finally { setCancelSubmitting(false); }
  };
  const openLockerModal = async (customer: Customer) => {
    setLockerCustomer(customer); setSelectedLocker(''); setLockerDays(7); setLockerReason(''); setLockerFee(0); setShowLockerModal(true);
    try {
      const res = await fetch(`${backendUrl}/api/v2/lockers`, { headers: getAuthHeaders() as any });
      const data = await res.json(); setLockers(data.data || []);
      // Lấy phí tủ như hội viên (memberLocationId)
      const locId = (customer as any).locationId || selectedClub;
      if (locId && locId !== 'all') {
        const feeRes = await fetch(`${getApiUrl()}/api/locations/${locId}/services`);
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          const cfg = (feeData.serviceFees||[]).find((f:any)=>f.service_type==='locker');
          if (cfg && cfg.hasFee) setLockerFee(Math.floor(Number(cfg.fee)||0));
        }
      }
    } catch { setLockers([]); }
  };
  const handleLockerSubmit = async () => {
    if (!lockerCustomer || !selectedLocker) { toast.error('Chọn tủ'); return; }
    const locker = lockers.find(l=>l._id===selectedLocker);
    setLockerSubmitting(true);
    try {
      // Cho thuê luôn, không qua phê duyệt
      const res = await fetch(`${backendUrl}/api/v2/lockers/${selectedLocker}/assign`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personType: 'MEMBER', name: lockerCustomer.fullName, phone: lockerCustomer.phone, rentalDays: lockerDays, note: lockerReason })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.message||d.error||'Gán tủ thất bại');
      // Ghi lại lịch sử dịch vụ đã cho thuê (accepted)
      await fetch(`${backendUrl}/api/customers/${lockerCustomer._id}/locker-request`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId: selectedLocker, lockerNumber: locker?.lockerNumber||'', durationDays: lockerDays, reason: lockerReason })
      }).catch(()=>{});
      // Cập nhật ServiceRequest vừa tạo thành accepted để không chờ duyệt
      try {
        const listRes = await fetch(`${getApiUrl()}/api/service-requests?service_type=locker&status=pending&limit=5`, { headers: getAuthHeaders() as any });
        if (listRes.ok) {
          const listData = await listRes.json();
          const pending = (listData.data||[]).find((r:any)=> r.customer_id?._id===lockerCustomer._id && r.data?.lockerId===selectedLocker);
          if (pending) {
            await fetch(`${getApiUrl()}/api/service-requests/${pending._id}`, { method: 'PATCH', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accepted' }) });
          }
        }
      } catch {}
      toast.success(`Đã cho thuê tủ ${locker?.lockerNumber} cho ${lockerCustomer.fullName} ${lockerDays} ngày`); setShowLockerModal(false);
    } catch (e:any) { toast.error(e.message); } finally { setLockerSubmitting(false); }
  };

  const handleFreeze = async (pkgId: string, months: number) => {
    if (!months || months < 1 || months > 10) { toast.error('Vui lòng chọn 1-10 tháng'); return; }
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/packages/${pkgId}/freeze`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ months })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); setFreezingPkgId(null); fetchDetail360(selectedCustomer!._id);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleUnfreeze = async (pkgId: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/packages/${pkgId}/unfreeze`, { method: 'POST', headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); fetchDetail360(selectedCustomer!._id);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleFreezeAll = async () => {
    if (!freezeMonthsAll || freezeMonthsAll<1 || freezeMonthsAll>10) { toast.error('Chọn 1-10 tháng'); return; }
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/freeze-all`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: freezeMonthsAll })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); fetchDetail360(selectedCustomer!._id);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleUnfreezeAll = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/unfreeze-all`, { method: 'POST', headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); fetchDetail360(selectedCustomer!._id);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleLock = async () => {
    if (!confirm('Khóa tài khoản? Mọi hoạt động sẽ tạm dừng và gói sẽ được bảo lưu.')) return;
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/lock`, { method: 'POST', headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); fetchDetail360(selectedCustomer!._id); fetchCustomers(page);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleUnlock = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer?._id}/unlock`, { method: 'POST', headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message); fetchDetail360(selectedCustomer!._id); fetchCustomers(page);
    } catch (e:any) { toast.error(e.message); }
  };

  useEffect(() => { setPage(1); fetchCustomers(1); fetchKpi(); }, [selectedClub, filterNoActive, filterNoFace]);

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
        fetchKpi();
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
        fetchKpi();
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
        fetchKpi();
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
          <p className="text-slate-600">Quản lý thông tin khách hàng và FaceID - KPI giữ chân & ARPU</p>
        </div>

        {/* KPI 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng hội viên</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kpi ? kpi.totalMembers.toLocaleString('vi-VN') : '-'}</p>
            <p className="text-xs text-slate-400 mt-1">Đang hoạt động: {kpi ? kpi.activeMembers : '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mới tháng này</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{kpi ? kpi.newThisMonth : '-'}</p>
            <p className={`text-xs mt-1 ${kpi && kpi.change?.newMembers > 0 ? 'text-green-600' : kpi && kpi.change?.newMembers < 0 ? 'text-red-600' : 'text-slate-400'}`}>{kpi ? `${kpi.change.newMembers > 0 ? '+' : ''}${kpi.change.newMembers}% vs tháng trước` : ''}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ mua lại gói tập</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{kpi ? `${kpi.retentionRate}%` : '-'}</p>
            <p className="text-xs text-slate-400 mt-1">Không mua lại: {kpi ? `${100 - kpi.retentionRate}%` : '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ARPU tháng này</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{kpi ? `${kpi.arpu.toLocaleString('vi-VN')}đ` : '-'}</p>
            <p className="text-xs text-slate-400 mt-1">Doanh thu: {kpi ? `${kpi.cashThisMonth.toLocaleString('vi-VN')}đ` : '-'}</p>
          </div>
        </div>

        <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-x-auto items-center">
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
          <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />
          <button onClick={() => setFilterNoActive(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border ${filterNoActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            Chưa có gói
          </button>
          <button onClick={() => setFilterNoFace(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border ${filterNoFace ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            Chưa FaceID
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên, tài khoản, số điện thoại..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-indigo-700">Đã chọn {selectedIds.size}</span>
            <select value={bulkMonths} onChange={(e)=>setBulkMonths(parseInt(e.target.value))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
              {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} tháng</option>)}
            </select>
            <button onClick={handleBulkFreeze} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">Đóng băng</button>
            <button onClick={handleBulkUnfreeze} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">Kích hoạt</button>
            <button onClick={handleBulkLock} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Khóa TK</button>
            <button onClick={handleBulkUnlock} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold">Kích hoạt TK</button>
            <button onClick={()=>setSelectedIds(new Set())} className="ml-auto px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">Bỏ chọn</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-4"><input type="checkbox" checked={selectedIds.size===filteredCustomers.length && filteredCustomers.length>0} onChange={toggleSelectAll} /></th>
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
                    <td className="px-3 py-4"><input type="checkbox" checked={selectedIds.has(customer._id)} onChange={()=>toggleSelect(customer._id)} /></td>
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

                        <button onClick={() => { setSelectedCustomer(customer); setDetailTab('info'); fetchReviews(customer._id); fetchDetail360(customer._id); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Chi tiết 360°">
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
                        <button onClick={() => openLockerModal(customer)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg" title="Thuê tủ">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(customer._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">Không tìm thấy khách hàng nào</td></tr>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedCustomer(null); setDetail360(null); }}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Hồ sơ 360° - {selectedCustomer.fullName || selectedCustomer.account}</h2>
                <button onClick={() => { setSelectedCustomer(null); setDetail360(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* LTV summary */}
              {detail360 && (
                <div className="mx-6 mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center">
                    <p className="text-xs text-indigo-600 font-semibold">Tổng chi tiêu (LTV)</p>
                    <p className="text-lg font-bold text-indigo-700">{detail360.ltv?.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                    <p className="text-xs text-emerald-600 font-semibold">Số gói đã mua</p>
                    <p className="text-lg font-bold text-emerald-700">{detail360.packageCount}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                    <p className="text-xs text-amber-600 font-semibold">Lượt check-in</p>
                    <p className="text-lg font-bold text-amber-700">{detail360.totalCheckins}</p>
                  </div>
                </div>
              )}

              {/* Dịch vụ: Đóng băng / Khóa */}
              {selectedCustomer && detail360 && (
                <div className="mx-6 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Dịch vụ:</span>
                  <select value={freezeMonthsAll} onChange={(e)=>setFreezeMonthsAll(parseInt(e.target.value))} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white ${detail360.customer.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} tháng</option>)}
                  </select>
                  <button onClick={handleFreezeAll} disabled={detail360.customer.status === 'locked'} className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>Đóng băng toàn bộ</button>
                  <button onClick={handleUnfreezeAll} disabled={detail360.customer.status === 'locked'} className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Kích hoạt toàn bộ</button>
                  <div className="ml-auto">
                    {detail360.customer.status === 'locked' ? (
                      <button onClick={handleUnlock} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold">Kích hoạt TK</button>
                    ) : (
                      <button onClick={handleLock} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Khóa TK</button>
                    )}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="px-6 pt-4 flex gap-2 border-b border-slate-100">
                {(['info','packages','checkins','payment'] as const).map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab)} className={`px-4 py-2 rounded-t-xl text-sm font-semibold border-b-2 ${detailTab===tab?'border-indigo-600 text-indigo-600 bg-indigo-50':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {tab==='info'?'Thông tin':tab==='packages'?`Gói tập (${detail360?.packages?.length||0})`:tab==='checkins'?`Check-in (${detail360?.checkins?.length||0})`:'Thanh toán'}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-6">
                {detailTab==='info' && (
                  <>
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


                  </>
                )}

                {detailTab==='packages' && (
                  <div>
                    {loading360 ? <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải...</p> :
                      !detail360?.packages?.length ? <p className="text-sm text-slate-400">Chưa có gói tập nào</p> :
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">Lịch sử: {detail360.packages.length} gói (đang tập + đã tập + gia hạn) • Mỗi gói hiển thị trạng thái / còn lại / ngày kết thúc</p>
                        {detail360.packages.map((p:any)=>{
                          const statusColor = p.status==='đang hoạt động'?'bg-emerald-100 text-emerald-700': p.status==='còn 10 ngày'?'bg-amber-100 text-amber-700': p.status==='đang tạm ngưng'?'bg-slate-200 text-slate-700': p.status==='hết hạn'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-500';
                          return (
                          <div key={p._id} className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{p.packageName} {p.isFrozen && <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-white text-xs">Đang đóng băng</span>}</p>
                                <p className="text-xs text-slate-500 mt-1">Từ {new Date(p.start_date).toLocaleDateString('vi-VN')} đến <b className="text-slate-700">{new Date(p.end_date).toLocaleDateString('vi-VN')}</b> {p.location?`• ${p.location}`:''}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{p.status}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.payment_status==='đã thanh toán'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{p.payment_status}</span>
                                  {p.daysLeft !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.daysLeft>10?'bg-emerald-50 text-emerald-700 border border-emerald-200': p.daysLeft>0?'bg-amber-50 text-amber-700 border border-amber-200':'bg-red-50 text-red-700 border border-red-200'}`}>
                                      {p.daysLeft>0?`Còn ${p.daysLeft} ngày`:`Quá hạn ${Math.abs(p.daysLeft)} ngày`}
                                    </span>
                                  )}
                                  {p.isFrozen && p.frozenUntil && <span className="text-xs text-slate-500">• Đóng băng đến {new Date(p.frozenUntil).toLocaleDateString('vi-VN')}</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-indigo-600">{p.total_price?.toLocaleString('vi-VN')}đ</p>
                                {(() => {
                                  const isCancelled = p.status === 'đã hủy';
                                  const isExpired = p.status === 'hết hạn' || (p.daysLeft !== undefined && p.daysLeft < 0) || new Date(p.end_date) < new Date();
                                  if (isCancelled) return null;
                                  if (isExpired) return (
                                  <div className="mt-2 flex flex-col items-end gap-1">
                                    <div className="flex gap-1">
                                      <button disabled className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed">Đóng băng</button>
                                      <span className="px-2 py-1.5 text-xs text-slate-400">•</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button disabled className="px-2 py-1 rounded-lg text-xs font-bold border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed">Chuyển</button>
                                      <button onClick={async ()=>{
                                        if (!confirm('Hủy gói đã hết hạn này?')) return;
                                        try {
                                          const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer!._id}/cancel-refund-request`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: p._id, reason: '', noRefund: true }) });
                                          const d = await res.json(); if (!res.ok) throw new Error(d.error);
                                          toast.success('Đã tạo yêu cầu hủy (hết hạn) -> admin/services');
                                        } catch(e:any){ toast.error(e.message); }
                                      }} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1 rounded-lg text-xs font-bold border ${detail360.customer.status === 'locked' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>Hủy</button>
                                    </div>
                                  </div>
                                  );
                                  if (p.isFrozen) return (
                                  <button onClick={()=>handleUnfreeze(p._id)} disabled={detail360.customer.status === 'locked'} className={`mt-2 px-3 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Kích hoạt</button>
                                  );
                                  if (freezingPkgId === p._id) return (
                                  <div className="mt-2 flex items-center gap-1">
                                    <select value={freezeMonthsSingle} onChange={(e)=>setFreezeMonthsSingle(parseInt(e.target.value))} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white ${detail360.customer.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                      {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} tháng</option>)}
                                    </select>
                                    <button onClick={()=>handleFreeze(p._id, freezeMonthsSingle)} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>OK</button>
                                    <button onClick={()=>setFreezingPkgId(null)} className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs">Hủy</button>
                                  </div>
                                  );
                                  return (
                                  <button onClick={()=>{ setFreezingPkgId(p._id); setFreezeMonthsSingle(2); }} disabled={detail360.customer.status === 'locked'} className={`mt-2 px-3 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>Đóng băng</button>
                                  );
                                })()}
                                {(() => {
                                  const isExpired2 = p.status === 'hết hạn' || (p.daysLeft !== undefined && p.daysLeft < 0) || new Date(p.end_date) < new Date();
                                  if (p.status === 'đã hủy' || isExpired2) return null;
                                  return (
                                  <div className="flex gap-1 mt-2 justify-end">
                                    <button onClick={()=>openTransferModal(selectedCustomer!, p._id)} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1 rounded-lg text-xs font-bold border ${detail360.customer.status === 'locked' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'}`}>Chuyển</button>
                                    <button onClick={()=>openCancelModal(selectedCustomer!, p._id)} disabled={detail360.customer.status === 'locked'} className={`px-2 py-1 rounded-lg text-xs font-bold border ${detail360.customer.status === 'locked' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>Hủy</button>
                                  </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    }
                  </div>
                )}

                {detailTab==='checkins' && (
                  <div>
                    {loading360 ? <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải...</p> :
                      !detail360?.checkins?.length ? <p className="text-sm text-slate-400">Chưa có lượt check-in nào (20 gần nhất)</p> :
                      <div className="space-y-2">
                        {detail360.checkins.map((c:any)=>(
                          <div key={c._id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{new Date(c.checkInTime).toLocaleString('vi-VN')}</p>
                              <p className="text-xs text-slate-500">{c.method || 'QR_CODE'} • {c.status}</p>
                            </div>
                            <p className="text-xs text-slate-500">{c.checkOutTime?`Out: ${new Date(c.checkOutTime).toLocaleString('vi-VN')}`:'Chưa out'}</p>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )}

                {detailTab==='payment' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                      <p className="text-sm font-semibold text-indigo-800">Tổng chi tiêu (LTV)</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">{detail360?.ltv?.toLocaleString('vi-VN')||0}đ</p>
                      <p className="text-xs text-slate-500 mt-1">{detail360?.packageCount||0} gói đã thanh toán • Trung bình {detail360?.packageCount?Math.round(detail360.ltv/detail360.packageCount).toLocaleString('vi-VN'):0}đ/gói</p>
                    </div>
                    {detail360?.activePackage && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-sm font-semibold text-emerald-700">Gói đang hoạt động</p>
                        <p className="text-sm text-slate-700 mt-1">{detail360.activePackage.packageName} - hết hạn {new Date(detail360.activePackage.end_date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    )}
                    {!detail360?.activePackage && <p className="text-sm text-slate-400">Không có gói đang hoạt động</p>}
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

        {showTransferModal && transferCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTransferModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e)=>e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Chuyển nhượng gói tập</h2>
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{transferCustomer.fullName}</b> - sẽ tạo yêu cầu tại <b>admin/services</b> chờ duyệt</p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">Gói sẽ chuyển</p>
                  <p className="font-semibold text-slate-900">{(detail360?.packages||[]).find((p:any)=>p._id===transferPackageId)?.packageName || '—'} {transferPackageId ? `• ${new Date((detail360?.packages||[]).find((p:any)=>p._id===transferPackageId)?.end_date).toLocaleDateString('vi-VN')} (còn ${(detail360?.packages||[]).find((p:any)=>p._id===transferPackageId)?.daysLeft} ngày)` : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Người nhận (SĐT hoặc tài khoản)</label>
                  <input value={transferRecipient} onChange={(e)=>setTransferRecipient(e.target.value)} placeholder="0901234567 hoặc taikhoan" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do</label>
                  <textarea value={transferReason} onChange={(e)=>setTransferReason(e.target.value)} rows={2} placeholder="Lý do chuyển nhượng..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outlined" onClick={()=>setShowTransferModal(false)} sx={{flex:1, borderColor:'#cbd5e1', color:'#475569', textTransform:'none', borderRadius:2}}>Hủy</Button>
                <Button variant="contained" onClick={handleTransferSubmit} disabled={transferSubmitting} sx={{flex:1, bgcolor:'#f59e0b', '&:hover':{bgcolor:'#d97706'}, textTransform:'none', borderRadius:2}}>{transferSubmitting?'Đang gửi...':'Tạo yêu cầu'}</Button>
              </div>
            </div>
          </div>
        )}

        {showCancelModal && cancelCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e)=>e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Hủy gói / Hoàn phí</h2>
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{cancelCustomer.fullName}</b> - sẽ tạo yêu cầu tại <b>admin/services</b> chờ duyệt</p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">Gói sẽ hủy</p>
                  <p className="font-semibold text-slate-900">{(detail360?.packages||[]).find((p:any)=>p._id===cancelPackageId)?.packageName || '—'} {cancelPackageId ? `• ${new Date((detail360?.packages||[]).find((p:any)=>p._id===cancelPackageId)?.end_date).toLocaleDateString('vi-VN')}` : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do hủy</label>
                  <textarea value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} rows={3} placeholder="Lý do hủy gói..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cancelNoRefund} onChange={(e)=>setCancelNoRefund(e.target.checked)} className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-medium text-slate-700">Không hoàn tiền</span>
                  <span className="text-xs text-slate-400">(tích nếu hủy không hoàn)</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outlined" onClick={()=>setShowCancelModal(false)} sx={{flex:1, borderColor:'#cbd5e1', color:'#475569', textTransform:'none', borderRadius:2}}>Hủy</Button>
                <Button variant="contained" onClick={handleCancelSubmit} disabled={cancelSubmitting} sx={{flex:1, bgcolor:'#dc2626', '&:hover':{bgcolor:'#b91c1c'}, textTransform:'none', borderRadius:2}}>{cancelSubmitting?'Đang gửi...':'Tạo yêu cầu'}</Button>
              </div>
            </div>
          </div>
        )}

        {showLockerModal && lockerCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLockerModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Thuê tủ đồ</h2>
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{lockerCustomer.fullName}</b> - sẽ tạo yêu cầu tại <b>admin/services</b> chờ duyệt</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn tủ trống</label>
                  {(() => {
                    const available = lockers.filter((l:any)=>l.status==='AVAILABLE');
                    if (!available.length) return <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">Hiện tại không còn tủ nào trống tại cơ sở của khách.</div>;
                    const rows = available.reduce((acc: Record<string, any[]>, l:any)=>{ const p=l.prefix||'LK'; if(!acc[p]) acc[p]=[]; acc[p].push(l); return acc; }, {} as Record<string, any[]>);
                    return (
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-3">
                        {Object.keys(rows).sort().map(prefix=>(
                          <div key={prefix}>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dãy {prefix}</p>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                              {rows[prefix].map((l:any)=>(
                                <button key={l._id} type="button" onClick={()=>setSelectedLocker(l._id)} className={`p-2 rounded-lg text-sm font-semibold border transition-colors ${selectedLocker===l._id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>{l.lockerNumber}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {selectedLocker && <p className="mt-2 text-sm text-cyan-700 font-medium">Đã chọn: Tủ {lockers.find((l:any)=>l._id===selectedLocker)?.lockerNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Thời gian thuê</label>
                  <select value={lockerDays} onChange={(e)=>setLockerDays(parseInt(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {Array.from({length:19},(_,i)=>i+2).map(d=><option key={d} value={d}>{d} ngày</option>)}
                  </select>
                </div>
                {lockerFee > 0 && (
                  <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 p-4 rounded-xl">
                    <div>
                      <p className="text-sm text-cyan-800"><strong>{lockerFee.toLocaleString('vi-VN')}₫</strong> / ngày</p>
                      <p className="text-xs text-cyan-700 mt-0.5">Tổng cho {lockerDays} ngày</p>
                    </div>
                    <p className="text-lg font-bold text-cyan-800">{(lockerFee * lockerDays).toLocaleString('vi-VN')}₫</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outlined" onClick={()=>setShowLockerModal(false)} sx={{flex:1, borderColor:'#cbd5e1', color:'#475569', textTransform:'none', borderRadius:2}}>Hủy</Button>
                <Button variant="contained" onClick={handleLockerSubmit} disabled={lockerSubmitting || !selectedLocker} sx={{flex:1, bgcolor:'#06b6d4', '&:hover':{bgcolor:'#0891b2'}, textTransform:'none', borderRadius:2}}>{lockerSubmitting?'Đang thuê...':'Cho thuê'}</Button>
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