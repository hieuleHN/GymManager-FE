import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Button } from '@mui/material';
import { Search, Edit, Eye, X, Check, X as XIcon, Clock, Package, Star, ScanFace, Loader2, Camera, ArrowRightLeft, Lock, KeyRound, UserCheck, LogIn, LogOut, AlertTriangle, CreditCard, Wallet, Receipt, CalendarDays, Banknote } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'pending' | 'pending_approval' | 'approved' | 'rejected'>('all');
  const [expiringIds, setExpiringIds] = useState<Set<string>>(new Set());
  const [expiringCount, setExpiringCount] = useState(0);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regCustomer, setRegCustomer] = useState<Customer | null>(null);
  const [regPackages, setRegPackages] = useState<PackageItem[]>([]);
  const [regSelectedPkg, setRegSelectedPkg] = useState<PackageItem | null>(null);
  const [regSelectedDuration, setRegSelectedDuration] = useState<{ months: number; discount: number } | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regSearch, setRegSearch] = useState('');
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
  const [detailTab, setDetailTab] = useState<'info' | 'packages' | 'checkins' | 'payment' | 'timeline'>('info');
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
  const [todayCheckMap, setTodayCheckMap] = useState<Map<string, { count: number; latest: any; sessions: any[] }>>(new Map());
  const [checkDetail, setCheckDetail] = useState<{ customer: Customer; sessions: any[] } | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'new' | 'present' | 'left'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'package' | 'locker' | 'service' | 'wallet'>('all');
  // Gia hạn đúng gói - chọn kỳ hạn từ bảng giá
  const [renewTarget, setRenewTarget] = useState<any>(null);
  const [renewPkgDetail, setRenewPkgDetail] = useState<any>(null);
  const [renewDuration, setRenewDuration] = useState<{ months: number; discount: number } | null>(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);
  // Nâng cấp - chọn gói cao cấp hơn cùng bộ môn
  const [upgradeTarget, setUpgradeTarget] = useState<any>(null);
  const [upgradeList, setUpgradeList] = useState<any[]>([]);
  const [upgradePkgDetail, setUpgradePkgDetail] = useState<any>(null);
  const [selectedUpgradePkg, setSelectedUpgradePkg] = useState<any>(null);
  const [upgradeCalc, setUpgradeCalc] = useState<any>(null);
  const [upgradeCalculating, setUpgradeCalculating] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);

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

  const fetchTodayChecks = async () => {
    try {
      const params = new URLSearchParams(); params.set('limit','300');
      if (selectedClub !== 'all') params.set('locationId', selectedClub);
      const res = await fetch(`${backendUrl}/api/checkin/history?${params.toString()}`, { headers: getAuthHeaders() as any });
      const list = await res.json();
      let arr: any[] = Array.isArray(list) ? list : (list.data || []);
      // Fallback lọc theo CLB nếu BE chưa hỗ trợ locationId (chỉ hiện đúng CLB)
      if (selectedClub !== 'all') {
        arr = arr.filter((it:any)=>{
          const loc = String(it.locationId?._id || it.locationId || it.location_id || '');
          return loc === String(selectedClub);
        });
      }
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const map = new Map<string, { count: number; latest: any; sessions: any[] }>();
      arr.forEach((item: any) => {
        if (!item.checkInTime) return;
        const t = new Date(item.checkInTime);
        if (t < start) return;
        const cid = String(item.customerId?._id || item.customerId || item.customer_id || '');
        if (!cid) return;
        if (!map.has(cid)) map.set(cid, { count: 0, latest: null, sessions: [] });
        const entry = map.get(cid)!;
        entry.sessions.push(item);
      });
      map.forEach((v) => {
        v.sessions.sort((a: any, b: any) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
        v.count = v.sessions.length;
        v.latest = v.sessions[v.sessions.length - 1] || null;
      });
      setTodayCheckMap(map);
    } catch {}
  };

  const fetchExpiring = async () => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '';
      const res = await fetch(`${backendUrl}/api/customers/alerts${base}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (res.ok) {
        const arr = data.expiring_soon || [];
        const idSet = new Set<string>(arr.map((x:any)=> String(x.customer?._id || x.customer || '')).filter(Boolean));
        setExpiringIds(idSet);
        setExpiringCount(idSet.size);
      }
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
  const handleBulkClearFace = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Xóa FaceID của ${selectedIds.size} tài khoản? Tài khoản sẽ trở về chưa có FaceID (test quét sẽ không nhận diện nữa).`)) return;
    const res = await fetch(`${backendUrl}/api/customers/bulk/clear-face`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
    const d = await res.json(); if (!res.ok) toast.error(d.error); else { toast.success(d.message); setSelectedIds(new Set()); fetchCustomers(page); fetchKpi(); }
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
      toast.success(d.message || 'Đã chuyển nhượng thành công (Thành công - do nhân viên tạo)'); setShowTransferModal(false); fetchDetail360(transferCustomer._id); fetchCustomers(page);
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
      toast.success(d.message || 'Đã hủy gói thành công (Thành công - do nhân viên tạo)');
      // Cập nhật ngay lập tức không cần F5
      setDetail360((prev:any)=> prev && prev.customer?._id===cancelCustomer._id ? { ...prev, packages: (prev.packages||[]).map((x:any)=> String(x._id)===String(cancelPackageId) ? { ...x, status: 'đã hủy', payment_status: 'đã hủy', daysLeft: undefined } : x) } : prev);
      setShowCancelModal(false);
      fetchDetail360(cancelCustomer._id);
      fetchCustomers(page); fetchExpiring();
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
      // Cho thuê luôn, không qua phê duyệt - duyệt thẳng vào Tất cả
      const res = await fetch(`${backendUrl}/api/v2/lockers/${selectedLocker}/assign`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personType: 'MEMBER', name: lockerCustomer.fullName, phone: lockerCustomer.phone, rentalDays: lockerDays, note: lockerReason })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.message||d.error||'Gán tủ thất bại');
      // Ghi lại lịch sử dịch vụ đã cho thuê (đã duyệt thẳng, hiển thị ở Tất cả)
      await fetch(`${backendUrl}/api/customers/${lockerCustomer._id}/locker-request`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId: selectedLocker, lockerNumber: locker?.lockerNumber||'', durationDays: lockerDays, reason: lockerReason })
      }).catch(()=>{});
      toast.success(`Đã cho thuê tủ ${locker?.lockerNumber} cho ${lockerCustomer.fullName} ${lockerDays} ngày (Thành công - do nhân viên tạo)`); setShowLockerModal(false);
      // Refresh chi tiết để tab Thanh toán hiển thị ngay lịch sử thuê tủ mới
      fetchCustomers(page);
      if (lockerCustomer) {
        // nếu đang mở hồ sơ 360° của chính khách vừa thuê thì refresh ngay, nếu không vẫn preload để lần mở sau có dữ liệu mới
        fetchDetail360(lockerCustomer._id);
        if (selectedCustomer && selectedCustomer._id === lockerCustomer._id) setDetailTab('payment');
      }
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

  // Gia hạn đúng gói - lấy bảng giá thực tế của gói
  const openRenewModal = async (pkg: any) => {
    setRenewTarget(pkg);
    setRenewPkgDetail(null);
    setRenewDuration(null);
    try {
      const pid = pkg.packageId || pkg.package_id;
      if (!pid) { toast.error('Không tìm thấy mã gói'); return; }
      const res = await fetch(`${getApiUrl()}/api/packages/${pid}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được gói');
      setRenewPkgDetail(data);
      if (data.durations?.length) setRenewDuration(data.durations[0]);
      else setRenewDuration({ months: 1, discount: 0 });
    } catch (e:any) { toast.error(e.message); }
  };
  const handleRenewConfirm = async () => {
    if (!renewTarget || !renewDuration || !selectedCustomer) return;
    setRenewSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/admin-renew`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer._id, registrationId: renewTarget._id, duration_months: renewDuration.months })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Gia hạn thất bại');
      toast.success(`Đã gia hạn ${renewDuration.months} tháng - ${d.pricing ? d.pricing.total_price.toLocaleString('vi-VN')+'đ' : ''}`);
      setRenewTarget(null); setRenewPkgDetail(null);
      fetchDetail360(selectedCustomer._id); fetchCustomers(page); fetchExpiring();
    } catch (e:any) { toast.error(e.message); } finally { setRenewSubmitting(false); }
  };

  // Nâng cấp - chọn gói cao cấp hơn cùng bộ môn, tính toán chênh lệch
  const openUpgradeModal = async (pkg: any) => {
    const isExpired = pkg.status === 'hết hạn' || (pkg.daysLeft !== undefined && pkg.daysLeft < 0) || (pkg.end_date && new Date(pkg.end_date) < new Date());
    if (isExpired) { toast.error('Gói đã hết hạn - vui lòng Gia hạn trước khi Nâng cấp'); return; }
    setUpgradeTarget(pkg);
    setSelectedUpgradePkg(null); setUpgradeCalc(null); setUpgradeList([]); setUpgradePkgDetail(null);
    try {
      const pid = pkg.packageId || pkg.package_id;
      if (!pid) { toast.error('Không tìm thấy mã gói'); return; }
      const detailRes = await fetch(`${getApiUrl()}/api/packages/${pid}`, { headers: getAuthHeaders() as any });
      const detail = await detailRes.json();
      if (detailRes.ok) setUpgradePkgDetail(detail);
      // Lấy danh sách gói cùng bộ môn để nâng cấp
      const listRes = await fetch(`${getApiUrl()}/api/packages?page=1&limit=50`, { headers: getAuthHeaders() as any });
      const listData = await listRes.json();
      const list = listData?.data || (Array.isArray(listData) ? listData : []);
      const currentIds = new Set<string>();
      if (detail?.disciplineId) currentIds.add(detail.disciplineId?._id || detail.disciplineId);
      (detail?.disciplines || []).forEach((d:any)=> currentIds.add(d?._id || d));
      let candidates = list.filter((p:any)=> p.is_active && String(p._id) !== String(pid));
      if (currentIds.size) {
        candidates = candidates.filter((p:any)=> {
          if (p.combo) return (p.disciplines||[]).some((d:any)=> currentIds.has(d?._id || d));
          return currentIds.has(p.disciplineId?._id || p.disciplineId);
        });
      }
      // Chỉ gói có giá cao hơn (theo đơn giá) mới là nâng cấp
      const currentUnit = detail?.unitPrice || (pkg.total_price ? Math.round(pkg.total_price / (pkg.duration_months ||1)) : 0);
      candidates = candidates.filter((p:any)=> Number(p.unitPrice||0) > currentUnit);
      if (!candidates.length) {
        // fallback: gói giá cao hơn bất kỳ
        const allHigher = (listData?.data||[]).filter((p:any)=> p.is_active && Number(p.unitPrice||0) > currentUnit && String(p._id)!==String(pid));
        candidates = allHigher.slice(0,12);
      }
      setUpgradeList(candidates);
    } catch (e:any) { toast.error(e.message); }
  };
  const handleSelectUpgradePkg = async (pkg:any) => {
    setSelectedUpgradePkg(pkg); setUpgradeCalc(null); setUpgradeCalculating(true);
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/calculate-upgrade`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRegistrationId: upgradeTarget._id, newPackageId: pkg._id })
      });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Tính toán thất bại');
      setUpgradeCalc(data);
    } catch (e:any) { toast.error((e as any).message); setUpgradeCalc({ error: (e as any).message }); } finally { setUpgradeCalculating(false); }
  };
  const handleUpgradeConfirm = async () => {
    if (!upgradeTarget || !selectedUpgradePkg || !selectedCustomer) return;
    setUpgradeSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/admin-upgrade`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer._id, currentRegistrationId: upgradeTarget._id, newPackageId: selectedUpgradePkg._id })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Nâng cấp thất bại');
      toast.success('Đã nâng cấp gói thành công');
      setUpgradeTarget(null); setSelectedUpgradePkg(null); setUpgradeCalc(null);
      fetchDetail360(selectedCustomer._id); fetchCustomers(page); fetchExpiring();
    } catch (e:any) { toast.error(e.message); } finally { setUpgradeSubmitting(false); }
  };

  useEffect(() => { setPage(1); fetchCustomers(1); fetchKpi(); fetchExpiring(); }, [selectedClub, filterNoActive, filterNoFace]);

  useEffect(() => { fetchExpiring(); const iv = setInterval(fetchExpiring, 30000); return () => clearInterval(iv); }, [selectedClub]);

  useEffect(() => {
    fetchTodayChecks();
    const id = setInterval(fetchTodayChecks, 10000);
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
    const midnightTimer = setTimeout(() => { setTodayCheckMap(new Map()); fetchTodayChecks(); }, msUntilMidnight);
    let channel: any = null;
    try {
      channel = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
      channel.onmessage = (e: any) => {
        if (e.data?.type === 'CHECKIN_EVENT' || e.data?.type === 'FACE_CHECKIN_TRIGGER') fetchTodayChecks();
      };
    } catch {}
    return () => { clearInterval(id); clearTimeout(midnightTimer); try { channel?.close(); } catch {} };
  }, [selectedClub]);

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

  const attendanceStats = {
    present: Array.from(todayCheckMap.values()).filter(i => i.latest && !i.latest.checkOutTime).length,
    left: Array.from(todayCheckMap.values()).filter(i => i.latest && i.latest.checkOutTime).length,
  };

  const filteredCustomers = customers
    .filter(c => {
      const matchSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm);
      const info = todayCheckMap.get(c._id);
      const isPresent = info && info.latest && !info.latest.checkOutTime;
      const isLeft = info && info.latest && info.latest.checkOutTime;
      if (attendanceFilter === 'new') {
        const d = new Date((c as any).createdAt || c.registerDate);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (attendanceFilter === 'present' && !isPresent) return false;
      else if (attendanceFilter === 'left' && !isLeft) return false;
      if (activeTab === 'all') return matchSearch;
      if (activeTab === 'expiring') return matchSearch && expiringIds.has(c._id);
      return matchSearch && c.status === activeTab;
    })
    .sort((a, b) => {
      const aInfo = todayCheckMap.get(a._id);
      const bInfo = todayCheckMap.get(b._id);
      const aHas = !!aInfo;
      const bHas = !!bInfo;
      if (aHas !== bHas) return bHas ? 1 : -1;
      if (aHas && bHas) {
        const aTime = new Date(aInfo!.latest.checkInTime || aInfo!.latest.createdAt || 0).getTime();
        const bTime = new Date(bInfo!.latest.checkInTime || bInfo!.latest.createdAt || 0).getTime();
        return bTime - aTime;
      }
      return 0;
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
    setRegStep(1);
    setRegSearch('');
    setShowRegModal(true);
    fetchDetail360(customer._id);
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
      if (regCustomer) {
        fetchDetail360(regCustomer._id);
        // nếu đang mở hồ sơ của khách vừa đăng ký, chuyển sang tab Thanh toán để thấy ngay giao dịch mới
        if (selectedCustomer && selectedCustomer._id === regCustomer._id) setDetailTab('payment');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRegSubmitting(false);
    }
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
      <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0 overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách khách hàng</h1>
          <p className="text-slate-600">Quản lý thông tin khách hàng và FaceID - KPI giữ chân & ARPU</p>
        </div>

        {/* 4 box gộp - click để lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
          <button onClick={() => setAttendanceFilter('all')} className={`text-left bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition ${attendanceFilter === 'all' ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-100'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng hội viên</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kpi ? kpi.totalMembers.toLocaleString('vi-VN') : '-'}</p>
            <p className="text-xs text-slate-400 mt-1">Đang hoạt động: {kpi ? kpi.activeMembers : '-'}</p>
          </button>
          <button onClick={() => setAttendanceFilter('new')} className={`text-left bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition ${attendanceFilter === 'new' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mới tháng này</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{kpi ? kpi.newThisMonth : '-'}</p>
            <p className={`text-xs mt-1 ${kpi && kpi.change?.newMembers > 0 ? 'text-green-600' : kpi && kpi.change?.newMembers < 0 ? 'text-red-600' : 'text-slate-400'}`}>{kpi ? `${kpi.change.newMembers > 0 ? '+' : ''}${kpi.change.newMembers}% vs tháng trước` : ''}</p>
          </button>
          <button onClick={() => setAttendanceFilter('present')} className={`text-left bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition ${attendanceFilter === 'present' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-100'}`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><LogIn className="w-5 h-5" /></div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase">Đang ở phòng</p>
              <p className="text-xl font-bold text-emerald-600">{attendanceStats.present}</p>
              <p className="text-xs text-slate-400">Chưa check-out</p>
            </div>
          </button>
          <button onClick={() => setAttendanceFilter('left')} className={`text-left bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition ${attendanceFilter === 'left' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-100'}`}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><LogOut className="w-5 h-5" /></div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase">Đã về</p>
              <p className="text-xl font-bold text-blue-600">{attendanceStats.left}</p>
              <p className="text-xs text-slate-400">Đã check-out</p>
            </div>
          </button>
        </div>

        <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-x-auto items-center w-full max-w-full min-w-0">
          {(['all', 'expiring', 'pending', 'pending_approval', 'approved', 'rejected'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
              {tab === 'all' ? 'Tất cả' : tab === 'expiring' ? 'Sắp hết hạn' : tab === 'pending' ? 'Chưa điền TT' : tab === 'pending_approval' ? 'Chờ xác nhận' : tab === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              {tab === 'pending_approval' && customers.filter(c => c.status === 'pending_approval').length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => c.status === 'pending_approval').length}</span>
              )}
              {tab === 'expiring' && expiringCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white" title={`${expiringCount} khách sắp hết hạn trong 7 ngày`}>
                  {expiringCount > 99 ? '99+' : expiringCount}
                </span>
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full max-w-full min-w-0 overflow-hidden">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên, tài khoản, số điện thoại..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center gap-2 w-full max-w-full min-w-0 overflow-hidden">
            <span className="text-sm font-bold text-indigo-700">Đã chọn {selectedIds.size}</span>
            <select value={bulkMonths} onChange={(e)=>setBulkMonths(parseInt(e.target.value))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
              {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} tháng</option>)}
            </select>
            <button onClick={handleBulkFreeze} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">Đóng băng</button>
            <button onClick={handleBulkUnfreeze} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">Kích hoạt</button>
            <button onClick={handleBulkLock} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Khóa TK</button>
            <button onClick={handleBulkUnlock} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold">Kích hoạt TK</button>
            <button onClick={handleBulkClearFace} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><ScanFace className="w-3.5 h-3.5" /> Bỏ FaceID</button>
            <button onClick={()=>setSelectedIds(new Set())} className="ml-auto px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">Bỏ chọn</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full overscroll-x-contain">
            <table className="w-full min-w-[1100px]">
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
                    <td className="px-6 py-4">
                      {(() => {
                        const info = todayCheckMap.get(customer._id);
                        if (info) {
                          const isCheckedOut = !!info.latest.checkOutTime;
                          const cnt = info.count;
                          const label = isCheckedOut ? (cnt > 1 ? `đã check out lần ${cnt}` : 'đã check out') : (cnt > 1 ? `đã check in lần ${cnt}` : 'đã check in');
                          const color = isCheckedOut ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                          return (
                            <button onClick={() => setCheckDetail({ customer, sessions: info.sessions })} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${color} hover:opacity-80`} title="Xem chi tiết điểm danh">
                              {label}
                            </button>
                          );
                        }
                        return statusBadge(customer.status);
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFaceModal({ open: true, customer })}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Đăng ký FaceID"
                        >
                          <ScanFace className="w-4 h-4" />
                        </button>

                        <button onClick={() => { setSelectedCustomer(customer); setDetailTab('info'); setPaymentFilter('all'); fetchReviews(customer._id); fetchDetail360(customer._id); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Chi tiết 360°">
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
                  <button key={tab} onClick={() => setDetailTab(tab)} className={`px-4 py-2 rounded-t-xl text-sm font-semibold border-b-2 whitespace-nowrap ${detailTab===tab?'border-indigo-600 text-indigo-600 bg-indigo-50':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {tab==='info'?'Thông tin':tab==='packages'?`Gói tập (${detail360?.packages?.length||0})`:tab==='checkins'?`Check-in (${detail360?.checkins?.length||0})`:tab==='payment'?'Thanh toán':'Vòng đời'}
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
                        
                        {/* Cảnh báo sắp hết hạn */}
                        {(() => {
                          const expiring = (detail360.packages || []).filter((p:any) => p.daysLeft !== undefined && p.daysLeft >= 0 && p.daysLeft <= 7 && p.status !== 'đã hủy' && p.status !== 'hết hạn');
                          if (!expiring.length) return null;
                          return (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <p className="text-sm font-bold text-amber-800">Sắp hết hạn ({expiring.length} gói)</p>
                              </div>
                              {expiring.map((p:any) => (
                                <div key={p._id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg p-2.5 mt-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{p.packageName}</p>
                                    <p className="text-xs text-slate-500">Hết hạn {new Date(p.end_date).toLocaleDateString('vi-VN')} • Còn {p.daysLeft} ngày</p>
                                  </div>
                                  <button onClick={async () => {
                                    if(!confirm(`Gửi thông báo sắp hết hạn cho ${p.packageName}?`)) return;
                                    try {
                                      const res = await fetch(`${backendUrl}/api/user-packages/renewal-reminders/send`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ packageIds: [p._id] }) });
                                      const d = await res.json(); if(!res.ok) throw new Error(d.error || 'Gửi thất bại');
                                      toast.success('Đã gửi thông báo sắp hết hạn');
                                    } catch(e:any){ toast.error(e.message); }
                                  }} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">Gửi TB</button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
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
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                <button onClick={()=>openRenewModal(p)} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Gia hạn</button>
                                <span className="px-2.5 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed" title="Gói đã hết hạn - gia hạn trước khi nâng cấp">Nâng cấp</span>
                              </div>
                                    <div className="flex gap-1">
                                      <button disabled className="px-2 py-1 rounded-lg text-xs font-bold border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed">Chuyển</button>
                                      <button onClick={async ()=>{
                                        if (!confirm('Hủy gói đã hết hạn này?')) return;
                                        try {
                                          const res = await fetch(`${backendUrl}/api/customers/${selectedCustomer!._id}/cancel-refund-request`, { method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: p._id, reason: '', noRefund: true }) });
                                          const d = await res.json(); if (!res.ok) throw new Error(d.error);
                                          toast.success(d.message || 'Đã hủy gói thành công');
                                          // Cập nhật ngay không cần load lại trang
                                          setDetail360((prev:any)=> prev ? { ...prev, packages: (prev.packages||[]).map((x:any)=> x._id===p._id ? { ...x, status: 'đã hủy', daysLeft: undefined } : x) } : prev);
                                          fetchDetail360(selectedCustomer!._id); fetchCustomers(page); fetchExpiring();
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
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <button onClick={()=>{ setFreezingPkgId(p._id); setFreezeMonthsSingle(2); }} disabled={detail360.customer.status === 'locked'} className={`px-2.5 py-1.5 text-white rounded-lg text-xs font-bold ${detail360.customer.status === 'locked' ? 'bg-slate-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>Đóng băng</button>
                                    <button onClick={()=>openUpgradeModal(p)} disabled={detail360.customer.status === 'locked'} className={`px-2.5 py-1.5 bg-white text-violet-700 border border-violet-200 rounded-lg text-xs font-bold hover:bg-violet-50 ${detail360.customer.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}`}>Nâng cấp</button>
                                  </div>
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
                  <div className="space-y-3">
                    {/* Tổng quan gọn - 1 dòng */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs">
                      <span className="inline-flex items-center gap-1.5"><span className="text-slate-500">Tổng chi:</span> <b className="text-slate-900">{(detail360?.ltvWithService ?? detail360?.ltv ?? 0).toLocaleString('vi-VN')}đ</b></span>
                      <span className="hidden sm:block w-px h-4 bg-slate-200" />
                      <span><span className="text-slate-500">Gói tập:</span> <b className="text-slate-900">{(detail360?.ltv ?? 0).toLocaleString('vi-VN')}đ</b> <span className="text-slate-400">({detail360?.packageCount||0} gói)</span></span>
                      <span><span className="text-slate-500">Dịch vụ:</span> <b className="text-slate-900">{(detail360?.servicePaidTotal ?? 0).toLocaleString('vi-VN')}đ</b> <span className="text-slate-400">({(detail360?.serviceRequests || []).filter((r:any)=> (r.service_type==='locker' || (r.amount||0)>0)).length} khoản)</span></span>
                      <span className="ml-auto text-slate-500">{detail360?.activePackage ? `Đang hoạt động: ${detail360.activePackage.packageName} • hết hạn ${new Date(detail360.activePackage.end_date).toLocaleDateString('vi-VN')}` : 'Không có gói đang hoạt động'}</span>
                    </div>

                    {/* Header + filter loại */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Lịch sử giao dịch <span className="ml-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-600">{detail360?.payments?.length ?? 0}</span></h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 hidden sm:inline">Lọc:</span>
                        {(['all','package','locker','service','wallet'] as const).map(t => {
                          const label = t==='all'?'Tất cả': t==='package'?'Gói tập': t==='locker'?'Thuê tủ': t==='wallet'?'Ví': 'Dịch vụ khác';
                          return (
                            <button key={t} onClick={()=>setPaymentFilter(t)} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${paymentFilter===t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{label}</button>
                          );
                        })}
                      </div>
                    </div>

                    {loading360 ? (
                      <p className="text-sm text-slate-500 flex items-center gap-2 py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải...</p>
                    ) : !detail360?.payments?.length ? (
                      <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-xl">
                        <p className="text-sm text-slate-500">Chưa có giao dịch nào</p>
                        <p className="text-xs text-slate-400 mt-1">Đăng ký gói/thuê tủ/thuê HLV sẽ hiển thị ở đây</p>
                      </div>
                    ) : (() => {
                      const typeMap: Record<string,string> = { freeze:'Đóng băng', activate:'Kích hoạt', 'reactivate-expired':'Gia hạn', transfer:'Chuyển nhượng', 'change-club':'Đổi CLB', contract:'Hợp đồng', support:'Hỗ trợ', 'cancel-refund':'Hủy/Hoàn phí', locker:'Thuê tủ', complaint:'Khiếu nại', package:'Gói tập', wallet:'Ví' };
                      const filtered = (detail360.payments as any[]).filter((p:any)=> {
                        if (paymentFilter==='all') return true;
                        if (paymentFilter==='service') return p.type==='service' && p.raw?.service_type !== 'locker';
                        return p.type===paymentFilter;
                      });
                      if (!filtered.length) return <div className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">Không có giao dịch loại này</div>;
                      return (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-600">
                                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">#</th>
                                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Loại</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Tên gói / Dịch vụ</th>
                                  <th className="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Kỳ hạn</th>
                                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Số tiền</th>
                                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Ngày mua</th>
                                  <th className="px-3 py-2.5 text-center font-semibold whitespace-nowrap">TT thanh toán</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Hiệu lực / Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filtered.map((pay:any, idx:number)=>{
                                  const payStatus = pay.payment_status || pay.raw?.payment_status || '';
                                  const isPaid = payStatus==='đã thanh toán' || payStatus==='paid' || payStatus==='success';
                                  const isPending = payStatus==='chờ thanh toán' || payStatus==='awaiting_payment' || payStatus==='unpaid';
                                  const isCancelled = payStatus==='đã hủy';
                                  const statusText = isPaid ? 'Đã thanh toán' : isPending ? 'Chờ TT' : isCancelled ? 'Đã hủy' : payStatus || '—';
                                  const statusCls = isPaid ? 'text-emerald-700' : isPending ? 'text-amber-700' : isCancelled ? 'text-red-700' : 'text-slate-500';
                                  const typeLabel = pay.type==='package' ? 'Gói tập' : pay.type==='locker' ? 'Thuê tủ' : pay.type==='wallet' ? 'Ví' : (typeMap[pay.raw?.service_type] || pay.raw?.service_type || 'Dịch vụ');
                                  const dateStr = pay.date ? new Date(pay.date).toLocaleDateString('vi-VN') : '-';
                                  const timeStr = pay.date ? new Date(pay.date).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '';
                                  const amountStr = Number(pay.amount)>0 ? `${Number(pay.amount).toLocaleString('vi-VN')}đ` : '—';
                                  const duration = pay.durationLabel || (pay.raw?.duration_months ? `${pay.raw.duration_months} tháng` : pay.raw?.data?.durationDays ? `${pay.raw.data.durationDays} ngày` : '—');
                                  const note = pay.type==='package' && pay.raw
                                    ? `${pay.raw.start_date ? new Date(pay.raw.start_date).toLocaleDateString('vi-VN') : ''} → ${pay.raw.end_date ? new Date(pay.raw.end_date).toLocaleDateString('vi-VN') : ''}${pay.raw.location ? ` • ${pay.raw.location}` : ''}${pay.raw.price_snapshot?.discount_percent ? ` • -${pay.raw.price_snapshot.discount_percent}%` : ''}`
                                    : pay.type==='locker' && pay.raw
                                    ? `${pay.raw.data?.lockerNumber ? `Tủ #${pay.raw.data.lockerNumber}` : ''}${pay.raw.data?.durationDays ? ` • ${pay.raw.data.durationDays} ngày` : ''}`
                                    : pay.description ? pay.description.slice(0,60) : pay.raw?.description ? String(pay.raw.description).slice(0,60) : '—';
                                  return (
                                    <tr key={`${pay.type}-${pay._id}`} className="hover:bg-slate-50">
                                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{idx+1}</td>
                                      <td className="px-3 py-2.5 whitespace-nowrap"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700">{typeLabel}</span></td>
                                      <td className="px-3 py-2.5 max-w-[220px]"><span className="font-semibold text-slate-900 truncate block" title={pay.title}>{pay.title}</span>{pay.payment_method && <span className="text-slate-400">{pay.payment_method}</span>}</td>
                                      <td className="px-3 py-2.5 text-center text-slate-700 whitespace-nowrap">{duration}</td>
                                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">{amountStr}</td>
                                      <td className="px-3 py-2.5 whitespace-nowrap"><span className="text-slate-900">{dateStr}</span> <span className="text-slate-400">{timeStr}</span></td>
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap"><span className={`inline-flex items-center gap-1 text-xs font-semibold ${statusCls}`}><span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isCancelled ? 'bg-red-500' : 'bg-slate-300'}`} />{statusText}</span></td>
                                      <td className="px-3 py-2.5 text-slate-500 max-w-[220px] truncate" title={note}>{note}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                            <span>Hiển thị {filtered.length}/{detail360.payments.length} giao dịch • Mới nhất lên đầu</span>
                            <span className="hidden sm:inline">Gồm gói tập, thuê tủ, thuê HLV, dịch vụ và mọi khoản tiền</span>
                          </div>
                        </div>
                      );
                    })()}
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
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{transferCustomer.fullName}</b> - sẽ duyệt thẳng, hiển thị ở <b>Tất cả</b> (Thành công)</p>
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
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{cancelCustomer.fullName}</b> - sẽ duyệt thẳng, hiển thị ở <b>Tất cả</b> (Thành công)</p>
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
              <p className="text-sm text-slate-500 mb-4">Khách: <b className="text-indigo-600">{lockerCustomer.fullName}</b> - sẽ duyệt thẳng, hiển thị ở <b>Tất cả</b> (Thành công)</p>
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

        {/* Gia hạn đúng gói - chọn kỳ hạn từ bảng giá */}
        {renewTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e)=>e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gia hạn gói tập</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Gia hạn đúng gói <b className="text-slate-800">{renewTarget.packageName}</b> • Hết hạn {renewTarget.end_date ? new Date(renewTarget.end_date).toLocaleDateString('vi-VN') : ''}</p>
                </div>
                <button onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!renewPkgDetail ? (
                  <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải bảng giá...</p>
                ) : (renewPkgDetail.durations?.length ? (
                  <>
                    <h3 className="text-sm font-bold text-slate-900">Chọn kỳ hạn</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {renewPkgDetail.durations.map((d:any, idx:number)=>{
                        const isSel = renewDuration?.months===d.months && renewDuration?.discount===d.discount;
                        const unit = renewPkgDetail.unitPrice || 0;
                        const total = unit * d.months * (1 - (d.discount||0)/100);
                        const origin = unit * d.months;
                        return (
                          <button key={idx} onClick={()=>setRenewDuration(d)} className={`p-4 rounded-xl border-2 text-left transition ${isSel ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <p className="font-bold text-slate-900">{d.months} tháng</p>
                            <p className="text-lg font-extrabold text-indigo-600 mt-1">{total.toLocaleString('vi-VN')}đ</p>
                            {d.discount>0 ? (
                              <>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">-{d.discount}%</span>
                                <p className="text-xs text-slate-400 line-through">{origin.toLocaleString('vi-VN')}đ</p>
                              </>
                            ) : <p className="text-xs text-slate-400">Không giảm giá</p>}
                          </button>
                        );
                      })}
                    </div>
                    {renewDuration && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between text-sm text-slate-600"><span>Tạm tính ({renewDuration.months} tháng x {(renewPkgDetail.unitPrice||0).toLocaleString('vi-VN')}đ)</span><span>{(renewPkgDetail.unitPrice*renewDuration.months).toLocaleString('vi-VN')}đ</span></div>
                        {renewDuration.discount>0 && <div className="flex justify-between text-sm text-emerald-600 mt-1"><span>Giảm {renewDuration.discount}%</span><span>-{Math.round(renewPkgDetail.unitPrice*renewDuration.months*renewDuration.discount/100).toLocaleString('vi-VN')}đ</span></div>}
                        <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center"><span className="font-bold text-slate-900">Tổng tiền</span><span className="text-xl font-extrabold text-indigo-600">{(renewPkgDetail.unitPrice*renewDuration.months*(1-(renewDuration.discount||0)/100)).toLocaleString('vi-VN')}đ</span></div>
                        <p className="text-xs text-slate-500 mt-2">Gia hạn nối tiếp sau ngày hết hạn hiện tại • Áp dụng bảng giá hiện hành của gói</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 border border-slate-200 rounded-xl text-center">
                    <p className="font-bold text-slate-900">{renewPkgDetail.name}</p>
                    <p className="text-lg font-extrabold text-indigo-600 mt-1">{(renewPkgDetail.unitPrice||0).toLocaleString('vi-VN')}đ / tháng</p>
                    <p className="text-xs text-slate-500 mt-1">Gói chỉ có kỳ hạn 1 tháng mặc định</p>
                    <button onClick={()=>setRenewDuration({ months: 1, discount: 0 })} className={`mt-3 px-4 py-2 rounded-xl text-sm font-bold border-2 ${renewDuration ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>Chọn 1 tháng</button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 flex gap-3 bg-white">
                <Button variant="outlined" onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }} sx={{flex:1, textTransform:'none', borderRadius:2, borderColor:'#cbd5e1', color:'#475569'}}>Hủy</Button>
                <Button variant="contained" disabled={!renewDuration || renewSubmitting} onClick={handleRenewConfirm} sx={{flex:1, bgcolor:'#4f46e5', '&:hover':{bgcolor:'#4338ca'}, textTransform:'none', borderRadius:2}}>{renewSubmitting ? 'Đang xử lý...' : `Gia hạn ${renewDuration?`${renewDuration.months} tháng`:''}`}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Nâng cấp gói - chọn gói cao cấp hơn cùng bộ môn */}
        {upgradeTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>{ setUpgradeTarget(null); setSelectedUpgradePkg(null); setUpgradeCalc(null); }}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e)=>e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Nâng cấp gói tập</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Từ <b className="text-slate-800">{upgradeTarget.packageName}</b> • {upgradePkgDetail?.disciplineId?.name || ''} {upgradeTarget.end_date ? `• Hết hạn ${new Date(upgradeTarget.end_date).toLocaleDateString('vi-VN')}` : ''}</p>
                </div>
                <button onClick={()=>{ setUpgradeTarget(null); setSelectedUpgradePkg(null); setUpgradeCalc(null); }} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!upgradeList.length ? (
                  <p className="text-sm text-slate-500">Không có gói nâng cấp phù hợp trong cùng bộ môn</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upgradeList.map((pkg:any)=>{
                      const isSel = selectedUpgradePkg?._id===pkg._id;
                      return (
                        <button key={pkg._id} onClick={()=>handleSelectUpgradePkg(pkg)} className={`text-left p-4 rounded-xl border-2 transition ${isSel ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                          <p className="font-bold text-slate-900 text-sm">{pkg.name} {pkg.combo && <span className="ml-1 px-1.5 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-xs rounded-full">COMBO</span>}</p>
                          {pkg.disciplineId?.name && <span className="inline-block mt-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">{pkg.disciplineId.name}</span>}
                          <p className="text-lg font-extrabold text-indigo-600 mt-2">{Number(pkg.unitPrice||0).toLocaleString('vi-VN')}đ <span className="text-xs font-normal text-slate-500">/tháng</span></p>
                          {(pkg.ptSessionsPerMonth>0 || pkg.isFullMonth) && <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">{pkg.isFullMonth ? 'Không giới hạn HLV' : `${pkg.ptSessionsPerMonth} buổi HLV/tháng`}</span>}
                          {isSel && upgradeCalculating && <span className="block mt-2 text-xs text-indigo-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Đang tính...</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedUpgradePkg && upgradeCalc && !upgradeCalc.error && !upgradeCalculating && (
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Ngày còn lại</span><b>{upgradeCalc.remainingDays} ngày</b></div>
                      <div className="flex justify-between"><span className="text-slate-500">Giá trị còn lại gói cũ</span><b className="text-emerald-600">-{upgradeCalc.remainingValue?.toLocaleString('vi-VN')}đ</b></div>
                      <div className="flex justify-between"><span className="text-slate-500">Chi phí gói mới (cùng kỳ hạn)</span><b>+{upgradeCalc.newPackageCost?.toLocaleString('vi-VN')}đ</b></div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                        {upgradeCalc.refundAmount>0 ? (
                          <><span className="font-bold text-emerald-700">Được hoàn lại</span><span className="text-lg font-extrabold text-emerald-600">{upgradeCalc.refundAmount.toLocaleString('vi-VN')}đ</span></>
                        ) : (
                          <><span className="font-bold text-amber-700">Cần thanh toán thêm</span><span className="text-lg font-extrabold text-amber-600">{upgradeCalc.amountToPay?.toLocaleString('vi-VN')}đ</span></>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Nâng cấp giữ nguyên ngày hết hạn còn lại ({upgradeCalc.remainingDays} ngày), gói cũ sẽ được hủy và gói mới có hiệu lực ngay.</p>
                  </div>
                )}
                {upgradeCalc?.error && <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-red-700"><AlertTriangle className="w-4 h-4"/> {upgradeCalc.error}</div>}
              </div>
              <div className="p-4 border-t border-slate-200 flex gap-3 bg-white">
                <Button variant="outlined" onClick={()=>{ setUpgradeTarget(null); setSelectedUpgradePkg(null); setUpgradeCalc(null); }} sx={{flex:1, textTransform:'none', borderRadius:2, borderColor:'#cbd5e1', color:'#475569'}}>Hủy</Button>
                <Button variant="contained" disabled={!selectedUpgradePkg || !upgradeCalc || upgradeCalc.error || upgradeSubmitting} onClick={handleUpgradeConfirm} sx={{flex:1, bgcolor:'#7c3aed', '&:hover':{bgcolor:'#6d28d9'}, textTransform:'none', borderRadius:2}}>{upgradeSubmitting ? 'Đang xử lý...' : 'Xác nhận nâng cấp'}</Button>
              </div>
            </div>
          </div>
        )}

        {showRegModal && regCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRegModal(false)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header + Stepper */}
              <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Đăng ký gói tập</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Tạo gói tập mới cho hội viên</p>
                  </div>
                  <button onClick={() => setShowRegModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                  {[
                    { n: 1, label: 'Chọn gói' },
                    { n: 2, label: 'Thời hạn' },
                    { n: 3, label: 'Xác nhận' },
                  ].map((s, idx) => (
                    <div key={s.n} className="flex items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${regStep === s.n ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : regStep > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {regStep > s.n ? <Check className="w-4 h-4" /> : s.n}
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${regStep === s.n ? 'text-indigo-600' : regStep > s.n ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                      {idx < 2 && <div className={`flex-1 h-0.5 mx-2 rounded ${regStep > s.n ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                    </div>
                  ))}
                </div>
                {/* Member mini card */}
                <div className="mt-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(regCustomer.fullName || regCustomer.account || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{regCustomer.fullName || regCustomer.account} <span className="font-normal text-slate-500">• {regCustomer.phone || '—'}</span></p>
                    <p className="text-xs text-slate-500 truncate">{regCustomer.email || regCustomer.account} • {regCustomer.gender || ''} {regCustomer.status ? `• ${regCustomer.status}` : ''}</p>
                  </div>
                  <div className="text-xs text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
                    {detail360 ? `${detail360.packageCount || 0} gói • ${detail360.totalCheckins || 0} check-in` : 'Hội viên'}
                  </div>
                </div>
              </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Step 1: Chọn gói */}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Chọn gói tập</h3>
                      <span className="text-xs text-slate-500">{regPackages.length} gói khả dụng</span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm gói theo tên, bộ môn..."
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {regPackages.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">Chưa có gói tập nào khả dụng</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                        {regPackages
                          .filter((pkg) => {
                            if (!regSearch.trim()) return true;
                            const s = regSearch.toLowerCase();
                            return (
                              pkg.name.toLowerCase().includes(s) ||
                              (pkg.disciplineId?.name || '').toLowerCase().includes(s)
                            );
                          })
                          .map((pkg) => {
                            const isSelected = regSelectedPkg?._id === pkg._id;
                            const isOwned = (detail360?.packages || []).some(
                              (p: any) => String(p.packageId) === String(pkg._id) && ['đang hoạt động', 'còn 10 ngày', 'đang tạm ngưng'].includes(p.status)
                            );
                            return (
                              <button
                                key={pkg._id}
                                disabled={isOwned}
                                onClick={() => {
                                  if (isOwned) return;
                                  setRegSelectedPkg(pkg);
                                  if (pkg.durations?.length > 0) setRegSelectedDuration(pkg.durations[0]);
                                  else setRegSelectedDuration({ months: 1, discount: 0 });
                                }}
                                className={`text-left p-4 rounded-2xl border-2 transition-all ${isOwned ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed' : isSelected ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className={`font-bold text-sm truncate ${isOwned ? 'text-slate-500' : 'text-slate-900'}`}>{pkg.name}</p>
                                    {pkg.disciplineId?.name && (
                                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isOwned ? 'bg-slate-200 text-slate-600' : 'bg-violet-100 text-violet-700'}`}>{pkg.disciplineId.name}</span>
                                    )}
                                  </div>
                                  {isOwned ? (
                                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white text-[11px] font-bold whitespace-nowrap">Đã sở hữu</span>
                                  ) : isSelected ? (
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  ) : null}
                                </div>
                                <p className="text-lg font-extrabold text-indigo-600 mt-2">{pkg.unitPrice?.toLocaleString('vi-VN')}đ<span className="text-xs font-normal text-slate-500">/tháng</span></p>
                                {pkg.features?.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {pkg.features.slice(0, 3).map((f, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                        <Star className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{f}</span>
                                      </li>
                                    ))}
                                    {pkg.features.length > 3 && <li className="text-xs text-slate-400">+{pkg.features.length - 3} quyền lợi khác</li>}
                                  </ul>
                                )}
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{pkg.durations?.length ? `${pkg.durations.length} mốc thời hạn` : '1 tháng mặc định'}</span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                    {regSelectedPkg && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800">
                        <Check className="w-4 h-4" />
                        Đã chọn: <b>{regSelectedPkg.name}</b> • {regSelectedPkg.unitPrice?.toLocaleString('vi-VN')}đ/tháng
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Thời hạn */}
                {regStep === 2 && regSelectedPkg && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">{regSelectedPkg.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm truncate">{regSelectedPkg.name}</p>
                        <p className="text-xs text-slate-500">{regSelectedPkg.unitPrice?.toLocaleString('vi-VN')}đ/tháng {regSelectedPkg.disciplineId?.name ? `• ${regSelectedPkg.disciplineId.name}` : ''}</p>
                      </div>
                      <button onClick={() => setRegStep(1)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg">Đổi gói</button>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-3">Chọn thời hạn</h3>
                      {regSelectedPkg.durations && regSelectedPkg.durations.length > 0 ? (
                        <>
                          {regSelectedPkg.durations.some((d) => d.months >= 12) && (
                            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
                              <button
                                onClick={() => {
                                  const monthly = regSelectedPkg.durations.filter((d) => d.months < 12);
                                  if (monthly.length > 0) {
                                    const exists = monthly.some((d) => d.months === regSelectedDuration?.months);
                                    if (!exists) setRegSelectedDuration(monthly[0]);
                                  }
                                }}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${(regSelectedDuration?.months || 1) < 12 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                Theo tháng
                              </button>
                              <button
                                onClick={() => {
                                  const yearly = regSelectedPkg.durations.filter((d) => d.months >= 12);
                                  if (yearly.length > 0) {
                                    const exists = yearly.some((d) => d.months === regSelectedDuration?.months);
                                    if (!exists) setRegSelectedDuration(yearly[0]);
                                  }
                                }}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${(regSelectedDuration?.months || 0) >= 12 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                Theo năm
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {regSelectedPkg.durations
                              .filter((d) => ((regSelectedDuration?.months || 1) < 12 ? d.months < 12 : d.months >= 12))
                              .map((dur, idx) => {
                                const isSelected = regSelectedDuration?.months === dur.months && regSelectedDuration?.discount === dur.discount;
                                const total = regSelectedPkg.unitPrice * dur.months * (1 - (dur.discount || 0) / 100);
                                const origin = regSelectedPkg.unitPrice * dur.months;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setRegSelectedDuration(dur)}
                                    className={`p-4 rounded-xl border-2 transition-all text-center ${isSelected ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                  >
                                    <div className="font-bold text-slate-900 mb-1">{dur.months} tháng</div>
                                    <div className="text-xl font-extrabold text-indigo-600 mb-1">{total.toLocaleString('vi-VN')}đ</div>
                                    {dur.discount > 0 ? (
                                      <>
                                        <div className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">-{dur.discount}%</div>
                                        <div className="text-xs text-slate-400 line-through mt-1">{origin.toLocaleString('vi-VN')}đ</div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-slate-400">Không giảm giá</div>
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-white text-center">
                          <div className="font-bold text-slate-900 mb-1">1 tháng</div>
                          <div className="text-xl font-extrabold text-indigo-600 mb-1">{regSelectedPkg.unitPrice?.toLocaleString('vi-VN') || '0'}đ</div>
                          <div className="text-xs text-slate-400">Giá mặc định</div>
                        </div>
                      )}
                    </div>

                    {regSelectedDuration && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Tạm tính ({regSelectedDuration.months} tháng x {regSelectedPkg.unitPrice?.toLocaleString('vi-VN')}đ)</span>
                          <span>{(regSelectedPkg.unitPrice * regSelectedDuration.months).toLocaleString('vi-VN')}đ</span>
                        </div>
                        {regSelectedDuration.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 mt-1">
                            <span>Giảm {regSelectedDuration.discount}%</span>
                            <span>-{((regSelectedPkg.unitPrice * regSelectedDuration.months * regSelectedDuration.discount) / 100).toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}
                        <div className="border-t border-indigo-200 mt-3 pt-3 flex justify-between items-center">
                          <span className="font-bold text-slate-900">Tổng tiền cần thanh toán</span>
                          <span className="text-xl font-extrabold text-indigo-600">{(regSelectedPkg.unitPrice * regSelectedDuration.months * (1 - (regSelectedDuration.discount || 0) / 100)).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Chỉ hiển thị tổng tiền, không thực hiện thanh toán tại đây</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Xác nhận */}
                {regStep === 3 && regSelectedPkg && regSelectedDuration && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
                      <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Xác nhận đăng ký</p>
                      <h3 className="text-lg font-bold mt-1">{regSelectedPkg.name}</h3>
                      <p className="text-indigo-100 text-sm mt-1">{regSelectedDuration.months} tháng {regSelectedDuration.discount > 0 ? `• Giảm ${regSelectedDuration.discount}%` : ''}</p>
                      <div className="mt-4 bg-white/15 backdrop-blur rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="text-indigo-100 text-xs">Tổng tiền cần thanh toán</p>
                          <p className="text-2xl font-extrabold">{(regSelectedPkg.unitPrice * regSelectedDuration.months * (1 - (regSelectedDuration.discount || 0) / 100)).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Package className="w-8 h-8 text-white/80" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Hội viên</span>
                        <span className="font-semibold text-slate-900">{regCustomer.fullName} • {regCustomer.phone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Gói tập</span>
                        <span className="font-semibold text-slate-900">{regSelectedPkg.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Đơn giá</span>
                        <span className="font-semibold text-slate-900">{regSelectedPkg.unitPrice?.toLocaleString('vi-VN')}đ/tháng</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Thời hạn</span>
                        <span className="font-semibold text-slate-900">{regSelectedDuration.months} tháng</span>
                      </div>
                      {regSelectedDuration.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span className="font-bold">-{regSelectedDuration.discount}%</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                        <span className="font-bold text-slate-900">Tổng tiền</span>
                        <span className="text-xl font-extrabold text-indigo-600">{(regSelectedPkg.unitPrice * regSelectedDuration.months * (1 - (regSelectedDuration.discount || 0) / 100)).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Ngày bắt đầu (dự kiến)</span>
                        <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Ngày kết thúc (dự kiến)</span>
                        <span className="font-semibold text-slate-700">{(() => { const d = new Date(); d.setMonth(d.getMonth() + regSelectedDuration.months); return d.toLocaleDateString('vi-VN'); })()}</span>
                      </div>
                    </div>

                    {regSelectedPkg.features?.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-700 uppercase mb-2">Quyền lợi gói</p>
                        <ul className="space-y-1.5">
                          {regSelectedPkg.features.map((f, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-slate-200 p-4 bg-slate-50 flex gap-3">
                {regStep > 1 && (
                  <button onClick={() => setRegStep((s) => (s - 1) as any)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">
                    Quay lại
                  </button>
                )}
                {regStep === 1 && (
                  <button
                    onClick={() => {
                      if (!regSelectedPkg) return;
                      const owned = (detail360?.packages || []).some(
                        (p: any) => String(p.packageId) === String(regSelectedPkg._id) && ['đang hoạt động', 'còn 10 ngày', 'đang tạm ngưng'].includes(p.status)
                      );
                      if (owned) return;
                      setRegStep(2);
                    }}
                    disabled={
                      !regSelectedPkg ||
                      (detail360?.packages || []).some(
                        (p: any) => String(p.packageId) === String(regSelectedPkg._id) && ['đang hoạt động', 'còn 10 ngày', 'đang tạm ngưng'].includes(p.status)
                      )
                    }
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục
                  </button>
                )}
                {regStep === 2 && (
                  <button
                    onClick={() => regSelectedDuration && setRegStep(3)}
                    disabled={!regSelectedDuration}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục
                  </button>
                )}
                {regStep === 3 && (
                  <button
                    onClick={handleRegSubmit}
                    disabled={regSubmitting}
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {regSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {regSubmitting ? 'Đang xử lý...' : `Xác nhận • ${(regSelectedPkg.unitPrice * (regSelectedDuration?.months || 1) * (1 - ((regSelectedDuration?.discount || 0) / 100))).toLocaleString('vi-VN')}đ`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {checkDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCheckDetail(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Chi tiết điểm danh</h2>
                  <p className="text-xs text-slate-600 mt-0.5">{checkDetail.customer.fullName} • {checkDetail.customer.phone} • Hôm nay {checkDetail.sessions.length} lần</p>
                </div>
                <button onClick={() => setCheckDetail(null)} className="p-2 hover:bg-white rounded-xl border border-slate-200">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {checkDetail.sessions.map((s: any, idx: number) => {
                  const isOut = !!s.checkOutTime;
                  const inTime = new Date(s.checkInTime).toLocaleTimeString('vi-VN');
                  const outTime = isOut ? new Date(s.checkOutTime).toLocaleTimeString('vi-VN') : '—';
                  const locker = s.lockerNumber || 'Không dùng tủ';
                  return (
                    <div key={s._id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isOut ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          Lần {idx + 1} • {isOut ? 'Đã check out' : 'Đã check in'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />{inTime} → {outTime}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                          <p className="text-slate-500">Vào</p>
                          <p className="font-semibold text-slate-900">{new Date(s.checkInTime).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                          <p className="text-slate-500">Ra</p>
                          <p className="font-semibold text-slate-900">{isOut ? new Date(s.checkOutTime).toLocaleString('vi-VN') : 'Chưa ra'}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <KeyRound className="w-3.5 h-3.5" /> Tủ: <b className="text-slate-900">{locker}</b>
                        </span>
                        {s.totalMinutes ? <span className="ml-auto px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold">{Math.floor(s.totalMinutes / 60)}h{s.totalMinutes % 60}p</span> : null}
                        {s.status && <span className="px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600">{s.status}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                <button onClick={() => setCheckDetail(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}