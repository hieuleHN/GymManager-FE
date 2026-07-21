import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';

interface Discipline {
  _id: string;
  name: string;
}

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  features: string[];
  durations: { months: number; discount: number }[];
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
  contractA?: string;
  contractB?: string;
  contractTerms?: string;
  disciplineId?: { _id: string; name: string };
  locationId?: { _id: string; title: string };
  is_active: boolean;
}

export function PackageCheckout() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<{ months: number; discount: number } | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [openDiscipline, setOpenDiscipline] = useState(false);
  const [openPackage, setOpenPackage] = useState(false);
  const discRef = useRef<HTMLDivElement>(null);
  const pkgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetch(`${getApiUrl()}/api/customers/my-info`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCustomer(data);
      })
      .catch(() => {});
  }, [user, navigate]);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/disciplines?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) setDisciplines(data.data);
        else if (Array.isArray(data)) setDisciplines(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/packages?page=1&limit=50`)
      .then(async res => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        const list = json?.data || (Array.isArray(json) ? json : []);
        setPackages(list.filter((p: PackageItem) => p.is_active));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!packageId || packages.length === 0) return;
    const found = packages.find(p => p._id === packageId);
    if (found) {
      setSelectedPkg(found);
      setSelectedDiscipline(found.disciplineId?._id || '');
      if (found.durations?.length > 0) setSelectedDuration(found.durations[0]);
    }
  }, [packageId, packages]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (discRef.current && !discRef.current.contains(e.target as Node)) setOpenDiscipline(false);
      if (pkgRef.current && !pkgRef.current.contains(e.target as Node)) setOpenPackage(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

  const uniqueDisciplines = disciplines.filter(d =>
    packages.some(p => p.disciplineId?._id === d._id)
  );

  const filteredPackages = !selectedDiscipline
    ? []
    : packages.filter(p => p.disciplineId?._id === selectedDiscipline);

  // Auto-select first package + first duration when discipline changes
  useEffect(() => {
    if (!selectedPkg || selectedPkg.disciplineId?._id !== selectedDiscipline) {
      if (filteredPackages.length > 0) {
        setSelectedPkg(filteredPackages[0]);

        if (filteredPackages[0].durations?.length > 0) {
          setSelectedDuration(filteredPackages[0].durations[0]);
        }

      }
    }
  }, [selectedDiscipline]);

  // Auto-select first duration when package changes
  useEffect(() => {
    if (selectedPkg?.durations?.length > 0) {
      const stillExists = selectedPkg.durations.some(
        d => d.months === selectedDuration?.months && d.discount === selectedDuration?.discount
      );
      if (!stillExists) {
        setSelectedDuration(selectedPkg.durations[0]);
      }
    } else if (selectedPkg) {
      setSelectedDuration({ months: 1, discount: 0 });
    }
  }, [selectedPkg]);

  const selectedDiscName = selectedDiscipline
    ? disciplines.find(d => d._id === selectedDiscipline)?.name || 'Đã chọn'
    : '';

  const unitPrice = selectedPkg?.unitPrice || 0;
  const months = selectedDuration?.months || 1;
  const discount = selectedDuration?.discount || 0;
  const totalPrice = unitPrice * months * (1 - discount / 100);

  const handleProceedToContract = () => {
    fetch(`${getApiUrl()}/api/customers/my-info`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data?.status === 'approved') {
          navigate(`/contract`, {

              state: {
                package: selectedPkg,
                customer,
                durationMonths: months,
                totalPrice,
                selectedDuration
              }

          });
        } else {
          navigate('/dashboard/settings');
        }
      })
      .catch(() => navigate('/auth'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Thông tin đăng ký</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* 1. Select Discipline - Dropdown bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Chọn bộ môn</h2>
              <div className="relative" ref={discRef}>
                <button
                  onClick={() => { setOpenDiscipline(!openDiscipline); setOpenPackage(false); }}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl flex items-center justify-between bg-white hover:border-indigo-400 transition-colors"
                >
                  <span className={selectedDiscipline ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    {selectedDiscipline ? selectedDiscName : 'Nhấp để chọn bộ môn...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openDiscipline ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openDiscipline && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                    >
                      {uniqueDisciplines.map(d => (
                        <button
                          key={d._id}
                          onClick={() => { setSelectedDiscipline(d._id); setOpenDiscipline(false); }}
                          className={`w-full p-3 text-left hover:bg-slate-50 transition-colors text-sm ${
                            selectedDiscipline === d._id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. Select Package - Dropdown bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Chọn gói tập</h2>
              <div className="relative" ref={pkgRef}>
                <button
                  onClick={() => { setOpenPackage(!openPackage); setOpenDiscipline(false); }}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl flex items-center justify-between bg-white hover:border-indigo-400 transition-colors"
                >
                  {selectedPkg ? (
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{selectedPkg.name}</span>
                      <span className="text-lg font-bold text-indigo-600">{formatPrice(unitPrice)}</span>
                      <span className="text-xs text-slate-400">/ tháng</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Nhấp để chọn gói tập...</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openPackage ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openPackage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                    >
                      {filteredPackages.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400 text-center">Vui lòng chọn bộ môn trước</p>
                      ) : (
                        filteredPackages.map(pkg => {
                          const isSelected = selectedPkg?._id === pkg._id;
                          return (
                            <button
                              key={pkg._id}
                              onClick={() => { setSelectedPkg(pkg); setOpenPackage(false); }}
                              className={`w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                                isSelected ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-slate-900">{pkg.name}</span>
                                <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                  {(pkg.features || []).slice(0, 3).map((f, i) => (
                                    <li key={i} className="flex items-center gap-1 text-xs text-slate-400">
                                      <Check className="w-3 h-3 text-green-500" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <div className="text-lg font-bold text-indigo-600">{formatPrice(pkg.unitPrice || 0)}</div>
                                <div className="text-xs text-slate-400">/ tháng</div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 3. Chọn thời gian tập */}
            {selectedPkg && selectedPkg.durations && selectedPkg.durations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">3. Chọn thời gian tập</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedPkg.durations.map((dur, idx) => {
                      const isSelected = selectedDuration === dur;
                      const price = unitPrice * dur.months * (1 - (dur.discount || 0) / 100);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDuration(dur)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="text-lg font-bold text-slate-900 mb-1">{dur.months} tháng</div>
                          <div className="text-lg font-extrabold text-indigo-600 mb-1 break-all">{formatPrice(price)}</div>
                          {dur.discount > 0 && (
                            <div className="text-xs font-semibold text-green-600">-{dur.discount}%</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>
              </motion.div>
            )}
          </div>

          {/* Right: 2 columns - Package Detail */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              {!selectedPkg ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Vui lòng chọn gói tập</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Chi tiết gói tập</h2>
                  <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                    {selectedPkg.disciplineId && (
                      <div>
                        <p className="text-sm text-slate-500">Bộ môn</p>
                        <p className="font-semibold text-slate-900">{selectedPkg.disciplineId.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Gói tập</p>
                      <p className="font-bold text-slate-900 text-lg">{selectedPkg.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Đơn giá</p>
                      <p className="font-semibold text-slate-900">{formatPrice(unitPrice)} / tháng</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Thời hạn</p>
                      <p className="font-semibold text-slate-900">{months} tháng</p>
                    </div>
                    {(selectedPkg.ptSessionsPerMonth > 0 || selectedPkg.isFullMonth) && (
                      <div>
                        <p className="text-sm text-slate-500">Tập với HLV</p>
                        <p className="font-semibold text-indigo-600">
                          {selectedPkg.isFullMonth
                            ? 'Không giới hạn'
                            : `${selectedPkg.ptSessionsPerMonth} buổi/tháng`
                          }
                          {!selectedPkg.isFullMonth && selectedPkg.ptSessionsPerMonth > 0 && (
                            <span className="text-xs text-slate-400 ml-1">
                              (Tổng: {selectedPkg.ptSessionsPerMonth * months} buổi)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {customer?.locationId && (
                      <div>
                        <p className="text-sm text-slate-500">Cơ sở</p>
                        <p className="font-medium text-slate-900">{customer.locationId?.title || 'Đang cập nhật'}</p>
                      </div>
                    )}
                  </div>
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Quyền lợi bao gồm</p>
                    <ul className="space-y-2">
                      {(selectedPkg.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Tổng tiền:</span>
                      <span className="text-3xl font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="text-right text-sm text-green-600 mt-1">
                        Đã giảm {discount}% (tiết kiệm {formatPrice(unitPrice * months * discount / 100)})
                      </div>
                    )}
                  </div>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleProceedToContract}
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
                    Xem chính sách
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
