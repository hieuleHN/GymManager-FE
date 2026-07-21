import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';

export function Contract() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [policies, setPolicies] = useState<{ _id: string; title: string; description: string }[]>([]);

  const regData = location.state;
  if (!regData || !regData.package) {
    return <Navigate to="/packages" />;
  }

  const { package: pkg, customer, durationMonths, totalPrice } = regData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    const locationId = customer?.locationId?._id || customer?.locationId;
    if (locationId) {
      fetch(`${getApiUrl()}/api/policies`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPolicies(data);
        })
        .catch(() => {});
    }
  }, [customer]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      e.preventDefault();
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      e.preventDefault();
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const today = new Date().toLocaleDateString('vi-VN');

  const handleSubmit = async () => {
    if (!agreed) {
      alert('Vui lòng đồng ý với các điều khoản dịch vụ');
      return;
    }
    if (!signatureData) {
      alert('Vui lòng ký tên (vẽ chữ ký) để hoàn tất đăng ký');
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        package_id: pkg._id,
        locationId: customer?.locationId?._id || customer?.locationId,
        duration_months: durationMonths,
        total_price: totalPrice,
        signature: signatureData,
        policies: policies.map(p => p._id)
      };

      const res = await fetch(`${getApiUrl()}/api/user-packages/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      navigate('/payment', {
        state: {
          package: pkg,
          registration: data.registration,
          customer,
          durationMonths,
          totalPrice,
          message: data.message
        }
      });
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-8 pb-8 border-b border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">CHÍNH SÁCH & ĐIỀU KHOẢN DỊCH VỤ</h1>
            <p className="text-lg text-slate-600">Hợp đồng đăng ký gói tập</p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">I. THÔNG TIN CÁC BÊN</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-3">BÊN A (Bên cung cấp dịch vụ)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Tên:</strong> ZENFITNESS</p>
                    <p><strong>Địa chỉ:</strong> {customer?.locationId?.title || 'Hệ thống phòng tập ZenFitness'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-3">BÊN B (Hội viên)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Họ tên:</strong> {customer?.fullName || user?.name || 'Chưa đăng nhập'}</p>
                    <p><strong>Email:</strong> {customer?.email || 'Chưa cập nhật'}</p>
                    <p><strong>Số điện thoại:</strong> {customer?.phone || 'Chưa cập nhật'}</p>
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
                    <p className="font-bold text-slate-900 text-lg">{durationMonths} tháng</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Cơ sở tập luyện:</p>
                    <p className="font-semibold text-slate-900">{customer?.locationId?.title || 'ZenFitness'}</p>
                  </div>
                  {(pkg.ptSessionsPerMonth > 0 || pkg.isFullMonth) && (
                    <div>
                      <p className="text-slate-600 mb-1">Tập với HLV:</p>
                      <p className="font-semibold text-indigo-600">
                        {pkg.isFullMonth
                          ? 'Không giới hạn'
                          : `${pkg.ptSessionsPerMonth} buổi/tháng (Tổng: ${pkg.ptSessionsPerMonth * durationMonths} buổi)`
                        }
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-600 mb-1">Tổng giá trị:</p>
                    <p className="font-bold text-indigo-600 text-2xl">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-slate-600 mb-2 text-sm">Quyền lợi bao gồm:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {(pkg.features || []).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {pkg.contractA && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">III. ĐIỀU KHOẢN BÊN A (Bên cung cấp dịch vụ)</h2>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                  {pkg.contractA}
                </div>
              </div>
            )}

            {pkg.contractB && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">IV. ĐIỀU KHOẢN BÊN B (Hội viên)</h2>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                  {pkg.contractB}
                </div>
              </div>
            )}

            {pkg.contractTerms && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">V. ĐIỀU KHOẢN CAM KẾT CHUNG (Cả hai bên)</h2>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                  {pkg.contractTerms}
                </div>
              </div>
            )}

            {policies.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">VI. CHÍNH SÁCH CHUNG</h2>
                <div className="space-y-3">
                  {policies.map((policy, idx) => (
                    <div key={policy._id} className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-900 mb-1">{idx + 1}. {policy.title}</h3>
                      <p className="text-sm text-slate-700">{policy.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                    Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản dịch vụ này
                  </span>
                }
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chữ ký của hội viên (Vẽ chữ ký của bạn vào ô bên dưới):
              </label>
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={180}
                  className="w-full touch-none"
                  style={{ minHeight: 180, cursor: 'crosshair' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {signatureData && (
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa chữ ký
                </button>
              )}
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
                onClick={handleSubmit}
                disabled={!agreed || !signatureData || submitting}
                sx={{
                  flex: 2,
                  height: 56,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' }
                }}
              >
                {submitting ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
