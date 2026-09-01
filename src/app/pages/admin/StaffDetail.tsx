import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { ArrowLeft, Edit, Lock, Unlock, Mail, Phone, MapPin, Calendar, Briefcase, User, Shield, Star, Image as ImageIcon, Award, DollarSign, Clock } from 'lucide-react';
import { Button } from '@mui/material';

interface StaffDetailData {
  _id: string;
  account: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth?: string;
  job?: { _id: string; name: string; description?: string };
  address?: string;
  status: string;
  avatar?: string;
  coverImage?: string;
  description?: string;
  specialties?: string[];
  gallery?: string[];
  rating?: number;
  totalReviews?: number;
  experience?: string;
  certifications?: string[];
  disciplineId?: { _id: string; name: string } | string;
  pricePerSession?: number;
  locationId?: { _id: string; title?: string; address?: string } | string;
  startDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${getApiUrl()}/api/staff/${id}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const s = data.data || data;
        if (!s || s.error) throw new Error(s?.error || 'Không tìm thấy nhân viên');
        setStaff(s);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setAttLoading(true);
    fetch(`${getApiUrl()}/api/staff-attendance/history?staffId=${id}&limit=10`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setAttendance(data.data || []))
      .catch(() => {})
      .finally(() => setAttLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!staff) return;
    const next = staff.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Bạn có chắc muốn ${next === 'active' ? 'kích hoạt lại' : 'cho nghỉ việc'} nhân viên này?`)) return;
    const res = await fetch(`${getApiUrl()}/api/staff/${staff._id}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status: next })
    });
    if (res.ok) {
      const data = await res.json();
      setStaff(data.staff || { ...staff, status: next });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto py-12 text-center text-slate-500">Đang tải chi tiết nhân viên...</div>
      </AdminLayout>
    );
  }
  if (error || !staff) {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy'}</p>
          <Button variant="outlined" onClick={() => navigate('/admin/staff')}>Quay lại danh sách</Button>
        </div>
      </AdminLayout>
    );
  }

  const locationName = typeof staff.locationId === 'object' && staff.locationId ? (staff.locationId.title || staff.locationId.address || '-') : '-';
  const disciplineName = typeof staff.disciplineId === 'object' && staff.disciplineId ? staff.disciplineId.name : '-';
  const jobName = staff.job?.name || '-';

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button startIcon={<ArrowLeft className="w-4 h-4" />} variant="outlined" onClick={() => navigate('/admin/staff')}
            sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
            Quay lại
          </Button>
          <div className="flex gap-2">
            <Button variant="outlined" startIcon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/admin/staff/${staff._id}/edit`)}
              sx={{ borderColor: '#4f46e5', color: '#4f46e5', textTransform: 'none', borderRadius: 2 }}>
              Sửa
            </Button>
            <Button variant="contained" startIcon={staff.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              onClick={handleToggleStatus}
              sx={{ bgcolor: staff.status === 'active' ? '#f59e0b' : '#10b981', '&:hover': { bgcolor: staff.status === 'active' ? '#d97706' : '#059669' }, textTransform: 'none', borderRadius: 2 }}>
              {staff.status === 'active' ? 'Cho nghỉ việc' : 'Kích hoạt lại'}
            </Button>
          </div>
        </div>

        {/* Cover */}
        {staff.coverImage && (
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <img src={staff.coverImage} alt="cover" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-28 h-28 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shrink-0">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-indigo-600">{staff.fullName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{staff.fullName}</h1>
            <p className="text-indigo-600 font-semibold flex items-center gap-2 mt-1"><Briefcase className="w-4 h-4" />{jobName}</p>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><User className="w-4 h-4" />@{staff.account} {staff.rating ? <span className="inline-flex items-center gap-1 ml-2 text-amber-600"><Star className="w-4 h-4 fill-amber-400" />{staff.rating} ({staff.totalReviews} đánh giá)</span> : null}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                {staff.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}
              </span>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{staff.gender}</span>
              {disciplineName !== '-' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">{disciplineName}</span>}
            </div>
          </div>
        </div>

        {/* 13 trường + bổ sung */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-3"><User className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Họ và tên</p><p className="font-semibold text-slate-900">{staff.fullName}</p></div></div>
            <div className="flex gap-3"><Calendar className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Ngày sinh</p><p className="font-semibold text-slate-900">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</p></div></div>
            <div className="flex gap-3"><Shield className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Giới tính</p><p className="font-semibold text-slate-900">{staff.gender}</p></div></div>
            <div className="flex gap-3"><Phone className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Số điện thoại</p><p className="font-semibold text-slate-900">{staff.phone}</p></div></div>
            <div className="flex gap-3"><Mail className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Email</p><p className="font-semibold text-slate-900 break-all">{staff.email}</p></div></div>
            <div className="flex gap-3"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Địa chỉ</p><p className="font-semibold text-slate-900">{staff.address || '-'}</p></div></div>
            <div className="flex gap-3"><Briefcase className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Chức vụ</p><p className="font-semibold text-indigo-600">{jobName}</p><p className="text-xs text-slate-500">{staff.job?.description || ''}</p></div></div>
            <div className="flex gap-3"><Briefcase className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Cơ sở (Location)</p><p className="font-semibold text-slate-900">{locationName}</p></div></div>
            <div className="flex gap-3"><Calendar className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Ngày bắt đầu làm việc</p><p className="font-semibold text-slate-900">{staff.startDate ? new Date(staff.startDate).toLocaleDateString('vi-VN') : '-'}</p></div></div>
            <div className="flex gap-3"><Shield className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Trạng thái làm việc</p><p className={`font-semibold ${staff.status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>{staff.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}</p></div></div>
            <div className="flex gap-3"><User className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Tài khoản đăng nhập</p><p className="font-semibold text-slate-900">{staff.account}</p></div></div>
            <div className="flex gap-3"><Shield className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="text-slate-500">Quyền truy cập (theo chức vụ)</p><p className="font-semibold text-slate-900">{staff.job ? 'Xem trang Phân quyền' : '-'}</p></div></div>
          </div>
        </div>

        {/* Giới thiệu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Giới thiệu</h2>
          {staff.description ? <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{staff.description}</p> : <p className="text-sm text-slate-400">Chưa có giới thiệu</p>}
          {staff.experience && <p className="mt-3 text-sm"><span className="font-semibold">Kinh nghiệm:</span> {staff.experience}</p>}
        </div>

        {/* Chuyên môn & chứng chỉ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Chuyên môn & chứng chỉ</h2>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-500">Bộ môn</p><p className="font-semibold">{disciplineName}</p></div>
            <div><p className="text-slate-500">Chuyên môn (specialties)</p><div className="flex flex-wrap gap-1 mt-1">{staff.specialties?.length ? staff.specialties.map(s => <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">{s}</span>) : <span className="text-slate-400">-</span>}</div></div>
            <div><p className="text-slate-500">Chứng chỉ</p><div className="flex flex-wrap gap-1 mt-1">{staff.certifications?.length ? staff.certifications.map(c => <span key={c} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs flex items-center gap-1"><Award className="w-3 h-3" />{c}</span>) : <span className="text-slate-400">-</span>}</div></div>
            <div className="flex gap-6">
              <div><p className="text-slate-500">Giá mỗi buổi</p><p className="font-semibold flex items-center gap-1"><DollarSign className="w-4 h-4" />{(staff.pricePerSession ?? 500000).toLocaleString('vi-VN')}đ</p></div>
              <div><p className="text-slate-500">Đánh giá</p><p className="font-semibold">{staff.rating ?? 0} ({staff.totalReviews ?? 0} lượt)</p></div>
            </div>
          </div>
        </div>

        {/* Hình ảnh */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" />Hình ảnh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Ảnh đại diện</p>
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {staff.avatar ? <img src={staff.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-slate-400">Không có</span>}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-600 mb-2">Ảnh bìa</p>
              <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {staff.coverImage ? <img src={staff.coverImage} alt="cover" className="w-full h-full object-cover" /> : <span className="text-slate-400">Không có</span>}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Thư viện ảnh (gallery)</p>
            {staff.gallery?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {staff.gallery.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={img} alt={`gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Chưa có ảnh trong thư viện</p>
            )}
          </div>
        </div>

        {/* Lịch sử chấm công */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />Lịch sử chấm công (10 gần nhất)</h2>
          {attLoading ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : attendance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold">Ngày</th>
                    <th className="px-4 py-2 text-left font-bold">Check-in</th>
                    <th className="px-4 py-2 text-left font-bold">Check-out</th>
                    <th className="px-4 py-2 text-left font-bold">Trạng thái</th>
                    <th className="px-4 py-2 text-right font-bold">Đi muộn</th>
                    <th className="px-4 py-2 text-right font-bold">Về sớm</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a: any) => (
                    <tr key={a._id} className="border-b border-slate-100">
                      <td className="px-4 py-2">{new Date(a.date || a.checkInTime).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-2">{a.checkInTime ? new Date(a.checkInTime).toLocaleString('vi-VN') : '-'}</td>
                      <td className="px-4 py-2">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleString('vi-VN') : '-'}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === 'late' ? 'bg-amber-100 text-amber-700' : a.status === 'checked-out' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{a.statusLabel || a.status}</span></td>
                      <td className="px-4 py-2 text-right text-red-600">{a.minutesLate ? `${a.minutesLate} phút` : '-'}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{a.minutesEarly ? `${a.minutesEarly} phút` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Chưa có lịch sử chấm công</p>
          )}
          <div className="mt-4">
            <Button variant="outlined" onClick={() => navigate('/admin/staff-attendance')}
              sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', borderRadius: 2 }}>
              Xem tất cả chấm công
            </Button>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center">
          Tạo lúc: {staff.createdAt ? new Date(staff.createdAt).toLocaleString('vi-VN') : '-'} • Cập nhật: {staff.updatedAt ? new Date(staff.updatedAt).toLocaleString('vi-VN') : '-'}
        </div>
      </div>
    </AdminLayout>
  );
}
