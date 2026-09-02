import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Search, Edit, Lock, Unlock, AlertTriangle, Eye, ScanFace, X, Loader2, Camera, Check, Download } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl, useAuth } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

interface Staff {
  _id: string;
  account: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth?: string;
  job: { _id: string; name: string };
  address: string;
  status: string;
  avatar?: string;
  faceDescriptor?: number[];
  pricePerSession?: number;
  commissionPT?: number;
}

function StaffFaceModal({ staff, isOpen, onClose, onSuccess }: { staff: Staff | null; isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  if (!isOpen || !staff) return null;
  const handleCapture = async () => {
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
      const res = await fetch(`${getApiUrl()}/api/staff/${staff._id}/face/register`, {
        method: 'POST',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ faceDescriptor: descriptorArray })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
      setSuccess(true);
      toast.success(`Đã đăng ký FaceID cho ${staff.fullName}`);
      setTimeout(() => { setSuccess(false); onSuccess(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err.message || 'Đăng ký khuôn mặt thất bại');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ScanFace className="w-5 h-5" /></div>
          <h3 className="font-bold text-slate-900 text-lg">Đăng ký FaceID nhân viên</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Nhân viên: <b className="text-indigo-600">{staff.fullName}</b> @{staff.account}</p>
        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-3 border border-red-200">{error}</div>}
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-emerald-600 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-6 h-6 stroke-[3]" /></div>
            <p className="font-bold text-sm">Đăng ký FaceID thành công!</p>
          </div>
        ) : (
          <>
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black relative mb-4 border border-slate-200">
              <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover" screenshotFormat="image/jpeg" />
              <div className="absolute inset-0 border-2 border-dashed border-indigo-400/70 rounded-full m-8 pointer-events-none" />
            </div>
            <button onClick={handleCapture} disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {loading ? 'Đang trích xuất...' : 'Chụp và Lưu FaceID'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function StaffList() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [jobs, setJobs] = useState<{ _id: string; name: string; isAdmin?: boolean; permissions?: string[] }[]>([]);
  const { selectedClub } = useClub();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [loadingReports, setLoadingReports] = useState(true);
  const [todayStaffMap, setTodayStaffMap] = useState<Map<string, { count: number; latest: any; sessions: any[] }>>(new Map());
  const [todayShiftMap, setTodayShiftMap] = useState<Map<string, Set<string>>>(new Map());
  const [trainerSessionMap, setTrainerSessionMap] = useState<Map<string, { count: number; sessions: any[] }>>(new Map());
  const [faceModal, setFaceModal] = useState<{ open: boolean; staff: Staff | null }>({ open: false, staff: null });
  const [feeModal, setFeeModal] = useState<{ open: boolean; staff: Staff | null; value: string; commissionValue: string }>({ open: false, staff: null, value: '', commissionValue: '' });
  const [feeSaving, setFeeSaving] = useState(false);

  const fetchStaff = async (p = page, opts?: { search?: string; status?: string; job?: string; gender?: string }) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '10');
      if (selectedClub !== 'all') params.set('locationId', selectedClub);
      const s = opts?.search ?? searchTerm;
      const st = opts?.status ?? statusFilter;
      const j = opts?.job ?? jobFilter;
      const g = opts?.gender ?? genderFilter;
      if (s) params.set('search', s);
      if (st && st !== 'all') params.set('status', st);
      if (j && j !== 'all') params.set('job', j);
      if (g && g !== 'all') params.set('gender', g);
      const url = `${getApiUrl()}/api/staff?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setStaff(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => {
    fetch(`${getApiUrl()}/api/jobs?page=1&limit=100`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setJobs(d.data || []))
      .catch(() => {});
  }, []);

  const fetchTodayStaffAttendance = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-attendance/today`, { headers: getAuthHeaders() as any });
      const list = await res.json();
      let arr: any[] = Array.isArray(list) ? list : (list.data || []);
      if (selectedClub !== 'all') {
        arr = arr.filter((it: any) => {
          const loc = String(it.locationId?._id || it.locationId || '');
          return loc === String(selectedClub);
        });
      }
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const map = new Map<string, { count: number; latest: any; sessions: any[] }>();
      arr.forEach((item: any) => {
        if (!item.checkInTime) return;
        const t = new Date(item.checkInTime);
        if (t < start) return;
        const sid = String(item.staffId?._id || item.staffId || '');
        if (!sid) return;
        if (!map.has(sid)) map.set(sid, { count: 0, latest: null, sessions: [] });
        const entry = map.get(sid)!;
        entry.sessions.push(item);
      });
      map.forEach((v) => {
        v.sessions.sort((a: any, b: any) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
        v.count = v.sessions.length;
        v.latest = v.sessions[v.sessions.length - 1] || null;
      });
      setTodayStaffMap(map);
    } catch {}
  };

  const fetchTodayShifts = async () => {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      const locParam = selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
      const res = await fetch(`${getApiUrl()}/api/staff-shifts/by-date?date=${todayStr}${locParam}`, { headers: getAuthHeaders() as any });
      const json = await res.json();
      const shifts: any[] = json.data || (Array.isArray(json) ? json : []);
      const map = new Map<string, Set<string>>();
      shifts.forEach((s: any) => {
        const sid = String(s.staffId?._id || s.staffId || '');
        if (!sid) return;
        if (!map.has(sid)) map.set(sid, new Set());
        map.get(sid)!.add(s.shift);
      });
      setTodayShiftMap(map);
    } catch {
      setTodayShiftMap(new Map());
    }
  };

  const fetchTrainerSessions = async () => {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      // Dùng cùng API với /admin/training-schedule để đồng bộ số liệu
      const res = await fetch(`${getApiUrl()}/api/bookings/my-trainer?dateFrom=${todayStr}&dateTo=${todayStr}`, { headers: getAuthHeaders() as any });
      const json = await res.json();
      const list: any[] = Array.isArray(json) ? json : (json.data || []);
      // Chỉ tính lịch còn hiệu lực (pending/confirmed/completed), bỏ cancelled/rejected
      const valid = list.filter((b: any) => !['cancelled', 'rejected'].includes(b.status));
      const map = new Map<string, { count: number; sessions: any[] }>();
      valid.forEach((b: any) => {
        const tid = String(b.trainerId?._id || b.trainerId || '');
        if (!tid) return;
        if (!map.has(tid)) map.set(tid, { count: 0, sessions: [] });
        map.get(tid)!.count++;
        map.get(tid)!.sessions.push(b);
      });
      setTrainerSessionMap(map);
    } catch {
      setTrainerSessionMap(new Map());
    }
  };

  const isTrainerJob = (jobId: string) => {
    const j = jobs.find(x => x._id === jobId);
    if (!j) return false;
    const nameNorm = (j.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return nameNorm.includes('huan luyen vien') || nameNorm.includes('hlv') || nameNorm.includes('trainer') || nameNorm.includes('pt') || (j.permissions || []).includes('huan_luyen_vien');
  };

  const openFeeModal = (person: Staff) => {
    setFeeModal({ open: true, staff: person, value: String(person.pricePerSession ?? 500000), commissionValue: String(person.commissionPT ?? 0) });
  };
  const handleSaveFee = async () => {
    if (!feeModal.staff) return;
    const n = Number(feeModal.value);
    const c = Number(feeModal.commissionValue);
    if (isNaN(n) || n < 0) { toast.error('Phí không hợp lệ'); return; }
    if (isNaN(c) || c < 0 || c > 100) { toast.error('Hoa hồng phải từ 0-100%'); return; }
    setFeeSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${feeModal.staff._id}`, {
        method: 'PUT',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ pricePerSession: n, commissionPT: c })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại');
      toast.success(`Đã cập nhật phí ${n.toLocaleString('vi-VN')}đ, hoa hồng ${c}% cho ${feeModal.staff.fullName}`);
      setFeeModal({ open: false, staff: null, value: '', commissionValue: '' });
      fetchStaff(page);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFeeSaving(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchStaff(1);
    fetchReportCounts();
    fetchTodayStaffAttendance();
    fetchTodayShifts();
    fetchTrainerSessions();
  }, [selectedClub, statusFilter, jobFilter, genderFilter]);

  useEffect(() => {
    fetchTodayStaffAttendance();
    fetchTodayShifts();
    fetchTrainerSessions();
    const id = setInterval(() => {
      fetchTodayStaffAttendance();
      fetchTodayShifts();
      fetchTrainerSessions();
    }, 10000);
    let ch: any = null;
    try {
      ch = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
      ch.onmessage = (e: any) => {
        if (e.data?.type === 'CHECKIN_EVENT' || e.data?.type === 'FACE_CHECKIN_TRIGGER' || e.data?.type === 'BOOKING_CREATED') {
          fetchTodayStaffAttendance();
          fetchTodayShifts();
          fetchTrainerSessions();
        }
      };
    } catch {}
    return () => { clearInterval(id); try { ch?.close(); } catch {} };
  }, [selectedClub]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchStaff(1, { search: searchTerm });
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

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

  const handleToggleStatus = async (person: Staff) => {
    const isActive = person.status === 'active';
    const nextStatus = isActive ? 'inactive' : 'active';
    const action = isActive ? 'cho nghỉ việc' : 'kích hoạt lại';
    if (!confirm(`Bạn có chắc muốn ${action} nhân viên "${person.fullName}"?`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${person._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchStaff(page);
      } else {
        const data = await res.json();
        alert(data.error || 'Cập nhật trạng thái thất bại');
      }
    } catch {}
  };

  const handleRemoveFace = async (person: Staff) => {
    if (!confirm(`Xóa FaceID của "${person.fullName}"? Nhân viên sẽ phải đăng ký lại để chấm công bằng khuôn mặt.`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${person._id}/face`, { method: 'DELETE', headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchStaff(page);
    } catch (e: any) { toast.error(e.message); }
  };

  // Lọc hiển thị theo phân quyền của tài khoản đăng nhập (đồng bộ với BE)
  const visibleStaff = useMemo(() => {
    if (!user) return staff;
    if (user.isAdmin) return staff; // admin xem tất cả
    const normalize = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const roleNorm = normalize(user.role || '');
    const isManager = roleNorm.includes('quan ly');
    const isReception = roleNorm.includes('le tan');

    // Build map jobId -> job info từ danh sách jobs đã fetch (có isAdmin & permissions)
    const jobMap = new Map<string, { isAdmin?: boolean; permissions?: string[]; name: string }>();
    jobs.forEach(j => jobMap.set(j._id, { isAdmin: j.isAdmin, permissions: j.permissions, name: j.name }));

    const isAdminJob = (jobId: string) => jobMap.get(jobId)?.isAdmin === true;
    const isManagerJob = (jobId: string) => {
      const j = jobMap.get(jobId);
      if (!j) return false;
      const nameNorm = normalize(j.name);
      return nameNorm.includes('quan ly') || (j.permissions || []).includes('quan_ly');
    };

    return staff.filter(s => {
      const jobId = (s.job as any)?._id || (s as any).job || '';
      if (isManager) {
        // quản lý không phân quyền: ẩn những bản ghi có phân quyền (isAdmin)
        if (isAdminJob(jobId)) return false;
      } else if (isReception) {
        // lễ tân: ẩn những bản ghi có quyền là quản lý
        if (isManagerJob(jobId)) return false;
        // cũng ẩn admin để đảm bảo phân cấp (nếu chỉ muốn ẩn quản lý thì bỏ dòng dưới)
        if (isAdminJob(jobId)) return false;
      } else {
        // các role khác mặc định ẩn admin
        if (isAdminJob(jobId)) return false;
      }
      return true;
    });
  }, [staff, jobs, user]);

  // Sắp xếp ưu tiên: 1 = có chấm công hôm nay (kể cả HLV không có ca), 2 = có ca hôm nay, 3 = còn lại; nghỉ việc luôn cuối
  const sortedStaff = useMemo(() => {
    const rank = (id: string) => {
      const hasAttendance = todayStaffMap.has(id);
      const hasShift = todayShiftMap.has(id);
      if (hasAttendance) return 2; // ưu tiên 1 (cao nhất)
      if (hasShift) return 1; // ưu tiên 2
      return 0;
    };
    return [...visibleStaff].sort((a, b) => {
      const aActive = a.status === 'active' ? 1 : 0;
      const bActive = b.status === 'active' ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive; // hoạt động trước, nghỉ việc xuống cuối
      const ra = rank(a._id);
      const rb = rank(b._id);
      if (ra !== rb) return rb - ra; // 2 -> 1 -> 0 (trong nhóm hoạt động / nghỉ việc)
      return 0; // giữ nguyên thứ tự gốc trong cùng nhóm
    });
  }, [visibleStaff, todayStaffMap, todayShiftMap]);

  const handleExportDailyDetail = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
      const res = await fetch(`${getApiUrl()}/api/staff-attendance/export/daily-detail?date=${today}${locParam}`, { headers: getAuthHeaders() as any });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Không có dữ liệu để xuất');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NhanVien_HoatDong_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã xuất Excel chi tiết nhân viên hôm nay');
    } catch (e: any) {
      toast.error(e.message || 'Xuất Excel thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách nhân viên</h1>
            <p className="text-slate-600">Quản lý thông tin nhân viên</p>
          </div>
          <button onClick={handleExportDailyDetail} className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition">
            <Download className="w-4 h-4" /> Xuất Excel chi tiết hôm nay
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên, tài khoản, email, SĐT..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang làm</option>
              <option value="inactive">Nghỉ việc</option>
            </select>
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
              <option value="all">Tất cả chức vụ</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.name}</option>)}
            </select>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
              <option value="all">Tất cả giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap w-[48px]">STT</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Họ và tên</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Công việc</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Ngày sinh</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">SĐT</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Giới tính</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Trạng thái</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Chấm công</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Phí/buổi</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap">Hoa hồng hôm nay</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 whitespace-nowrap w-[72px]">Báo cáo</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 whitespace-nowrap w-[160px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedStaff.map((person, index) => {
                  const hasFace = !!(person.faceDescriptor && person.faceDescriptor.length > 0);
                  return (
                  <tr key={person._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-sm text-slate-500 text-center">{(page - 1) * 10 + index + 1}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => navigate(`/admin/staff/${person._id}`)}
                        className="text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline text-left whitespace-nowrap"
                        title="Xem chi tiết"
                      >
                        {person.fullName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm text-indigo-600 font-semibold whitespace-nowrap">{person.job?.name || 'Chưa xác định'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{person.phone}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{person.gender}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {(() => {
                        const shiftSet = todayShiftMap.get(person._id);
                        const hasMorning = shiftSet?.has('morning-noon');
                        const hasAfternoon = shiftSet?.has('afternoon-evening');
                        if (hasMorning && hasAfternoon) {
                          return (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                              Cả ngày
                            </span>
                          );
                        }
                        if (hasMorning) {
                          return (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Sáng
                            </span>
                          );
                        }
                        if (hasAfternoon) {
                          return (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                              Chiều
                            </span>
                          );
                        }
                        return (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                            {person.status === 'active' ? 'Hoạt động' : 'Nghỉ việc'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {(() => {
                        const info = todayStaffMap.get(person._id);
                        if (info?.latest) {
                          const isCheckedOut = !!info.latest.checkOutTime;
                          const cnt = info.count;
                          const label = isCheckedOut ? (cnt > 1 ? `Đã ra lần ${cnt}` : 'Đã ra') : (cnt > 1 ? `Đã vào lần ${cnt}` : 'Đã vào');
                          const color = isCheckedOut ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                          return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{label}</span>;
                        }
                        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Chưa chấm công</span>;
                      })()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {(() => {
                        const jobId = (person.job as any)?._id || (person as any).job || '';
                        if (!isTrainerJob(jobId)) return <span className="text-xs text-slate-400">—</span>;
                        const price = person.pricePerSession ?? 500000;
                        return (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-indigo-600">{price.toLocaleString('vi-VN')}đ</span>
                            <button onClick={() => openFeeModal(person)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Sửa phí/buổi">
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {(() => {
                        const jobId = (person.job as any)?._id || (person as any).job || '';
                        if (!isTrainerJob(jobId)) return <span className="text-xs text-slate-400">—</span>;
                        const price = person.pricePerSession ?? 500000;
                        const sessInfo = trainerSessionMap.get(person._id);
                        const cnt = sessInfo?.count || 0;
                        const commissionRate = (person as any).commissionPT ?? 0;
                        const commission = commissionRate > 0 ? Math.round(price * cnt * commissionRate / 100) : price * cnt;
                        return (
                          <div className="flex items-center gap-1">
                            <div className="text-xs">
                              <p className="font-semibold text-emerald-600">{cnt ? commission.toLocaleString('vi-VN') + 'đ' : '0đ'}</p>
                              <p className="text-[11px] text-slate-500">{cnt} buổi{commissionRate ? ` × ${commissionRate}%` : ''}</p>
                            </div>
                            <button onClick={() => openFeeModal(person)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Sửa hoa hồng">
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {reportCounts[person._id] > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {reportCounts[person._id]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{loadingReports ? '-' : '0'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/admin/staff/${person._id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/admin/staff/${person._id}/edit`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFaceModal({ open: true, staff: person })} className={`p-1.5 rounded-lg ${hasFace ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:bg-slate-100'}`} title={hasFace ? 'Đã có FaceID - bấm để ghi đè' : 'Đăng ký FaceID'}>
                          <ScanFace className="w-4 h-4" />
                        </button>
                        <button onClick={() => hasFace ? handleRemoveFace(person) : toast.info('Chưa có FaceID để xóa - hãy đăng ký trước')} className={`p-1.5 rounded-lg ${hasFace ? 'text-red-600 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`} title={hasFace ? 'Bỏ FaceID (làm trống)' : 'Chưa có FaceID'}>
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(person)}
                          className={`p-1.5 rounded-lg ${person.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={person.status === 'active' ? 'Cho nghỉ việc / Khóa tài khoản' : 'Kích hoạt lại - Đang làm'}
                        >
                          {person.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
                {sortedStaff.length === 0 && (
                  <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">Không tìm thấy nhân viên nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={(p) => { setPage(p); fetchStaff(p); }} />
        </div>
      </div>
      <StaffFaceModal staff={faceModal.staff} isOpen={faceModal.open} onClose={() => setFaceModal({ open: false, staff: null })} onSuccess={() => fetchStaff(page)} />
      {feeModal.open && feeModal.staff && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Chỉnh phí & hoa hồng</h3>
              <button onClick={() => setFeeModal({ open: false, staff: null, value: '', commissionValue: '' })} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-1">Nhân viên: <b className="text-indigo-600">{feeModal.staff.fullName}</b> · {feeModal.staff.job?.name}</p>
            {(() => {
              const sess = trainerSessionMap.get(feeModal.staff!._id)?.count || 0;
              const commissionRate = Number(feeModal.commissionValue) || 0;
              const price = Number(feeModal.value) || 0;
              const commission = commissionRate > 0 ? Math.round(price * sess * commissionRate / 100) : price * sess;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-sm">
                  <p className="text-slate-600">Số buổi dạy hôm nay: <b className="text-slate-900">{sess}</b> buổi</p>
                  <p className="text-slate-600 mt-1">Hoa hồng hôm nay: <b className="text-emerald-600">{sess ? commission.toLocaleString('vi-VN') + 'đ' : '0đ'}</b> {commissionRate ? `(${commissionRate}%)` : '(theo phí × số buổi)'}</p>
                </div>
              );
            })()}
            <label className="block text-sm font-medium text-slate-700 mb-2">Phí / buổi (VNĐ)</label>
            <input type="number" value={feeModal.value} onChange={e => setFeeModal(prev => ({ ...prev, value: e.target.value }))} placeholder="500000" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Hoa hồng (%)</label>
            <input type="number" min={0} max={100} value={feeModal.commissionValue} onChange={e => setFeeModal(prev => ({ ...prev, commissionValue: e.target.value }))} placeholder="0" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            <p className="text-xs text-slate-500 mt-1">Nhập 0-100, ví dụ 20 = 20% trên mỗi buổi</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFeeModal({ open: false, staff: null, value: '', commissionValue: '' })} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200">Hủy</button>
              <button onClick={handleSaveFee} disabled={feeSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {feeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
