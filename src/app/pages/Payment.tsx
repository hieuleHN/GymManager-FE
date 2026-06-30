
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Button } from '@mui/material';
import { CreditCard, Building2, Smartphone, Check, Loader2, ExternalLink, QrCode } from 'lucide-react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';



const paymentMethods = [
  {
    id: "vnpay",
    name: "VNPay",
    icon: Smartphone,
    description: "Thanh toán qua VNPay (ATM/Internet Banking)",

  },
  {
    id: "momo",
    name: "MoMo",
    icon: Smartphone,
    description: "Thanh toán qua ví điện tử MoMo",
  },
  {
    id: "bank-card",
    name: "Thẻ ngân hàng",
    icon: CreditCard,
    description: "Thanh toán bằng thẻ ATM/Visa/Mastercard",

  },
  {
    id: "bank-transfer",
    name: "Chuyển khoản",
    icon: Building2,
    description: "Chuyển khoản qua số tài khoản ngân hàng",
  },

  {
    id: "qr-code",
    name: "Quét mã VietQR",
    icon: QrCode,
    description: "Quét mã VietQR thủ công",
  },
];

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('');

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
  });
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(true);

  const [vnpayData, setVnpayData] = useState<{ paymentUrl: string; amount: number; txnRef: string } | null>(null);

  const paymentData = location.state;

  const isBookingPayment = paymentData?.type === 'trainer_booking';

  if (!paymentData || !paymentData.package) {
    return <Navigate to={isBookingPayment ? '/dashboard/trainers' : '/packages'} />;
  }

  const {
    package: pkg,
    registration,
    customer,
    durationMonths,
    totalPrice,
    booking,
    trainer
  } = paymentData;

  // Lấy ID đăng ký an toàn (hỗ trợ cả id và _id)
  const regId = registration?.id || registration?._id;
  const bookingId = booking?._id || booking?.id;

  useEffect(() => {
    const locationId =
      booking?.locationId?._id || booking?.locationId ||
      registration?.locationId ||
      pkg?.locationId?._id ||
      pkg?.locationId ||
      customer?.locationId?._id ||
      customer?.locationId ||
      trainer?.locationId?._id ||
      trainer?.locationId;

    if (!locationId) {
      setLoadingPaymentInfo(false);
      return;
    }

    fetch(`${getApiUrl()}/api/locations/${locationId}`, {
      headers: getAuthHeaders() as any,
    })
      .then((res) => res.json())
      .then((data) => {
        setBankInfo({
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountName: data.accountName || "",
          branch: data.branch || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPaymentInfo(false));
  }, [customer, registration, pkg, booking, trainer]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setProcessing(true);

    try {
      if (isBookingPayment) {
        if (!bookingId) {
          alert('DEBUG: bookingId is falsy! booking=', booking?._id, booking?.id);
          throw new Error('Không tìm thấy thông tin đặt lịch!');
        }
        if (selectedMethod === "vnpay") {
          alert('DEBUG: Entering VNPAY branch for booking, bookingId=' + bookingId);
          const res = await fetch(
            `${getApiUrl()}/api/bookings/${bookingId}/vnpay-url`,
            { headers: getAuthHeaders() as any },
          );
          if (!res.ok) {
            let errMsg = "Lỗi kết nối VNPAY";
            try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = `HTTP ${res.status}`; }
            alert('DEBUG: VNPAY fetch failed: ' + errMsg);
            throw new Error(errMsg);
          }
          const data = await res.json();
          alert('DEBUG: VNPAY URL received: ' + (data.paymentUrl || 'UNDEFINED!'));
          if (!data.paymentUrl) {
            alert('DEBUG: paymentUrl is undefined/empty!');
            throw new Error('Không nhận được URL thanh toán VNPAY');
          }
          window.location.href = data.paymentUrl;
        } else {
          alert('DEBUG: selectedMethod is NOT vnpay, it is: "' + selectedMethod + '"');
          const res = await fetch(`${getApiUrl()}/api/bookings/${bookingId}/payment`, {
            method: 'PUT',
            headers: getAuthHeaders() as any,
            body: JSON.stringify({ paymentMethod: selectedMethod })
          });
          if (!res.ok) {
            let errMsg = 'Cập nhật thất bại';
            try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = `HTTP ${res.status}`; }
            throw new Error(errMsg);
          }
          setPaymentSuccess(true);
        }
      } else {
        if (!regId) {
          alert('Không tìm thấy thông tin đăng ký!');
          return;
        }
        if (selectedMethod === "vnpay") {
          const res = await fetch(
            `${getApiUrl()}/api/user-packages/${regId}/vnpay-url`,
            { headers: getAuthHeaders() as any },
          );
          if (!res.ok) {
            let errMsg = "Lỗi kết nối VNPAY";
            try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = `HTTP ${res.status}`; }
            throw new Error(errMsg);
          }
          const data = await res.json();
          await fetch(
            `${getApiUrl()}/api/user-packages/${regId}/payment-method`,
            {
              method: "PATCH",
              headers: getAuthHeaders() as any,
              body: JSON.stringify({ payment_method: "vnpay" }),
            },
          );
          window.location.href = data.paymentUrl;
        } else {
          const res = await fetch(
            `${getApiUrl()}/api/user-packages/${regId}/payment-method`,
            {
              method: "PATCH",
              headers: getAuthHeaders() as any,
              body: JSON.stringify({ payment_method: selectedMethod }),
            },
          );
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Cập nhật thất bại");
          }
          setPaymentSuccess(true);
        }
      }
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  const pdfToken = encodeURIComponent(JSON.parse(localStorage.getItem('auth_user') || '{}').token || '');
  const pdfUrl = `${getApiUrl()}/api/user-packages/${regId}/contract-pdf?token=${pdfToken}`;

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
          {registration?.contract_pdf && (
            <div className="space-y-3 mb-6">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  sx={{
                    height: 48,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#4f46e5',
                    borderColor: '#4f46e5'
                  }}
                >
                  Xem hợp đồng (PDF)
                </Button>
              </a>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Hợp đồng đang chờ xử lý</p>
                <p>Hợp đồng của bạn đã được ghi nhận. Vui lòng chờ quản lý xác nhận để kích hoạt gói tập.</p>
              </div>
            </div>
          )}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate(isBookingPayment ? "/dashboard/schedule" : "/dashboard/my-packages")}
            sx={{
              height: 56,
              borderRadius: 3,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 700,
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" },
            }}
          >
            {isBookingPayment ? 'Về lịch tập' : 'Về gói tập của tôi'}
          </Button>
        </div>
      </div>
    );
  }

  if (vnpayData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Chuyển đến cổng thanh toán VNPay</h2>
          <p className="text-slate-500 mb-6">Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Số tiền:</span>
              <span className="font-bold text-xl text-indigo-600">{formatPrice(vnpayData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Mã giao dịch:</span>
              <span className="font-mono text-sm text-slate-900">{vnpayData.txnRef}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setVnpayData(null)}
              sx={{
                height: 56,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Quay lại
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => window.location.href = vnpayData.paymentUrl}
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
              Đến VNPay <ExternalLink className="ml-2 w-5 h-5" />
            </Button>
          </div>
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Thanh toán đơn hàng
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Chọn phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                        selectedMethod === method.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          selectedMethod === method.id
                            ? "bg-indigo-600"
                            : "bg-slate-100"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            selectedMethod === method.id
                              ? "text-white"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {method.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {method.description}
                        </p>
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

            {selectedMethod === "vnpay" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Thanh toán qua VNPay
                </h3>
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                    <Smartphone className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Nhấn nút <strong>"Thanh toán VNPay"</strong> ở cột bên phải để được chuyển đến cổng thanh toán của VNPay.
                    <br />
                    Hỗ trợ: Internet Banking, ATM, Visa/Mastercard.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === "qr-code" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Quét mã VietQR để thanh toán
                </h3>
                <div className="flex flex-col items-center">
                  {loadingPaymentInfo ? (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  ) : qrDynamicUrl ? (
                    <>
                      <img
                        src={qrDynamicUrl}
                        alt="QR thanh toán"
                        className="w-64 h-64 object-contain rounded-xl mb-4 shadow-sm"
                      />
                      <div className="w-full space-y-3 bg-slate-50 p-4 rounded-xl">
                        <div>
                          <p className="text-sm text-slate-600">Ngân hàng:</p>
                          <p className="font-bold text-slate-900">
                            {bankInfo.bankName || "Đang cập nhật"}
                            {bankInfo.branch ? ` - ${bankInfo.branch}` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Số tài khoản:</p>
                          <p className="font-bold text-slate-900 text-lg">
                            {bankInfo.accountNumber || "Đang cập nhật"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Chủ tài khoản:</p>
                          <p className="font-bold text-slate-900">
                            {bankInfo.accountName || "Đang cập nhật"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Số tiền:</p>
                          <p className="font-bold text-indigo-600 text-lg">{formatPrice(totalPrice)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Nội dung chuyển khoản:</p>
                          <p className="font-bold text-slate-900">
                            {customer?.fullName || customer?.phone || "Hội viên"} - {pkg.name}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-center p-4">
                      <p className="text-slate-500 text-sm">
                        Cơ sở này chưa cấu hình mã QR thanh toán.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 text-center mt-4">
                    Mở ứng dụng ngân hàng và quét mã QR để thanh toán nhanh
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'bank-transfer' && (

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Thông tin chuyển khoản
                </h3>
                {loadingPaymentInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                      <div>
                        <p className="text-sm text-slate-600">Ngân hàng:</p>
                        <p className="font-bold text-slate-900">
                          {bankInfo.bankName || "Đang cập nhật"}
                          {bankInfo.branch ? ` - ${bankInfo.branch}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Số tài khoản:</p>
                        <p className="font-bold text-slate-900 text-lg">
                          {bankInfo.accountNumber || "Đang cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Chủ tài khoản:</p>
                        <p className="font-bold text-slate-900">
                          {bankInfo.accountName || "Đang cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Nội dung chuyển khoản:
                        </p>
                        <p className="font-bold text-slate-900">
                          {customer?.fullName || customer?.phone || "Hội viên"}{" "}
                          - {pkg.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg">
                      ⚠️ Vui lòng chuyển khoản đúng nội dung để chúng tôi xử lý
                      đơn hàng nhanh chóng
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Thông tin đơn hàng
              </h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                {isBookingPayment ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Dịch vụ</p>
                      <p className="font-bold text-slate-900">{pkg.name}</p>
                    </div>
                    {trainer && (
                      <div>
                        <p className="text-sm text-slate-500">HLV</p>
                        <p className="font-bold text-slate-900">{trainer.fullName}</p>
                      </div>
                    )}
                    {booking && (
                      <div>
                        <p className="text-sm text-slate-500">Mã đặt lịch</p>
                        <p className="font-medium text-slate-900 text-xs">{booking._id}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Gói tập</p>
                      <p className="font-bold text-slate-900">{pkg.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Thời hạn</p>
                      <p className="font-medium text-slate-900">
                        {durationMonths} tháng
                      </p>
                    </div>
                    {regId && (
                      <div>
                        <p className="text-sm text-slate-500">Mã đăng ký</p>
                        <p className="font-medium text-slate-900 text-xs">{registration._id}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Giá gói:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-slate-900">
                  Tổng cộng:
                </span>
                <span className="text-3xl font-bold text-indigo-600">
                  {formatPrice(totalPrice)}
                </span>
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
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 700,
                  bgcolor: "#4f46e5",
                  "&:hover": { bgcolor: "#4338ca" },
                }}
              >
                {processing
                  ? "Đang xử lý..."
                  : selectedMethod === "vnpay"
                    ? "Thanh toán VNPay"
                    : "Xác nhận thanh toán"}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => navigate("/dashboard/my-packages")}
                sx={{ mt: 1, textTransform: "none", color: "#94a3b8" }}
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
