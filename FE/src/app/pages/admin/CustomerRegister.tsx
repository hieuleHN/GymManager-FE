import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera } from 'lucide-react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';

export function CustomerRegister() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    account: '', password: '', fullName: '', gender: 'Nam', phone: '',
    email: '', address: '', idNumber: '', registerDate: new Date().toISOString().split('T')[0]
  });
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (side === 'front') {
      setIdCardFront(file);
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setIdCardBack(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = '';
    if (!value && (field === 'account' || field === 'fullName' || field === 'phone' || field === 'email' || field === 'password')) {
      const labels: Record<string, string> = { account: 'tài khoản', fullName: 'họ tên', phone: 'số điện thoại', email: 'email', password: 'mật khẩu' };
      msg = 'Vui lòng nhập ' + labels[field];
    } else if (field === 'phone' && value && !/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(value)) {
      msg = 'Số điện thoại không hợp lệ';
    } else if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      msg = 'Email không hợp lệ';
    } else if (field === 'password' && value && value.length < 6) {
      msg = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrors: Record<string, string> = {};
    if (!formData.account) newErrors.account = 'Vui lòng nhập tài khoản';
    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.phone) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if ('password' in formData && !formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if ('password' in formData && formData.password && formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!selectedClub || selectedClub === 'all') newErrors.club = 'Bạn chưa chọn câu lạc bộ';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (selectedClub && selectedClub !== 'all') form.append('locationId', selectedClub);
      if (idCardFront) form.append('idCardFront', idCardFront);
      if (idCardBack) form.append('idCardBack', idCardBack);

      const res = await fetch(`${getApiUrl()}/api/customers/register`, {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại!');
      alert('Đăng ký khách hàng thành công!');
      navigate('/admin/customers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký khách hàng</h1>
          <p className="text-slate-600">Thêm khách hàng mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tài khoản <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.account} onChange={(e) => handleChange('account', e.target.value)}
                  onBlur={() => handleBlur('account', formData.account)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.account ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.account && <p className="text-red-500 text-sm mt-1">{errors.account}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu <span className="text-red-500">*</span></label>
                <input type="password" required value={formData.password} onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password', formData.password)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName', formData.fullName)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
                <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" required value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone', formData.phone)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email', formData.email)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số căn cước</label>
                <input type="text" value={formData.idNumber} onChange={(e) => handleChange('idNumber', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày đăng ký</label>
                <input type="date" value={formData.registerDate} onChange={(e) => handleChange('registerDate', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh mặt trước căn cước</label>
                <label className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'front')} />
                </label>
                {frontPreview && <img src={frontPreview} alt="Front" className="mt-2 w-full h-24 object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh mặt sau căn cước</label>
                <label className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'back')} />
                </label>
                {backPreview && <img src={backPreview} alt="Back" className="mt-2 w-full h-24 object-cover rounded-lg" />}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                <textarea value={formData.address} onChange={(e) => handleChange('address', e.target.value)} rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <Button type="button" variant="outlined" onClick={() => navigate('/admin/customers')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                Hủy
              </Button>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}