import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Mail, Lock, User, Dumbbell, Github, ArrowLeft } from 'lucide-react';
import { Button, TextField, InputAdornment, Divider } from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isRegister = searchParams.get('mode') === 'register';
  const [role, setRole] = useState<'member' | 'pt' | 'admin'>('member');

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
              <TextField
                fullWidth
                label="Họ và Tên"
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
            )}

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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Đăng nhập với vai trò</label>
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
