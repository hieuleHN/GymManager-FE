import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Button } from '@mui/material';
import { CreditCard, QrCode, Building2, Smartphone, Check, Loader2 } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../context/AuthContext';

const paymentMethods = [
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: Smartphone,
    description: 'Thanh toán qua ví điện tử VNPay'
  },
  {
    id: 'momo',
    name: 'MoMo',
    icon: Smartphone,
    description: 'Thanh toán qua ví điện tử MoMo'
  },
  {
    id: 'bank-card',
    name: 'Thẻ ngân hàng',
    icon: CreditCard,
    description: 'Thanh toán bằng thẻ ATM/Visa/Mastercard'
  },
  {
    id: 'bank-transfer',
    name: 'Chuyển khoản',
    icon: Building2,
    description: 'Chuyển khoản qua số tài khoản ngân hàng'
  },
  {
    id: 'qr-code',
    name: 'Quét mã QR',
    icon: QrCode,
    description: 'Quét mã QR để thanh toán nhanh'
  }
];

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNumber: '', accountName: '', branch: '' });
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(true);

  const paymentData = location.state;

  if (!paymentData || !paymentData.package) {
    return <Navigate to="/packages" />;
  }

  const { package: pkg, registration, customer, durationMonths, totalPrice } = paymentData;

  useEffect(() => {
    const locationId = 
      registration?.locationId || 
      pkg?.locationId?._id || 
      pkg?.locationId || 
      customer?.locationId?._id || 
      customer?.locationId;

    if (!locationId) {
      setLoadingPaymentInfo(false);
      return;
    }
    
    fetch(`${getApiUrl()}/api/locations/${locationId}`, { headers: getAuthHeaders() as any })
      .then(res => res.json())
      .then(data => {
        setBankInfo({
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          branch: data.branch || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPaymentInfo(false));
  }, [customer, registration, pkg]); 

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Vui lòng chọn phương thức thanh toán');
      return;
    }
    if (!registration?.id) {
      alert('Không tìm thấy thông tin đăng ký!');
      return;
    }

    setProcessing(true);
    try {
      const idsToPay = isBookingPayment
        ? (allBookingIds.length > 0 ? allBookingIds : [bookingId])
        : [regId].filter(Boolean);
      const res = await fetch(`${getApiUrl()}/api/wallet/pay`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isBookingPayment ? 'booking' : 'package',
          ids: idsToPay,
          totalAmount: totalPrice
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cập nhật thất bại');
      }
      setPaymentSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Đã gửi yêu cầu thanh toán!
          </h2>
          <p className="text-slate-600 mb-2">
            Admin sẽ xác nhận thanh toán trong thời gian sớm nhất.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Cảm ơn bạn đã đăng ký gói tập tại ZenFitness.
          </p>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard/my-packages')}
            sx={{
              height: 56,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' }
            }}
          >
            Về gói tập của tôi
          </Button>
        </div>
      </div>
    );
  }

  const qrDynamicUrl = (bankInfo.bankName && bankInfo.accountNumber) 
    ? `https://img.vietqr.io/image/${bankInfo.bankName}-${bankInfo.accountNumber}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(customer?.fullName || customer?.phone || 'Thanh toan')} goi ${encodeURIComponent(pkg.name)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Thanh toán đơn hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Chọn phương thức thanh toán</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                        selectedMethod === method.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedMethod === method.id ? 'bg-indigo-600' : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          selectedMethod === method.id ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{method.name}</p>
                        <p className="text-sm text-slate-500">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMethod === 'qr-code' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quét mã QR để thanh toán</h3>
                <div className="flex flex-col items-center">
                  {loadingPaymentInfo ? (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  ) : qrDynamicUrl ? (
                    <img
                      src={qrDynamicUrl}
                      alt="QR thanh toán"
                      className="w-64 h-64 object-contain rounded-xl mb-4 shadow-sm"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-center p-4">
                      <p className="text-slate-500 text-sm">Cơ sở này chưa cấu hình mã QR thanh toán.</p>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 text-center">
                    Mở ứng dụng ngân hàng và quét mã QR để thanh toán nhanh
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'bank-transfer' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin chuyển khoản</h3>
                {loadingPaymentInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                      <div>
                        <p className="text-sm text-slate-600">Ngân hàng:</p>
                        <p className="font-bold text-slate-900">{bankInfo.bankName || 'Đang cập nhật'}{bankInfo.branch ? ` - ${bankInfo.branch}` : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Số tài khoản:</p>
                        <p className="font-bold text-slate-900 text-lg">{bankInfo.accountNumber || 'Đang cập nhật'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Chủ tài khoản:</p>
                        <p className="font-bold text-slate-900">{bankInfo.accountName || 'Đang cập nhật'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Nội dung chuyển khoản:</p>
                        <p className="font-bold text-slate-900">{customer?.fullName || customer?.phone || 'Hội viên'} - {pkg.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg">
                      ⚠️ Vui lòng chuyển khoản đúng nội dung để chúng tôi xử lý đơn hàng nhanh chóng
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin đơn hàng</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Gói tập</p>
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Thời hạn</p>
                  <p className="font-medium text-slate-900">{durationMonths} tháng</p>
                </div>
                {registration && (
                  <div>
                    <p className="text-sm text-slate-500">Mã đăng ký</p>
                    <p className="font-medium text-slate-900 text-xs">{registration.id}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Giá gói:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-slate-900">Tổng cộng:</span>
                <span className="text-3xl font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
              </div>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                sx={{
                  height: 56,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' }
                }}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => navigate('/dashboard/my-packages')}
                sx={{ mt: 1, textTransform: 'none', color: '#94a3b8' }}
              >
                Thanh toán sau
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}