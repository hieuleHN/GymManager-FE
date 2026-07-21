import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '@mui/material';
import { Check, ArrowRight, Clock, Shield, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';
import { FloatingContact } from '../components/FloatingContact';

interface PackageDetailData {
  _id: string;
  name: string;
  unitPrice: number;
  features: string[];
  durations: { months: number; discount: number }[];
  description?: string;
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
  contractA?: string;
  contractB?: string;
  contractTerms?: string;
  disciplineId?: { _id: string; name: string };
  locationId?: { _id: string; title: string };
  is_active: boolean;
}

export function PackageDetail() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState<PackageDetailData | null>(null);
  const [relatedPackages, setRelatedPackages] = useState<PackageDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<{ months: number; discount: number } | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (!packageId) return;

    fetch(`${getApiUrl()}/api/packages/${packageId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setPkg(data);
          if (data.durations && data.durations.length > 0) {
            setSelectedDuration(data.durations[0]);
          }
        }
      })
      .catch(() => {});
  }, [packageId]);

  useEffect(() => {
    if (!packageId) return;
    fetch(`${getApiUrl()}/api/packages/${packageId}/related?limit=4`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRelatedPackages(data);
      })
      .catch(() => {});
  }, [packageId]);

  useEffect(() => {
    if (user && !user.isStaff) {
      fetch(`${getApiUrl()}/api/customers/my-info`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setCustomer(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatPrice = (price: number) => {
    if (!price) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleRegister = (pkgId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/packages/${pkgId}/checkout`);
  };

  if (loading || !pkg) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Đang tải...</p>
      </div>
    );
  }

  const unitPrice = pkg.unitPrice || 0;
  const months = selectedDuration?.months || 1;
  const discount = selectedDuration?.discount || 0;
  const totalPrice = unitPrice * months * (1 - discount / 100);

  return (
    <div className="min-h-screen bg-white">
      <FloatingContact phoneNumber="1900 9999" />

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-indigo-600">Trang chủ</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/packages" className="hover:text-indigo-600">Gói tập</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{pkg.name}</span>
          </div>
        </div>
      </div>

      {/* Package Hero */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Package Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {pkg.disciplineId && (
                <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full mb-4">
                  {pkg.disciplineId.name}
                </span>
              )}
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">{pkg.name}</h1>
              {pkg.description && (
                <p className="text-lg text-slate-600 mb-6">{pkg.description}</p>
              )}

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold text-indigo-600">{formatPrice(unitPrice)}</span>
                <span className="text-xl text-slate-400">/ tháng</span>
              </div>

              {/* Duration Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Chọn thời hạn đăng ký</h3>
                {(pkg.durations || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {pkg.durations.map((d, idx) => {
                      const isSelected = selectedDuration?.months === d.months;
                      const price = unitPrice * d.months * (1 - (d.discount || 0) / 100);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDuration(d)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="font-bold text-slate-900 mb-1">{d.months} tháng</div>
                          <div className="text-lg font-bold text-indigo-600">{formatPrice(price)}</div>
                          <div className="text-xs text-slate-500">
                            {formatPrice(unitPrice * d.months)}
                            {d.discount > 0 && (
                              <span className="text-green-600 ml-1 font-semibold">-{d.discount}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Chưa có thông tin thời hạn</p>
                )}
              </div>

              {/* PT Sessions Info */}
              {(pkg.ptSessionsPerMonth > 0 || pkg.isFullMonth) && (
                <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-700 uppercase mb-2">Huấn luyện viên</h3>
                  <p className="text-indigo-900 font-medium">
                    {pkg.isFullMonth
                      ? 'Không giới hạn buổi tập với HLV'
                      : `${pkg.ptSessionsPerMonth} buổi tập với HLV / tháng`
                    }
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Khi đăng ký gói, số buổi sẽ được chia đều theo các tháng
                  </p>
                </div>
              )}

              {/* Features */}
                <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Quyền lợi bao gồm</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(pkg.features || []).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Right: Summary Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:sticky lg:top-24"
            >
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                <h2 className="text-2xl font-bold mb-6">Tóm tắt đăng ký</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Gói tập</span>
                    <span className="font-semibold">{pkg.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Đơn giá</span>
                    <span className="font-semibold">{formatPrice(unitPrice)}/tháng</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Thời hạn</span>
                    <span className="font-semibold">{months} tháng</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Giảm giá</span>
                      <span className="font-semibold">-{discount}%</span>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-lg">Tổng tiền</span>
                    <span className="text-4xl font-extrabold text-indigo-400">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleRegister(pkg._id)}
                  sx={{
                    height: 56,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    mb: 2
                  }}
                  endIcon={<ArrowRight />}
                >
                  Đăng ký ngay
                </Button>

                <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Bảo mật</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Hỗ trợ 24/7</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Thanh toán linh hoạt</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contract Preview */}
      {(pkg.contractA || pkg.contractB || pkg.contractTerms) && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Chính sách & Điều khoản dịch vụ</h2>
              <p className="text-slate-500">Xem trước các điều khoản trước khi đăng ký</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pkg.contractA && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3">Điều khoản bên A</h3>
                  <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{pkg.contractA}</p>
                </div>
              )}
              {pkg.contractB && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3">Điều khoản bên B</h3>
                  <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{pkg.contractB}</p>
                </div>
              )}
              {pkg.contractTerms && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3">Cam kết chung</h3>
                  <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{pkg.contractTerms}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Other Packages Section */}
      {relatedPackages.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Các gói tập khác</h2>
              <p className="text-slate-500">Khám phá thêm các gói tập phù hợp với nhu cầu của bạn</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPackages.map((rp, index) => {
                const rpUnitPrice = rp.unitPrice || 0;
                const rpMonths = (rp.durations && rp.durations[0]?.months) || 1;
                const rpDiscount = (rp.durations && rp.durations[0]?.discount) || 0;
                const rpTotal = rpUnitPrice * rpMonths * (1 - rpDiscount / 100);

                return (
                  <motion.div
                    key={rp._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative p-6 rounded-2xl flex flex-col bg-slate-900 text-white shadow-lg"
                  >
                    {rp.disciplineId && (
                      <span className="text-xs font-semibold text-indigo-400 mb-2">{rp.disciplineId.name}</span>
                    )}
                    <h3 className="text-xl font-bold mb-2">{rp.name}</h3>
                    <div className="mb-4">
                      <span className="text-2xl font-extrabold">{formatPrice(rpUnitPrice)}</span>
                      <span className="text-sm text-slate-300 ml-1">/ tháng</span>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {(rp.features || []).slice(0, 3).map((f: string) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleRegister(rp._id)}
                      sx={{
                        height: 44,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }
                      }}
                    >
                      Đăng ký ngay
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng bắt đầu hành trình?</h2>
          <p className="text-indigo-100 mb-8 text-lg">Tham gia ZENFITNESS ngay hôm nay để nhận ưu đãi đặc biệt</p>
          <div className="flex justify-center gap-4">
            <Button
              variant="contained"
              size="large"
              onClick={() => handleRegister(pkg._id)}
              sx={{
                bgcolor: 'white',
                color: '#4f46e5',
                px: 6,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
              endIcon={<ArrowRight />}
            >
              Đăng ký {pkg.name}
            </Button>
            <Link to="/packages">
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 6,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }
                }}
              >
                Xem tất cả gói tập
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
