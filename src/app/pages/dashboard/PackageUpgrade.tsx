import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Check, ArrowRight, Loader2, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@mui/material';

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  features: string[];
  durations: { months: number; discount: number }[];
  disciplineId?: { _id: string; name: string };
  is_active: boolean;
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
}

interface Registration {
  _id: string;
  package_id: {
    _id: string;
    name: string;
    unitPrice: number;
    disciplineId?: { _id: string; name: string };
  };
  status: string;
  payment_status: string;
  total_price: number;
  start_date: string;
  end_date: string;
}

export function PackageUpgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { registrationId } = useParams();

  const [currentReg, setCurrentReg] = useState<Registration | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user || user.isStaff) return;

    const load = async () => {
      try {
        const [infoRes, regRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/customers/my-info`, { headers: getAuthHeaders() }),
          fetch(`${getApiUrl()}/api/user-packages/${registrationId}`, { headers: getAuthHeaders() }),
        ]);
        const infoData = await infoRes.json();
        const regData = await regRes.json();

        if (infoData && !infoData.error) setCustomer(infoData);
        if (regData && !regData.error) {
          setCurrentReg(regData);

          const disciplineId =
            regData.package_id?.disciplineId?._id || regData.package_id?.disciplineId;
          const locId =
            infoData?.locationId?._id || infoData?.locationId ||
            regData.locationId?._id || regData.locationId;

          if (disciplineId) {
            const pkgRes = await fetch(
              `${getApiUrl()}/api/packages?page=1&limit=50&locationId=${locId}`
            );
            const pkgData = await pkgRes.json();
            const list = pkgData?.data || (Array.isArray(pkgData) ? pkgData : []);
            setPackages(
              list.filter((p: PackageItem) =>
                p.is_active &&
                p._id !== regData.package_id?._id &&
                (p.disciplineId?._id === disciplineId ||
                 p.disciplineId === disciplineId)
              )
            );
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [user, registrationId]);

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

  const formatPrice = (price: number) =>
    price ? price.toLocaleString('vi-VN') + 'đ' : '0đ';

  const handleSelectPackage = async (pkg: PackageItem) => {
    setSelectedPkg(pkg);
    setCalculating(true);
    setCalculation(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/calculate-upgrade`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({
          currentRegistrationId: registrationId,
          newPackageId: pkg._id,
        }),
      });
      const data = await res.json();
      setCalculation(data);
    } catch {
      setCalculation({ error: 'Lỗi tính toán' });
    }
    setCalculating(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPkg || !calculation || calculation.error) return;
    if (!signatureData) {
      alert('Vui lòng ký tên (vẽ chữ ký) để hoàn tất nâng cấp');
      return;
    }
    setConfirming(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/renew-upgrade`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({
          action_type: 'upgrade',
          package_id: selectedPkg._id,
          locationId: customer?.locationId?._id || customer?.locationId,
          duration_months: 1,
          total_price: calculation.amountToPay || calculation.newPackageCost,
          currentRegistrationId: registrationId,
          signature: signatureData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      navigate('/payment', {
        state: {
          package: selectedPkg,
          registration: { _id: data.registration._id },
          customer,
          durationMonths: 1,
          totalPrice: calculation.amountToPay || calculation.newPackageCost,
        },
      });
    } catch (err: any) {
      alert('Lỗi nâng cấp: ' + err.message);
    }
    setConfirming(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (!currentReg) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-slate-500">Không tìm thấy gói tập.</p>
          <Button onClick={() => navigate('/dashboard/my-packages')} sx={{ mt: 2, textTransform: 'none' }}>
            Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/my-packages')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nâng cấp gói tập</h1>
            <p className="text-slate-600">Chọn gói tập mới trong cùng bộ môn để nâng cấp</p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <p className="text-sm text-indigo-600 font-semibold mb-1">Gói hiện tại</p>
          <p className="text-xl font-bold text-slate-900">{currentReg.package_id?.name}</p>
          <p className="text-sm text-slate-600">
            Giá trị: {formatPrice(currentReg.total_price)} | Bộ môn: {currentReg.package_id?.disciplineId?.name || '---'}
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">Không có gói tập nào khác trong cùng bộ môn để nâng cấp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const isSelected = selectedPkg?._id === pkg._id;
              return (
                <div
                  key={pkg._id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 shadow-lg ring-2 ring-indigo-200'
                      : 'border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatPrice(pkg.unitPrice)}
                      <span className="text-sm text-slate-500 font-normal"> / tháng</span>
                    </p>
                  </div>

                  {(pkg.ptSessionsPerMonth > 0 || pkg.isFullMonth) && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                        {pkg.isFullMonth ? 'Không giới hạn buổi HLV' : `${pkg.ptSessionsPerMonth} buổi HLV / tháng`}
                      </span>
                    </div>
                  )}

                  <ul className="space-y-2 mb-4">
                    {(pkg.features || []).slice(0, 3).map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(pkg.features || []).length > 3 && (
                      <li className="text-xs text-slate-400">+{pkg.features.length - 3} tiện ích khác</li>
                    )}
                  </ul>

                  {isSelected && calculation && !calculation.error && (
                    <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Ngày còn lại</span>
                        <span className="font-semibold">{calculation.remainingDays} ngày</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Giá trị còn lại của gói cũ</span>
                        <span className="font-semibold text-green-600">-{formatPrice(calculation.remainingValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Chi phí gói mới (cùng kỳ hạn)</span>
                        <span className="font-semibold">+{formatPrice(calculation.newPackageCost)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2">
                        {calculation.refundAmount > 0 ? (
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-green-600">Bạn sẽ được hoàn lại</p>
                            <p className="text-xl font-bold text-green-600">{formatPrice(calculation.refundAmount)}</p>
                          </div>
                        ) : (
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-amber-600">Bạn cần thanh toán thêm</p>
                            <p className="text-xl font-bold text-amber-600">{formatPrice(calculation.amountToPay)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isSelected && calculating && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedPkg && calculation && !calculation.error && !calculating && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chữ ký của hội viên (Vẽ chữ ký của bạn vào ô bên dưới):
              </label>
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-w-md">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky bottom-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    Nâng cấp từ <strong>{currentReg.package_id?.name}</strong> lên <strong>{selectedPkg.name}</strong>
                  </p>
                  <p className="text-sm text-slate-500">
                    {calculation.refundAmount > 0
                      ? `Bạn sẽ được hoàn ${formatPrice(calculation.refundAmount)}`
                      : `Bạn cần thanh toán thêm ${formatPrice(calculation.amountToPay)}`}
                  </p>
                </div>
                <Button
                  variant="contained"
                  disabled={confirming || !signatureData}
                  onClick={handleConfirmUpgrade}
                  sx={{
                    bgcolor: '#4f46e5',
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: '#4338ca' },
                  }}
                >
                  {confirming ? 'Đang xử lý...' : 'Xác nhận nâng cấp'}
                </Button>
              </div>
            </div>
          </>
        )}

        {calculation?.error && (
          <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-red-700">{calculation.error}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
