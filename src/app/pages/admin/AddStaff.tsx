import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Job {
  _id: string;
  name: string;
}

interface StaffFormData {
  account: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  job: string;
  address: string;
  description: string;
  specialties: string;
  experience: string;
  certifications: string;
  disciplineId: string;
  pricePerSession: string;
}

export function AddStaff() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { selectedClub } = useClub();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentAccount, setCurrentAccount] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryBase64s, setGalleryBase64s] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<{ _id: string; name: string }[]>([]);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<StaffFormData>({
    defaultValues: {
      account: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
      gender: 'Nam',
      dateOfBirth: '',
      job: '',
      address: '',
      description: '',
      specialties: '',
      experience: '',
      certifications: '',
      disciplineId: '',
      pricePerSession: ''
    }
  });

  useEffect(() => {
    fetch(`${getApiUrl()}/api/jobs`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const list = data.data || [];
        if (Array.isArray(list)) {
          setJobs(list);
          if (!isEdit && list.length > 0) setValue('job', list[0]._id);
        }
      })
      .catch(() => {});
    fetch(`${getApiUrl()}/api/disciplines?limit=100`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const list = data.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(list)) setDisciplines(list);
      })
      .catch(() => {});
  }, [setValue, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setPageLoading(true);
    fetch(`${getApiUrl()}/api/staff/${id}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const staff = data.data || data;
        setCurrentAccount(staff.account || '');
        reset({
          account: staff.account || '',
          fullName: staff.fullName || '',
          email: staff.email || '',
          password: '',
          phone: staff.phone || '',
          gender: staff.gender || 'Nam',
          dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : '',
          job: staff.job?._id || staff.job || '',
          address: staff.address || '',
          description: staff.description || '',
          specialties: Array.isArray(staff.specialties) ? staff.specialties.join(', ') : '',
          experience: staff.experience || '',
          certifications: Array.isArray(staff.certifications) ? staff.certifications.join(', ') : '',
          disciplineId: staff.disciplineId?._id || staff.disciplineId || '',
          pricePerSession: staff.pricePerSession ? String(staff.pricePerSession) : ''
        });
        if (staff.avatar) {
          setAvatarPreview(staff.avatar);
          setAvatarBase64(staff.avatar);
        } else {
          setAvatarPreview('');
          setAvatarBase64('');
        }
        if (staff.coverImage) {
          setCoverPreview(staff.coverImage);
          setCoverBase64(staff.coverImage);
        } else {
          setCoverPreview('');
          setCoverBase64('');
        }
        if (Array.isArray(staff.gallery) && staff.gallery.length) {
          setGalleryPreviews(staff.gallery);
          setGalleryBase64s(staff.gallery);
        } else {
          setGalleryPreviews([]);
          setGalleryBase64s([]);
        }
      })
      .catch(() => {
        toast.error('Không thể tải thông tin nhân viên');
        navigate('/admin/staff');
      })
      .finally(() => setPageLoading(false));
  }, [id, isEdit, reset, navigate]);

  const validateDOB = (dob: string) => {
    if (!dob) return true;
    const d = new Date(dob);
    const now = new Date();
    if (d > now) return 'Ngày sinh không được ở tương lai';
    const age = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    if (age < 14) return 'Nhân viên phải từ 14 tuổi trở lên';
    if (age > 70) return 'Ngày sinh không hợp lệ';
    return true;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatarBase64(b64);
      setAvatarPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh bìa tối đa 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCoverBase64(b64);
      setCoverPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) toast.error('Chỉ nhận ảnh <=5MB');
    const remaining = 8 - galleryBase64s.length;
    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) toast.error(`Chỉ được tối đa 8 ảnh, đã thêm ${remaining} ảnh`);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setGalleryBase64s(prev => [...prev, b64]);
        setGalleryPreviews(prev => [...prev, b64]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeGalleryAt = (idx: number) => {
    setGalleryBase64s(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: StaffFormData) => {
    const dobCheck = validateDOB(data.dateOfBirth);
    if (dobCheck !== true) { setError(dobCheck as string); return; }
    setError('');

    const extra: any = {};
    if (data.description?.trim()) extra.description = data.description.trim();
    if (data.specialties?.trim()) extra.specialties = data.specialties.split(',').map(s => s.trim()).filter(Boolean);
    else if (isEdit && data.specialties === '') extra.specialties = [];
    if (data.experience?.trim()) extra.experience = data.experience.trim();
    if (data.certifications?.trim()) extra.certifications = data.certifications.split(',').map(s => s.trim()).filter(Boolean);
    else if (isEdit && data.certifications === '') extra.certifications = [];
    if (data.disciplineId) extra.disciplineId = data.disciplineId;
    else if (isEdit && data.disciplineId === '') extra.disciplineId = null;
    if (data.pricePerSession) {
      const n = Number(data.pricePerSession);
      if (!isNaN(n) && n >= 0) extra.pricePerSession = n;
    }
    if (avatarBase64) extra.avatar = avatarBase64;
    if (coverBase64) extra.coverImage = coverBase64;
    if (galleryBase64s.length) extra.gallery = galleryBase64s;
    else if (isEdit && galleryBase64s.length === 0 && galleryPreviews.length === 0) extra.gallery = [];

    if (isEdit) {
      setLoading(true);
      try {
        const body: any = {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth || null,
          job: data.job,
          address: data.address,
          ...extra
        };
        // Nếu ảnh đã xóa hết thì vẫn gửi gallery rỗng để xóa
        if (isEdit && galleryBase64s.length === 0) body.gallery = [];
        if (data.password) body.password = data.password;

        const res = await fetch(`${getApiUrl()}/api/staff/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });
        const result = await res.json();
        if (res.ok) {
          toast.success('Cập nhật nhân viên thành công!');
          navigate('/admin/staff');
        } else {
          toast.error(result.error || result.message || 'Cập nhật thất bại');
        }
      } catch {
        toast.error('Cập nhật thất bại');
      } finally {
        setLoading(false);
      }
      return;
    }

    const club = selectedClub;
    if (!club || club === 'all') {
      setError('Bạn chưa chọn câu lạc bộ');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { ...data, locationId: club };
      if (avatarBase64) payload.avatar = avatarBase64;
      const res = await fetch(`${getApiUrl()}/api/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Lỗi thêm nhân viên!');
      toast.success('Thêm nhân viên thành công!');
      navigate('/admin/staff');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{isEdit ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên'}</h1>
          <p className="text-slate-600">{isEdit ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới vào hệ thống'}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tài khoản {!isEdit && <span className="text-red-500">*</span>}
                </label>
                {isEdit ? (
                  <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">{currentAccount}</div>
                ) : (
                  <input type="text" {...register('account', { required: 'Vui lòng nhập tài khoản' })}
                    className={`w-full p-3 border ${errors.account ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                )}
                {errors.account && <span className="text-red-500 text-sm mt-1">{errors.account.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input type="text" {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                  className={`w-full p-3 border ${errors.fullName ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' } })}
                  className={`w-full p-3 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isEdit ? 'Mật khẩu mới' : 'Mật khẩu'} {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <input type="password" {...register('password', {
                  ...(!isEdit ? { required: 'Vui lòng nhập mật khẩu' } : {}),
                  minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                })}
                  placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : ''}
                  className={`w-full p-3 border ${errors.password ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input type="tel" {...register('phone', { required: 'Vui lòng nhập số điện thoại', validate: value => /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(value) || 'Số điện thoại không hợp lệ' })}
                  className={`w-full p-3 border ${errors.phone ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới tính
                </label>
                <select {...register('gender')}
                  className={`w-full p-3 border ${errors.gender ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && <span className="text-red-500 text-sm mt-1">{errors.gender.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <select {...register('job', { required: 'Vui lòng chọn công việc' })}
                  className={`w-full p-3 border ${errors.job ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.name}</option>
                  ))}
                </select>
                {errors.job && <span className="text-red-500 text-sm mt-1">{errors.job.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày sinh
                </label>
                <input type="date" {...register('dateOfBirth', { validate: validateDOB })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.dateOfBirth && <span className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message as string}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ảnh đại diện
                </label>
                <input type="file" accept="image/*" onChange={handleAvatarChange}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                {avatarPreview && (
                  <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {isEdit && (
                <>
                  <div className="md:col-span-2 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Thông tin bổ sung (không bắt buộc)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Giới thiệu</label>
                        <textarea {...register('description')} rows={3} placeholder="Mô tả ngắn về nhân viên..."
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Chuyên môn (cách nhau dấu phẩy)</label>
                        <input type="text" {...register('specialties')} placeholder="VD: Yoga, Pilates, Gym"
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kinh nghiệm</label>
                        <input type="text" {...register('experience')} placeholder="VD: 5 năm kinh nghiệm"
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Chứng chỉ (cách nhau dấu phẩy)</label>
                        <input type="text" {...register('certifications')} placeholder="VD: PT Level 2, Yoga Alliance"
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bộ môn</label>
                        <select {...register('disciplineId')} className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                          <option value="">-- Không chọn --</option>
                          {disciplines.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Giá mỗi buổi (đ)</label>
                        <input type="number" {...register('pricePerSession')} placeholder="500000"
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh bìa</label>
                        <input type="file" accept="image/*" onChange={handleCoverChange}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm" />
                        {coverPreview && (
                          <div className="mt-3 w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                            <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Thư viện ảnh (tối đa 8, chọn nhiều file)</label>
                        <input type="file" accept="image/*" multiple onChange={handleGalleryChange}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm" />
                        {galleryPreviews.length > 0 && (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {galleryPreviews.map((src, idx) => (
                              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                <img src={src} alt={`g${idx}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeGalleryAt(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Địa chỉ
                </label>
                <textarea {...register('address')} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/staff')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {loading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Thêm nhân viên'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
