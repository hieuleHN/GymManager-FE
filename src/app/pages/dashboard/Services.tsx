import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { Pause, RefreshCw, CreditCard, Users, FileText, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const services = [
  {
    id: 'freeze',
    title: 'Tạm ngưng gói tập',
    description: 'Tạm dừng gói tập của bạn khi cần nghỉ ngơi',
    icon: Pause,
    color: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    id: 'change-package',
    title: 'Thay đổi gói tập',
    description: 'Nâng cấp hoặc thay đổi gói tập hiện tại',
    icon: RefreshCw,
    color: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    id: 'payment-method',
    title: 'Phương thức thanh toán',
    description: 'Cập nhật thông tin thanh toán của bạn',
    icon: CreditCard,
    color: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    id: 'guest-pass',
    title: 'Khách mời',
    description: 'Mời bạn bè đến tập cùng bạn',
    icon: Users,
    color: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    id: 'contract',
    title: 'Xem hợp đồng',
    description: 'Xem và tải xuống hợp đồng của bạn',
    icon: FileText,
    color: 'bg-slate-50',
    iconColor: 'text-slate-600'
  },
  {
    id: 'support',
    title: 'Hỗ trợ khách hàng',
    description: 'Liên hệ với đội ngũ hỗ trợ',
    icon: HelpCircle,
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600'
  }
];

export function Services() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeStartDate, setFreezeStartDate] = useState('');
  const [freezeDuration, setFreezeDuration] = useState('1');

  const handleServiceClick = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setFreezeReason('');
    setFreezeStartDate('');
    setFreezeDuration('1');
  };

  const handleSubmitFreeze = () => {
    // Handle freeze request
    alert('Yêu cầu tạm ngưng gói tập đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm!');
    handleCloseModal();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dịch vụ</h1>
          <p className="text-slate-600">Quản lý các dịch vụ và yêu cầu của bạn</p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all text-left group"
              >
                <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${service.iconColor}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-600">{service.description}</p>
              </button>
            );
          })}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Yêu cầu gần đây</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Pause className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Tạm ngưng gói tập</p>
                  <p className="text-sm text-slate-600">Ngày 15/05/2024 - 30 ngày</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                Đang xử lý
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Cập nhật phương thức thanh toán</p>
                  <p className="text-sm text-slate-600">Ngày 10/05/2024</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Hoàn thành
              </span>
            </div>
          </div>
        </div>

        {/* Freeze Package Modal */}
        {selectedService === 'freeze' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Tạm ngưng gói tập</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do tạm ngưng
                  </label>
                  <textarea
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn tạm ngưng..."
                    className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={freezeStartDate}
                    onChange={(e) => setFreezeStartDate(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thời gian tạm ngưng
                  </label>
                  <select
                    value={freezeDuration}
                    onChange={(e) => setFreezeDuration(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 tháng</option>
                    <option value="2">2 tháng</option>
                    <option value="3">3 tháng</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Gói tập của bạn sẽ được gia hạn thêm thời gian tương ứng với thời gian tạm ngưng.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCloseModal}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      bgcolor: '#f8fafc'
                    }
                  }}
                >
                  Hủy
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmitFreeze}
                  disabled={!freezeReason.trim() || !freezeStartDate}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' }
                  }}
                >
                  Gửi yêu cầu
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Other Services Modal */}
        {selectedService && selectedService !== 'freeze' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {services.find(s => s.id === selectedService)?.title}
              </h2>
              <p className="text-slate-600 mb-6">
                Tính năng này đang được phát triển. Vui lòng liên hệ bộ phận hỗ trợ khách hàng để được hỗ trợ.
              </p>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCloseModal}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' }
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
