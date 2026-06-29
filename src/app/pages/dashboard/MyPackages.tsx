
import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Calendar, MapPin, Check, AlertTriangle, ArrowRight, Clock, Bell } from 'lucide-react';
import { Button } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';


interface Registration {
  _id: string;
  package_id: {
    _id: string;
    name: string;
    unitPrice: number;
    features: string[];
  };
  locationId: {
    _id: string;
    title: string;
    name?: string;
  };
  duration_months: number;
  total_price: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;

  payment_expires_at: string;
  contract_pdf: string;

  payment_method: string;

  signature: string;
  createdAt: string;
}

export function MyPackages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [fetching, setFetching] = useState<boolean>(true);
  const [otherPackages, setOtherPackages] = useState<any[]>([]);

  const [renewModalOpen, setRenewModalOpen] = useState<boolean>(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [selectedPkgEndDate, setSelectedPkgEndDate] = useState<string>("");
  const [renewMonths, setRenewMonths] = useState<number>(1);

  const registrationSuccess = location.state?.registrationSuccess;
  const successMessage = location.state?.message;
  const [approvedRegId, setApprovedRegId] = useState<string | null>(null);

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(
        () => window.history.replaceState({}, document.title),
        5000,
      );
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  useEffect(() => {
    if (!user || user.isStaff) {
      setFetching(false);
      return;
    }

    const loadData = async () => {
      try {
        const [infoRes, regRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/customers/my-info`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${getApiUrl()}/api/user-packages/my`, {
            headers: getAuthHeaders(),
          }),
        ]);

        const infoData = await infoRes.json();
        const regData = await regRes.json();

        if (infoData && !infoData.error) setCustomer(infoData);
        if (Array.isArray(regData)) setRegistrations(regData);

        if (infoData?.locationId) {
          const locId =
            typeof infoData.locationId === "object"
              ? infoData.locationId._id
              : infoData.locationId;
          const pkgRes = await fetch(
            `${getApiUrl()}/api/packages?page=1&limit=50&locationId=${locId}`,
          );
          const pkgData = await pkgRes.json();
          if (pkgData?.data)
            setOtherPackages(pkgData.data.filter((p: any) => p.is_active));
        }
      } catch {}
      setFetching(false);
    };
    loadData();
  }, [user]);


  const reloadRef = useRef<() => void>(() => {});
  reloadRef.current = async () => {
    try {
      const [infoRes, regRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/customers/my-info`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/user-packages/my`, { headers: getAuthHeaders() })
      ]);
      const infoData = await infoRes.json();
      const regData = await regRes.json();
      if (infoData && !infoData.error) setCustomer(infoData);
      if (Array.isArray(regData)) setRegistrations(regData);
    } catch {}
  };

  // Polling: phát hiện khi admin duyệt đơn
  useEffect(() => {
    const storedRegId = sessionStorage.getItem('pending_registration_id');
    if (!storedRegId) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/user-packages/${storedRegId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data && data.status === 'đang hoạt động') {
          setApprovedRegId(storedRegId);
          sessionStorage.removeItem('pending_registration_id');
          clearInterval(poll);
          reloadRef.current();
        }
      } catch {}
    }, 5000);

    return () => clearInterval(poll);
  }, []);

  // Lưu registration ID để polling
  useEffect(() => {
    const pending = registrations.find(r => r.status === 'chờ xác nhận' && r.payment_status === 'paid');
    if (pending) {
      sessionStorage.setItem('pending_registration_id', pending._id);
    }
  }, [registrations]);

  const formatPrice = (price: number) => {
    if (!price) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';

  const formatPrice = (price: number) =>
    price ? price.toLocaleString("vi-VN") + "đ" : "0đ";
  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "";
  const daysRemaining = (endDate: string) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  };

  const handleOpenRenewModal = (reg: Registration) => {
    setSelectedPkg(reg.package_id);
    setSelectedPkgEndDate(reg.end_date);
    setRenewMonths(1);
    setRenewModalOpen(true);
  };

  const handleExecuteRenew = async () => {
    if (!selectedPkg) return;
    const computedPrice = renewMonths * (selectedPkg.unitPrice || 0);

    try {
      const response = await fetch(
        `${getApiUrl()}/api/user-packages/renew-upgrade`,
        {
          method: "POST",
          headers: getAuthHeaders() as any,
          body: JSON.stringify({
            action_type: "renew",
            package_id: selectedPkg._id,
            locationId: customer?.locationId?._id || customer?.locationId,
            duration_months: renewMonths,
            total_price: computedPrice,
            current_end_date: selectedPkgEndDate,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      navigate("/payment", {
        state: {
          package: selectedPkg,
          registration: { id: data.registration._id },
          customer: customer,
          durationMonths: renewMonths,
          totalPrice: computedPrice,
        },
      });
    } catch (err: any) {
      alert("Hệ thống cảnh báo lỗi: " + err.message);
    }
  };

  if (fetching)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">
          Đang tải...
        </div>
      </DashboardLayout>
    );

  if (customer && customer.status !== "approved") {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Chưa được xác nhận
            </h2>
            <p className="text-amber-700 mb-6">
              Bạn cần hoàn thiện thông tin cá nhân và được nhân viên xác nhận
              trước khi đăng ký gói tập.
            </p>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard/settings")}
              sx={{
                bgcolor: "#d97706",
                "&:hover": { bgcolor: "#b45309" },
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Đi đến cài đặt <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  const activeRegistrations = registrations.filter(r =>
    r.status === 'đang hoạt động' || r.status === 'còn 10 ngày'
  );
  const paidPendingRegistrations = registrations.filter(r =>
    r.status === 'chờ xác nhận' && r.payment_status === 'paid'
  );
  const pendingRegistrations = registrations.filter(r =>
    r.status === 'chờ xác nhận' && r.payment_status !== 'paid'
  );

  const groupedRegistrationsMap = new Map<string, Registration>();
  const groups: Record<string, Registration[]> = {};

  // 1. Phân nhóm các hóa đơn theo cùng một gói tập
  activeRegistrations.forEach((reg) => {
    const pkgId = reg.package_id?._id;
    if (!pkgId) return;
    if (!groups[pkgId]) groups[pkgId] = [];
    groups[pkgId].push(reg);
  });

  // 2. Xử lý logic hiển thị cho từng nhóm
  Object.keys(groups).forEach((pkgId) => {
    const group = groups[pkgId];
    // Lấy thẻ đầu tiên làm gốc
    const displayReg = { ...group[0] };

    // Nếu trong nhóm có hóa đơn đang "chờ thanh toán" -> Bật cảnh báo vàng
    const hasPending = group.some((r) => r.payment_status === "chờ thanh toán");
    displayReg.payment_status = hasPending ? "chờ thanh toán" : "đã thanh toán";

    // CHỐT NGÀY: Chỉ tính ngày kết thúc dựa trên những hóa đơn ĐÃ THANH TOÁN
    const paidRegs = group.filter((r) => r.payment_status !== "chờ thanh toán");
    if (paidRegs.length > 0) {
      const maxPaidReg = paidRegs.reduce((prev, current) => {
        return new Date(prev.end_date) > new Date(current.end_date)
          ? prev
          : current;
      });
      displayReg.end_date = maxPaidReg.end_date;
      displayReg.status = maxPaidReg.status;
    }

    groupedRegistrationsMap.set(pkgId, displayReg);
  });

  const displayRegistrations = Array.from(groupedRegistrationsMap.values());


  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {approvedRegId && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-pulse">
            <Bell className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-green-900 mb-1">Gói tập đã được kích hoạt!</h2>
            <p className="text-green-700">Quản lý đã xác nhận gói tập của bạn. Bạn có thể bắt đầu tập luyện ngay hôm nay!</p>
          </div>
        )}

        {registrationSuccess && !approvedRegId && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-green-900 mb-1">
              {successMessage || "Đăng ký thành công!"}
            </h2>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gói tập của tôi
          </h1>
          <p className="text-slate-600">Quản lý các gói tập đang sử dụng</p>
        </div>

        {displayRegistrations.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg mb-4">
              Bạn chưa đăng ký gói tập nào.
            </p>
            <Button
              variant="contained"
              onClick={() => navigate("/packages")}
              sx={{
                bgcolor: "#4f46e5",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Đăng ký ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayRegistrations.map((reg) => (
              <div
                key={reg._id}
                className="bg-white rounded-2xl shadow-sm border-l-4 border-indigo-600 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${reg.status === "còn 10 ngày" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                      >
                        {reg.status}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {reg.package_id?.name || "Đã xóa"}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {reg.payment_status === "chờ thanh toán" && (
                      <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700">
                          Đang có yêu cầu Gia hạn chờ duyệt
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 font-medium">
                        Hạn sử dụng: đến {formatDate(reg.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {reg.locationId?.title ||
                          reg.locationId?.name ||
                          customer?.locationId?.title ||
                          customer?.locationId?.name ||
                          "Đang cập nhật"}
                      </span>
                    </div>

                    {reg.end_date && (
                      <div className="px-3 py-2 rounded-lg bg-indigo-50 inline-block border border-indigo-100">
                        <p className="text-sm text-indigo-700">
                          Còn lại{" "}
                          <span className="font-bold text-indigo-900">
                            {daysRemaining(reg.end_date)} ngày
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {reg.payment_status === 'pending' && reg.payment_expires_at && new Date(reg.payment_expires_at) > new Date() ? (
                      <Button fullWidth variant="contained" size="small"
                        onClick={() => navigate('/payment', { state: { package: reg.package_id, registration: reg, customer, durationMonths: reg.duration_months, totalPrice: reg.total_price } })}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
                        Thanh toán ngay
                      </Button>
                    ) : reg.contract_pdf && reg.payment_status === 'paid' ? (
                      <>
                        {reg.status === 'chờ xác nhận' && (
                          <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-1">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>Đang chờ quản lý xác nhận</span>
                          </div>
                        )}
                        <a href={`${getApiUrl()}/api/user-packages/${reg._id}/contract-pdf?token=${encodeURIComponent(JSON.parse(localStorage.getItem('auth_user') || '{}').token || '')}`} target="_blank" rel="noopener noreferrer" className="block col-span-2">
                          <Button fullWidth variant="outlined" size="small"
                            sx={{ textTransform: 'none', borderRadius: 2, color: '#4f46e5', borderColor: '#4f46e5' }}>
                            Xem hợp đồng (PDF)
                          </Button>
                        </a>
                      </>
                    ) : null}
                    <Link to="/packages">
                      <Button fullWidth variant="outlined" size="small"
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Đăng ký thêm
                      </Button>
                    </Link>
                    <Button fullWidth variant="contained" size="small"
                      onClick={() => navigate(`/packages/${reg.package_id?._id}`)}
                      sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                      Gia hạn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {paidPendingRegistrations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Đã thanh toán - chờ xác nhận</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paidPendingRegistrations.map((reg) => (
                <div key={reg._id} className="bg-white rounded-2xl shadow-sm border-l-4 border-amber-400 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-2">
                          <Clock className="w-3 h-3" />
                          Đã thanh toán - chờ duyệt
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900">{reg.package_id?.name || 'Đã xóa'}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Giá trị</p>
                        <p className="text-xl font-bold text-indigo-600">{formatPrice(reg.total_price)}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          {formatDate(reg.start_date)} - {formatDate(reg.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{reg.locationId?.title || 'Đang cập nhật'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {reg.contract_pdf && (
                        <a href={`${getApiUrl()}/api/user-packages/${reg._id}/contract-pdf?token=${encodeURIComponent(JSON.parse(localStorage.getItem('auth_user') || '{}').token || '')}`} target="_blank" rel="noopener noreferrer" className="block col-span-2">
                          <Button fullWidth variant="outlined" size="small"
                            sx={{ textTransform: 'none', borderRadius: 2, color: '#4f46e5', borderColor: '#4f46e5' }}>
                            Xem hợp đồng (PDF)
                          </Button>
                        </a>
                      )}
                      <Link to="/packages">
                        <Button fullWidth variant="outlined" size="small"
                          sx={{ textTransform: 'none', borderRadius: 2 }}>
                          Đăng ký thêm
                        </Button>
                      </Link>
                      <Button fullWidth variant="contained" size="small"
                        onClick={() => navigate(`/packages/${reg.package_id?._id}`)}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
                        Gia hạn
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRegistrations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Đăng ký chờ thanh toán</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingRegistrations.map((reg) => (
                <div key={reg._id} className="bg-white rounded-2xl shadow-sm border-l-4 border-amber-400 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 mb-2">
                          {reg.status}
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900">{reg.package_id?.name || 'Đã xóa'}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Giá trị</p>
                        <p className="text-xl font-bold text-indigo-600">{formatPrice(reg.total_price)}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          {formatDate(reg.start_date)} - {formatDate(reg.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{reg.locationId?.title || 'Đang cập nhật'}</span>
                      </div>
                      {reg.payment_expires_at && (
                        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-sm text-amber-800">
                            Hạn thanh toán: {formatDate(reg.payment_expires_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {reg.payment_status === 'pending' && (
                        <Button fullWidth variant="contained" size="small"
                          onClick={() => navigate('/payment', {
                            state: {
                              package: reg.package_id,
                              registration: reg,
                              customer,
                              durationMonths: reg.duration_months,
                              totalPrice: reg.total_price
                            }
                          })}
                          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
                          Thanh toán ngay
                        </Button>
                      )}
                      <Button fullWidth variant="outlined" size="small"
                        onClick={() => navigate('/packages')}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherPackages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Các gói tập khác
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherPackages.map((pkg) => {
                const alreadyRegistered = registrations.some(
                  (r) =>
                    r.package_id?._id === pkg._id &&
                    (r.status === "đang hoạt động" ||
                      r.status === "còn 10 ngày"),
                );
                return (
                  <div
                    key={pkg._id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                  >
                    <div className="mb-4">
                      {pkg.disciplineId && (
                        <p className="text-sm text-indigo-600 font-semibold mb-1">
                          {pkg.disciplineId.name}
                        </p>
                      )}
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPrice(pkg.unitPrice)}
                        <span className="text-sm text-slate-500 font-normal">
                          /tháng
                        </span>
                      </p>
                    </div>
                    {alreadyRegistered ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Đã đăng ký
                      </Button>
                    ) : (
                      <Link to={`/packages/${pkg._id}`}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            bgcolor: "#4f46e5",
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          Đăng ký ngay
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {renewModalOpen && selectedPkg && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">
                  Gia hạn gói tập
                </h3>
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6">
                <p className="mb-4 text-slate-600">
                  Đối tượng xử lý:{" "}
                  <strong className="text-slate-900">{selectedPkg.name}</strong>
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 3, 6].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenewMonths(m)}
                      className={`py-2 rounded-xl border-2 font-semibold transition-all ${renewMonths === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"}`}
                    >
                      {m} Tháng
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center font-bold text-lg bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span>Thành tiền:</span>
                  <span className="text-indigo-600">
                    {formatPrice(selectedPkg.unitPrice * renewMonths)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t flex gap-3">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setRenewModalOpen(false)}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Hủy
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleExecuteRenew}
                  sx={{
                    bgcolor: "#4f46e5",
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  Tới trang thanh toán
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
