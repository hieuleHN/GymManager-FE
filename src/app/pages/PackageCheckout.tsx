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
  const [selectedDiscipline, setSelectedDiscipline] = useState(selectedPackage?.discipline || '');
  const [currentPackage, setCurrentPackage] = useState(packageId || '');
  const [durationType, setDurationType] = useState<'month' | 'year'>('month');

  if (!selectedPackage) {
    return <Navigate to="/packages" />;
  }

  const getCurrentPackageData = () => {
    return packagesData.find(p => p.id === currentPackage) || selectedPackage;
  };

  const pkg = getCurrentPackageData();

  const getAvailablePackages = () => {
    let packages = packagesData;
    if (selectedDiscipline) {
      packages = packages.filter(p => p.discipline === selectedDiscipline);
    }
    return packages;
  };

  const availablePackages = getAvailablePackages();

  const monthlyPrice = pkg.price;
  const yearlyPrice = pkg.price * 12 * 0.85;
  const totalPrice = durationType === 'month' ? monthlyPrice : yearlyPrice;

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleProceedToContract = async () => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    const user = JSON.parse(stored);
    if (user.isStaff) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/customers/my-info`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data?.status === 'approved') {
        navigate('/contract', {
          state: {
            package: pkg,
            club: clubsData.find(c => c.id === pkg.clubs[0]),
            durationType,
            totalPrice
          }
        });
      } else {
        navigate('/dashboard/settings');
      }
    } catch {
      navigate('/auth');
    }
  };

  const handleDisciplineChange = (newDiscipline: string) => {
    setSelectedDiscipline(newDiscipline);
    const packagesInDiscipline = packagesData.filter(p =>
      p.discipline === newDiscipline
    );
    if (packagesInDiscipline.length > 0) {
      setCurrentPackage(packagesInDiscipline[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Thông tin đăng ký</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Discipline Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Chọn bộ môn</h2>
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
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Chọn gói tập</h2>
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
                  Vui lòng chọn bộ môn để xem các gói tập có sẵn
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
                  Xem điều khoản
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
