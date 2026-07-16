import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Mail, Lock, User, Camera, Dumbbell, MapPin, Eye, EyeOff } from 'lucide-react';
import { Button } from '@mui/material';
import { useAuth, getApiUrl } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useForm } from 'react-hook-form';

interface RegisterFormData {
  account: string;
  password: string;
  confirmPassword: string;
  locationId: string;
}

interface LoginFormData {
  account: string;
  password: string;
}

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isRegister = searchParams.get('mode') === 'register';
  const [loginMode, setLoginMode] = useState<'none' | 'member' | 'staff'>('none');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const {
    register: regRegister,
    handleSubmit: regHandleSubmit,
    formState: { errors: regErrors },
    watch: regWatch,
  } = useForm<RegisterFormData>();

  const {
    register: loginRegister,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>();

  useEffect(() => {
    if (isRegister) {
      fetch(`${getApiUrl()}/api/locations`)
        .then(res => res.json())
        .then(data => setLocations(Array.isArray(data) ? data : data?.data || []))
        .catch(() => {});
    }
  }, [isRegister]);

  const onLogin = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      await login(loginMode === 'staff' ? 'staff' : 'member', data.account, data.password);
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

  const onRegister = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: data.account,
          password: data.password,
          locationId: data.locationId
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Đăng ký thất bại!');
      }
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
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/">
              <ImageWithFallback src={logo} alt="Logo" className="h-28 w-auto mx-auto object-contain" />
            </Link>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-4">Đăng ký tài khoản</h2>
            <p className="text-slate-500 mt-2">Tạo tài khoản hội viên mới</p>
          </div>

          <form onSubmit={regHandleSubmit(onRegister)} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản <span className="text-red-500">*</span></label>
              <input type="text" {...regRegister('account', { required: 'Vui lòng nhập tài khoản!' })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập tài khoản" />
              {regErrors.account && <span className="text-red-500 text-sm mt-1">{regErrors.account.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
              <input type={showPassword ? 'text' : 'password'} {...regRegister('password', { required: 'Vui lòng nhập mật khẩu!', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' } })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ít nhất 6 ký tự" />
              {regErrors.password && <span className="text-red-500 text-sm mt-1">{regErrors.password.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
              <input type={showPassword ? 'text' : 'password'} {...regRegister('confirmPassword', { required: 'Vui lòng xác nhận mật khẩu!', validate: (value) => value === regWatch('password') || 'Mật khẩu xác nhận không khớp!' })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập lại mật khẩu" />
              {regErrors.confirmPassword && <span className="text-red-500 text-sm mt-1">{regErrors.confirmPassword.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Câu lạc bộ <span className="text-red-500">*</span></label>
              <select {...regRegister('locationId', { required: 'Vui lòng chọn câu lạc bộ!' })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Chọn câu lạc bộ --</option>
                {locations.map((loc: any) => (
                  <option key={loc._id} value={loc._id}>{loc.address || loc.title || loc.name}</option>
                ))}
              </select>
              {regErrors.locationId && <span className="text-red-500 text-sm mt-1">{regErrors.locationId.message}</span>}
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

        <form onSubmit={loginHandleSubmit(onLogin)} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
            <input type="text" {...loginRegister('account', { required: 'Vui lòng nhập tài khoản!' })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập tài khoản" />
            {loginErrors.account && <span className="text-red-500 text-sm mt-1">{loginErrors.account.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input type={showPassword ? 'text' : 'password'} {...loginRegister('password', { required: 'Vui lòng nhập mật khẩu!' })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
            {loginErrors.password && <span className="text-red-500 text-sm mt-1">{loginErrors.password.message}</span>}
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
