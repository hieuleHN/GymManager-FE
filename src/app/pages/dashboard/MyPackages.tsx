import { DashboardLayout } from '../../components/DashboardLayout';
import { Calendar, MapPin, Check } from 'lucide-react';
import { Button } from '@mui/material';
import { Link } from 'react-router';

export function MyPackages() {
  const currentPackages = [
    {
      id: 1,
      name: 'PREMIUM',
      price: 2800000,
      startDate: '01/05/2024',
      endDate: '01/06/2024',
      daysRemaining: 25,
      club: 'ZenFitness Quận 1',
      features: [
        'Sử dụng tất cả các phòng',
        'Massage miễn phí',
        '12 buổi Kickfit',
        '12 buổi GroupX/tháng',
        'Ứng dụng Workout'
      ]
    },
    {
      id: 2,
      name: 'YOGA STANDARD',
      price: 1500000,
      startDate: '10/05/2024',
      endDate: '10/06/2024',
      daysRemaining: 20,
      club: 'ZenFitness Quận 2',
      features: [
        'Không giới hạn Yoga',
        'Tủ đồ cá nhân',
        'Phòng tắm - vệ sinh',
        'Wifi miễn phí'
      ]
    }
  ];

  const otherPackages = [
    {
      id: 1,
      name: 'BOXING PREMIUM',
      price: 2500000,
      discipline: 'Boxing',
      features: ['Không giới hạn Boxing', 'PT Boxing riêng', 'Bảo hiểm thể thao']
    },
    {
      id: 2,
      name: 'GYM VIP',
      price: 4500000,
      discipline: 'Gym',
      features: ['Không giới hạn PT', 'Trị liệu làm đẹp', 'Kế hoạch dinh dưỡng']
    },
    {
      id: 3,
      name: 'COMBO VIP',
      price: 5000000,
      discipline: 'Combo',
      features: ['Tất cả bộ môn', 'Không giới hạn PT', 'Ưu tiên đặt lịch']
    }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gói tập của tôi</h1>
          <p className="text-slate-600">Quản lý các gói tập đang sử dụng</p>
        </div>

        {/* Current Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border-l-4 border-indigo-600 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                      Đang hoạt động
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{pkg.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Giá trị</p>
                    <p className="text-xl font-bold text-indigo-600">{formatPrice(pkg.price)}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{pkg.startDate} - {pkg.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{pkg.club}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Còn <span className="font-bold">{pkg.daysRemaining} ngày</span>
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Quyền lợi:</h4>
                  <div className="space-y-1.5">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/packages">
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Nâng cấp
                    </Button>
                  </Link>
                  <Link to="/dashboard/services">
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' }
                      }}
                    >
                      Gia hạn
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other Packages */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Các gói tập khác</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-4">
                  <p className="text-sm text-indigo-600 font-semibold mb-1">{pkg.discipline}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(pkg.price)}</p>
                  <p className="text-sm text-slate-500">/tháng</p>
                </div>

                <div className="space-y-2 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link to={`/packages`}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      bgcolor: '#4f46e5',
                      '&:hover': { bgcolor: '#4338ca' },
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    Đăng ký ngay
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
