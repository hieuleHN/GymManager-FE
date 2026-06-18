import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Mail, Lock, User, Camera, Dumbbell } from 'lucide-react';
import { Button } from '@mui/material';
import { useAuth, getApiUrl } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isRegister = searchParams.get('mode') === 'register';
  const [loginMode, setLoginMode] = useState<'none' | 'member' | 'staff'>('none');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ account: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    account: '', password: '', confirmPassword: '', fullName: '', gender: 'Nam',
    phone: '', email: '', address: '', idNumber: '', registerDate: new Date().toISOString().split('T')[0]
  });
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState('');
  const [idCardBackPreview, setIdCardBackPreview] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'front') {
        setIdCardFront(file);
        setIdCardFrontPreview(URL.createObjectURL(file));
      } else {
        setIdCardBack(file);
        setIdCardBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginForm.account || !loginForm.password) {
      setError('Vui lòng nhập tài khoản và mật khẩu!');
      return;
    }
    setLoading(true);
    try {
      await login(loginMode === 'staff' ? 'staff' : 'member', loginForm.account, loginForm.password);
      if (loginMode === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(registerForm.phone)) {
      setError('Số điện thoại không hợp lệ!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setError('Email không hợp lệ!');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('account', registerForm.account);
      formData.append('password', registerForm.password);
      formData.append('fullName', registerForm.fullName);
      formData.append('gender', registerForm.gender);
      formData.append('phone', registerForm.phone);
      formData.append('email', registerForm.email);
      formData.append('address', registerForm.address);
      formData.append('idNumber', registerForm.idNumber);
      formData.append('registerDate', registerForm.registerDate);
      if (idCardFront) formData.append('idCardFront', idCardFront);
      if (idCardBack) formData.append('idCardBack', idCardBack);

      const res = await fetch(`${getApiUrl()}/api/customers/register`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại!');
      }
      alert('Đăng ký thành công! Vui lòng chờ nhân viên xác nhận tài khoản.');
      navigate('/auth');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Link to="/">
              <ImageWithFallback src={logo} alt="Logo" className="h-28 w-auto mx-auto object-contain" />
            </Link>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-4">Đăng ký tài khoản</h2>
            <p className="text-slate-500 mt-2">Điền thông tin để đăng ký làm hội viên</p>
          </div>

          <form onSubmit={handleRegister} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản <span className="text-red-500">*</span></label>
                <input type="text" required value={registerForm.account} onChange={(e) => setRegisterForm({ ...registerForm, account: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập tài khoản" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input type="text" required value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                <input type={showPassword ? 'text' : 'password'} required value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ít nhất 6 ký tự" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                <input type={showPassword ? 'text' : 'password'} required value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập lại mật khẩu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
                <select value={registerForm.gender} onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" required value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0901234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số căn cước</label>
                <input type="text" value={registerForm.idNumber} onChange={(e) => setRegisterForm({ ...registerForm, idNumber: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="001234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày đăng ký</label>
                <input type="date" value={registerForm.registerDate} onChange={(e) => setRegisterForm({ ...registerForm, registerDate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh mặt trước căn cước</label>
                <label className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'front')} />
                </label>
                {idCardFrontPreview && <img src={idCardFrontPreview} alt="Front" className="mt-2 w-full h-32 object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh mặt sau căn cước</label>
                <label className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'back')} />
                </label>
                {idCardBackPreview && <img src={idCardBackPreview} alt="Back" className="mt-2 w-full h-32 object-cover rounded-lg" />}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <textarea value={registerForm.address} onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  rows={2} className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập địa chỉ" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input type="checkbox" id="showPass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded" />
              <label htmlFor="showPass" className="text-slate-600">Hiện mật khẩu</label>
            </div>

            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
              sx={{ height: 56, borderRadius: 3, bgcolor: '#4f46e5', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#4338ca' } }}>
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>

          <p className="text-center mt-6 text-slate-500">
            Đã có tài khoản? <Link to="/auth" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    );
  }

  if (loginMode === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <Link to="/">
              <ImageWithFallback src={logo} alt="Logo" className="h-40 w-auto mx-auto object-contain" />
            </Link>
            <h2 className="text-3xl font-extrabold text-slate-900">Chào mừng trở lại</h2>
            <p className="text-slate-500 mt-2">Chọn vai trò để đăng nhập</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
            <button onClick={() => setLoginMode('member')}
              className="w-full p-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all text-center">
              <User className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-indigo-700">Hội viên</h3>
              <p className="text-sm text-indigo-500 mt-1">Đăng nhập dành cho hội viên</p>
            </button>
            <button onClick={() => setLoginMode('staff')}
              className="w-full p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-center">
              <Dumbbell className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-700">Nhân viên</h3>
              <p className="text-sm text-emerald-500 mt-1">Đăng nhập dành cho nhân viên</p>
            </button>
          </div>

          <p className="text-center mt-8 text-slate-500">
            Chưa có tài khoản? <Link to="/auth?mode=register" className="text-indigo-600 font-bold hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <ImageWithFallback src={logo} alt="Logo" className="h-28 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-4">
            {loginMode === 'staff' ? 'Đăng nhập nhân viên' : 'Đăng nhập hội viên'}
          </h2>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
            <input type="text" required value={loginForm.account} onChange={(e) => setLoginForm({ ...loginForm, account: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập tài khoản" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input type={showPassword ? 'text' : 'password'} required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" id="showPass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded" />
            <label htmlFor="showPass" className="text-slate-600">Hiện mật khẩu</label>
          </div>

          <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
            sx={{ height: 56, borderRadius: 3, bgcolor: '#4f46e5', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#4338ca' } }}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>

          <button type="button" onClick={() => setLoginMode('none')} className="w-full text-sm text-slate-500 hover:text-slate-700">
            ← Quay lại chọn vai trò
          </button>
        </form>

        {loginMode === 'member' && (
          <p className="text-center mt-6 text-slate-500">
            Chưa có tài khoản? <Link to="/auth?mode=register" className="text-indigo-600 font-bold hover:underline">Đăng ký ngay</Link>
          </p>
        )}
      </div>
    </div>
  );
}