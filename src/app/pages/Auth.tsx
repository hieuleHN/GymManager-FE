import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Mail, Lock, User, Dumbbell, Github, ArrowLeft, Phone, MapPin, Upload } from 'lucide-react';
import { Button, TextField, InputAdornment, Divider, MenuItem } from '@mui/material';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isRegister = searchParams.get('mode') === 'register';
  const [role, setRole] = useState<'member' | 'pt' | 'admin'>('member');
  const [facility, setFacility] = useState('');
  const [frontCardName, setFrontCardName] = useState('');
  const [backCardName, setBackCardName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <ImageWithFallback src={logo} alt="ZenFitness Logo" className="h-40 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900">
            {isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isRegister 
              ? 'Tham gia cộng đồng của chúng tôi và bắt đầu hành trình ngay hôm nay.' 
              : 'Đăng nhập để truy cập bảng điều khiển và kế hoạch tập luyện.'}
          </p>
        </div>

        <motion.div
          key={isRegister ? 'register' : 'login'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="flex flex-col gap-6">
                {/* Họ và Tên */}
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="Nguyễn Văn A"
                  slotProps={{
                      input: {
                          startAdornment: (
                              <InputAdornment position="start">
                                <User size={20} className="text-slate-400" />
                              </InputAdornment>
                            ),
                      }
                  }}
                />

                {/* Số điện thoại */}
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  placeholder="0912345678"
                  type="tel"
                  slotProps={{
                      input: {
                          startAdornment: (
                              <InputAdornment position="start">
                                <Phone size={20} className="text-slate-400" />
                              </InputAdornment>
                            ),
                      }
                  }}
                />

                {/* Chọn cơ sở phòng tập */}
                <TextField
                  select
                  fullWidth
                  label="Cơ sở phòng tập"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  slotProps={{
                      input: {
                          startAdornment: (
                              <InputAdornment position="start">
                                <MapPin size={20} className="text-slate-400 mr-2" />
                              </InputAdornment>
                            ),
                      }
                  }}
                >
                  <MenuItem value="" disabled>--- Chọn cơ sở phòng tập ---</MenuItem>
                  <MenuItem value="co-so-1">Cơ sở 1: ZenFitness Quận 1, TP. HCM</MenuItem>
                  <MenuItem value="co-so-2">Cơ sở 2: ZenFitness Quận 7, TP. HCM</MenuItem>
                  <MenuItem value="co-so-3">Cơ sở 3: ZenFitness Cầu Giấy, Hà Nội</MenuItem>
                </TextField>

                {/* Tải ảnh Căn cước công dân */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ảnh mặt trước */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Ảnh căn cước mặt trước
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/20 group h-[110px]">
                      <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 mb-1" />
                      <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium text-center line-clamp-2 px-1">
                        {frontCardName ? frontCardName : "Tải lên mặt trước"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) setFrontCardName(e.target.files[0].name);
                        }} 
                      />
                    </label>
                  </div>

                  {/* Ảnh mặt sau */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Ảnh căn cước mặt sau
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/20 group h-[110px]">
                      <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 mb-1" />
                      <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium text-center line-clamp-2 px-1">
                        {backCardName ? backCardName : "Tải lên mặt sau"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) setBackCardName(e.target.files[0].name);
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Email (Dành cho cả Đăng nhập & Đăng ký) */}
            <TextField
              fullWidth
              label="Địa chỉ Email"
              placeholder="ten@vi-du.com"
              slotProps={{
                  input: {
                      startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={20} className="text-slate-400" />
                          </InputAdornment>
                        ),
                  }
              }}
            />

            {/* Mật khẩu (Dành cho cả Đăng nhập & Đăng ký) */}
             <div className="flex flex-col gap-6">
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              slotProps={{
                  input: {
                      startAdornment: (
                          <InputAdornment position="start">
                            <Lock size={20} className="text-slate-400" />
                          </InputAdornment>
                        ),
                  }
              }}
            />
             </div>

            {/* Chọn vai trò đăng nhập */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Đăng nhập với vai trò</div>
              <div className="grid grid-cols-3 gap-2">
                {(['member', 'pt', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      role === r 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500 ring-opacity-10' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {r === 'member' ? 'Hội viên' : r === 'pt' ? 'HLV' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút Đăng ký / Đăng nhập */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ 
                height: 56, 
                borderRadius: 3, 
                bgcolor: '#4f46e5', 
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#4338ca' } 
              }}
            >
              {isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Login xã hội (Google / Github) */}
          <div className="mt-8">
            <Divider>
              <span className="text-xs text-slate-400 px-2 uppercase font-medium">Hoặc tiếp tục với</span>
            </Divider>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ borderRadius: 3, borderColor: '#e2e8f0', color: '#475569', textTransform: 'none' }}
                startIcon={<img src="https://www.google.com/favicon.ico" className="w-4 h-4" />}
              >
                Google
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ borderRadius: 3, borderColor: '#e2e8f0', color: '#475569', textTransform: 'none' }}
                startIcon={<Github className="w-4 h-4" />}
              >
                Github
              </Button>
            </div>
          </div>
        </motion.div>

        <p className="text-center mt-8 text-slate-500">
          {isRegister ? (
            <>Đã có tài khoản? <Link to="/auth" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link></>
          ) : (
            <>Chưa có tài khoản? <Link to="/auth?mode=register" className="text-indigo-600 font-bold hover:underline">Tạo tài khoản</Link></>
          )}
        </p>
      </div>
    </div>
  );
}