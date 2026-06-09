import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import logo from '../../imports/ChatGPT_Image_May_14__2026__09_48_52_PM.png';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Contract() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');

  const contractData = location.state;

  if (!contractData || !contractData.package || !contractData.club) {
    return <Navigate to="/packages" />;
  }

  const { package: pkg, club, durationType, totalPrice } = contractData;

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const today = new Date().toLocaleDateString('vi-VN');

  const handlePayment = () => {
    if (!agreed) {
      alert('Vui lòng đồng ý với các điều khoản hợp đồng');
      return;
    }
    if (!signature.trim()) {
      alert('Vui lòng nhập chữ ký (họ tên) của bạn');
      return;
    }

    navigate('/payment', {
      state: {
        package: pkg,
        club,
        durationType,
        totalPrice,
        signature
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b border-slate-200">
            <ImageWithFallback src={logo} alt="ZenFitness Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">HỢP ĐỒNG CUNG CẤP DỊCH VỤ</h1>
            <p className="text-lg text-slate-600">Câu Lạc Bộ Thể Hình ZenFitness</p>
          </div>

          {/* Contract Content */}
          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">I. THÔNG TIN CÁC BÊN</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-3">BÊN A (Bên cung cấp dịch vụ)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Tên:</strong> ZENFITNESS</p>
                    <p><strong>Địa chỉ:</strong> {club.address}</p>
                    <p><strong>Điện thoại:</strong> {club.phone}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-3">BÊN B (Hội viên)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Họ tên:</strong> {user?.name || 'Chưa đăng nhập'}</p>
                    <p><strong>Email:</strong> {user?.email || 'Chưa đăng nhập'}</p>
                    <p><strong>Ngày ký:</strong> {today}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">II. THÔNG TIN GÓI DỊCH VỤ</h2>
              <div className="bg-indigo-50 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Gói tập:</p>
                    <p className="font-bold text-slate-900 text-lg">{pkg.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Thời hạn:</p>
                    <p className="font-bold text-slate-900 text-lg">
                      {durationType === 'month' ? '1 tháng' : '12 tháng'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Cơ sở tập luyện:</p>
                    <p className="font-semibold text-slate-900">{club.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Tổng giá trị:</p>
                    <p className="font-bold text-indigo-600 text-2xl">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-slate-600 mb-2 text-sm">Quyền lợi bao gồm:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {pkg.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">III. CAM KẾT CỦA CÁC BÊN</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-2">Cam kết của Bên A:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• Cung cấp đầy đủ dịch vụ theo gói đã đăng ký</li>
                    <li>• Đảm bảo cơ sở vật chất, thiết bị an toàn, vệ sinh</li>
                    <li>• Hỗ trợ tư vấn, hướng dẫn chuyên nghiệp</li>
                  </ul>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-2">Cam kết của Bên B:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• Thanh toán đầy đủ chi phí theo thỏa thuận</li>
                    <li>• Tuân thủ nội quy, quy định của phòng tập</li>
                    <li>• Bảo quản tài sản, thiết bị của phòng tập</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">IV. ĐIỀU KHOẢN KHÁC</h2>
              <div className="text-sm text-slate-700 space-y-2 bg-slate-50 p-4 rounded-lg">
                <p>• Hợp đồng có hiệu lực kể từ ngày ký và thanh toán đầy đủ</p>
                <p>• Mọi tranh chấp sẽ được giải quyết thông qua thương lượng, hòa giải</p>
                <p>• Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-t border-slate-200 pt-8">
            <div className="mb-6">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }}
                  />
                }
                label={
                  <span className="text-sm text-slate-700">
                    Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản trong hợp đồng này
                  </span>
                }
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chữ ký của hội viên (Nhập họ tên):
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Nhập họ tên của bạn để ký"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(-1)}
                sx={{
                  flex: 1,
                  height: 56,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                Quay lại
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handlePayment}
                disabled={!agreed || !signature.trim()}
                sx={{
                  flex: 2,
                  height: 56,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: '#4f46e5',
                  '&:hover': {
                    bgcolor: '#4338ca'
                  }
                }}
              >
                Thanh toán
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
