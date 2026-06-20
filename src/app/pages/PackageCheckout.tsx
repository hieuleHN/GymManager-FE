import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router';
import { packagesData, clubsData, disciplinesData } from '../data';
import { Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { getApiUrl } from './../context/AuthContext';

export function PackageCheckout() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const selectedPackage = packagesData.find(p => p.id === packageId);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      setAuthError('login');
      setAuthChecking(false);
      return;
    }
    const user = JSON.parse(stored);
    if (user.isStaff) {
      setAuthError('staff');
      setAuthChecking(false);
      return;
    }
    fetch(`${getApiUrl()}/api/customers/my-info`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.status) {
          if (data.status === 'approved') {
            setAuthError(null);
          } else {
            setAuthError('not_approved');
          }
        }
      })
      .catch(() => setAuthError('login'))
      .finally(() => setAuthChecking(false));
  }, []);

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Đang kiểm tra...</p>
      </div>
    );
  }

  if (authError === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-slate-600 mb-6">Bạn cần đăng nhập để đăng ký gói tập</p>
          <Button variant="contained" onClick={() => navigate('/auth')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 6 }}>
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  if (authError === 'not_approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Chưa được xác nhận</h2>
          <p className="text-slate-600 mb-6">Bạn cần hoàn thiện thông tin cá nhân và được xác nhận trước khi đăng ký gói tập</p>
          <Button variant="contained" onClick={() => navigate('/dashboard/settings')}
            sx={{ bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' }, textTransform: 'none', borderRadius: 2, px: 6 }}>
            Đi đến cài đặt
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const [selectedClub, setSelectedClub] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState(selectedPackage?.discipline || '');
  const [currentPackage, setCurrentPackage] = useState(packageId || '');
  const [durationType, setDurationType] = useState<'month' | 'year'>('month');

  if (!selectedPackage) {
    return <Navigate to="/packages" />;
  }

  // Set initial club if only one available
  useEffect(() => {
    const pkg = getCurrentPackageData();
    if (pkg.clubs.length === 1 && !selectedClub) {
      setSelectedClub(pkg.clubs[0]);
    }
  }, [currentPackage]);

  const getCurrentPackageData = () => {
    return packagesData.find(p => p.id === currentPackage) || selectedPackage;
  };

  const pkg = getCurrentPackageData();

  // Get all unique clubs from all packages
  const allClubs = clubsData;

  // Get packages filtered by selected club and discipline
  const getAvailablePackages = () => {
    let packages = packagesData;

    if (selectedDiscipline) {
      packages = packages.filter(p => p.discipline === selectedDiscipline);
    }

    if (selectedClub) {
      packages = packages.filter(p => p.clubs.includes(selectedClub));
    }

    return packages;
  };

  const availablePackages = getAvailablePackages();

  const monthlyPrice = pkg.price;
  const yearlyPrice = pkg.price * 12 * 0.85; // 15% discount for yearly
  const totalPrice = durationType === 'month' ? monthlyPrice : yearlyPrice;

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleProceedToContract = () => {
    if (!selectedClub) {
      alert('Vui lòng chọn cơ sở phòng tập');
      return;
    }

    navigate('/contract', {
      state: {
        package: pkg,
        club: clubsData.find(c => c.id === selectedClub),
        durationType,
        totalPrice
      }
    });
  };

  const handleDisciplineChange = (newDiscipline: string) => {
    setSelectedDiscipline(newDiscipline);
    // Reset package selection when discipline changes
    const packagesInDiscipline = packagesData.filter(p =>
      p.discipline === newDiscipline && (!selectedClub || p.clubs.includes(selectedClub))
    );
    if (packagesInDiscipline.length > 0) {
      setCurrentPackage(packagesInDiscipline[0].id);
    }
  };

  const handleClubChange = (newClub: string) => {
    setSelectedClub(newClub);
    // Check if current package is available in selected club
    const currentPkg = getCurrentPackageData();
    if (!currentPkg.clubs.includes(newClub)) {
      // Find a package in same discipline that's available in this club
      const availablePkg = packagesData.find(p =>
        p.discipline === selectedDiscipline && p.clubs.includes(newClub)
      );
      if (availablePkg) {
        setCurrentPackage(availablePkg.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Thông tin đăng ký</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Club Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Chọn cơ sở phòng tập</h2>
              <FormControl fullWidth>
                <InputLabel>Cơ sở</InputLabel>
                <Select
                  value={selectedClub}
                  label="Cơ sở"
                  onChange={(e) => handleClubChange(e.target.value)}
                >
                  {allClubs.map((club) => (
                    <MenuItem key={club.id} value={club.id}>
                      {club.name} - {club.address}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Discipline Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Chọn bộ môn</h2>
              <FormControl fullWidth>
                <InputLabel>Bộ môn</InputLabel>
                <Select
                  value={selectedDiscipline}
                  label="Bộ môn"
                  onChange={(e) => handleDisciplineChange(e.target.value)}
                >
                  {disciplinesData.map((disc) => (
                    <MenuItem key={disc.id} value={disc.id}>
                      {disc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Package Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Chọn gói tập</h2>
              <FormControl fullWidth disabled={availablePackages.length === 0}>
                <InputLabel>Gói tập</InputLabel>
                <Select
                  value={currentPackage}
                  label="Gói tập"
                  onChange={(e) => setCurrentPackage(e.target.value)}
                >
                  {availablePackages.length > 0 ? (
                    availablePackages.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} - {formatPrice(p.price)}/{p.duration}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      Không có gói tập phù hợp
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {availablePackages.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  Vui lòng chọn cơ sở và bộ môn để xem các gói tập có sẵn
                </p>
              )}
            </div>

            {/* Duration Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Chọn thời gian tập</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDurationType('month')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    durationType === 'month'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-1">Theo tháng</div>
                  <div className="text-2xl font-bold text-indigo-600">{formatPrice(monthlyPrice)}</div>
                  <div className="text-sm text-slate-500">/ tháng</div>
                </button>
                <button
                  onClick={() => setDurationType('year')}
                  className={`p-4 rounded-xl border-2 transition-all relative ${
                    durationType === 'year'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -15%
                  </div>
                  <div className="font-bold text-slate-900 mb-1">Theo năm</div>
                  <div className="text-2xl font-bold text-indigo-600">{formatPrice(yearlyPrice)}</div>
                  <div className="text-sm text-slate-500">/ năm</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Chi tiết gói tập</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Gói tập</p>
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                </div>
                {selectedClub && (
                  <div>
                    <p className="text-sm text-slate-500">Cơ sở</p>
                    <p className="font-medium text-slate-900">
                      {clubsData.find(c => c.id === selectedClub)?.name}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Thời gian</p>
                  <p className="font-medium text-slate-900">
                    {durationType === 'month' ? '1 tháng' : '12 tháng'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Quyền lợi:</h3>
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600">Thành tiền:</span>
                  <span className="text-3xl font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
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
                    '&:hover': {
                      bgcolor: '#4338ca'
                    }
                  }}
                >
                  Xem hợp đồng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
