import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { Pause, Play, MapPin, FileText, HelpCircle, Users, Download, Send, X } from 'lucide-react';
import { useState } from 'react';
import { clubsData } from '../../data';

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
    id: 'activate',
    title: 'Kích hoạt gói tập',
    description: 'Kích hoạt lại gói tập đã tạm ngưng',
    icon: Play,
    color: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    id: 'transfer',
    title: 'Chuyển nhượng',
    description: 'Chuyển nhượng gói tập cho người khác',
    icon: Users,
    color: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    id: 'change-club',
    title: 'Chuyển cơ sở phòng tập',
    description: 'Chuyển sang cơ sở khác của ZenFitness',
    icon: MapPin,
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

const userPackages = [
  { id: 1, name: 'PREMIUM - Gym', discipline: 'Gym' },
  { id: 2, name: 'YOGA STANDARD - Yoga', discipline: 'Yoga' }
];

const contracts = [
  {
    id: 1,
    name: 'Hợp đồng PREMIUM - Gym',
    registrationDate: '01/05/2024',
    url: '/contracts/premium-gym-2024.pdf'
  },
  {
    id: 2,
    name: 'Hợp đồng YOGA STANDARD',
    registrationDate: '10/05/2024',
    url: '/contracts/yoga-standard-2024.pdf'
  }
];

export function Services() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezePackage, setFreezePackage] = useState('');
  const [freezeDuration, setFreezeDuration] = useState('1');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [changeClubReason, setChangeClubReason] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{sender: 'user' | 'staff', message: string, time: string}>>([
    { sender: 'staff', message: 'Xin chào! Tôi có thể giúp gì cho bạn?', time: '10:00' }
  ]);

  const handleServiceClick = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setFreezeReason('');
    setFreezePackage('');
    setFreezeDuration('1');
    setSelectedPackage('');
    setTransferReason('');
    setTransferCode('');
    setChangeClubReason('');
    setSelectedClub('');
  };

  const handleSubmitRequest = () => {
    alert('Yêu cầu của bạn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm!');
    handleCloseModal();
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages([...chatMessages, {
        sender: 'user',
        message: chatMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatMessage('');

      // Simulate staff response
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          sender: 'staff',
          message: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ xử lý yêu cầu của bạn ngay.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
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
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Chuyển cơ sở phòng tập</p>
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
                    Chọn gói tạm ngưng
                  </label>
                  <select
                    value={freezePackage}
                    onChange={(e) => setFreezePackage(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn gói tập</option>
                    {userPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
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
                  onClick={handleSubmitRequest}
                  disabled={!freezeReason.trim() || !freezePackage}
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

        {/* Activate Package Modal */}
        {selectedService === 'activate' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Kích hoạt gói tập</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chọn gói tập
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn gói tập cần kích hoạt</option>
                    {userPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
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
                  onClick={handleSubmitRequest}
                  disabled={!selectedPackage}
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

        {/* Transfer Package Modal */}
        {selectedService === 'transfer' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Chuyển nhượng gói tập</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do chuyển nhượng
                  </label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Vui lòng cho chúng tôi biết lý do chuyển nhượng..."
                    className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chọn gói để chuyển nhượng
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn gói tập</option>
                    {userPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mã người được chuyển nhượng
                  </label>
                  <input
                    type="text"
                    value={transferCode}
                    onChange={(e) => setTransferCode(e.target.value)}
                    placeholder="Nhập mã hội viên hoặc số điện thoại"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Sau khi chuyển nhượng, bạn sẽ không thể sử dụng gói tập này. Người nhận phải xác nhận trước khi hoàn tất chuyển nhượng.
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
                  onClick={handleSubmitRequest}
                  disabled={!transferReason.trim() || !selectedPackage || !transferCode.trim()}
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

        {/* Change Club Modal */}
        {selectedService === 'change-club' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Chuyển cơ sở phòng tập</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do chuyển cơ sở
                  </label>
                  <textarea
                    value={changeClubReason}
                    onChange={(e) => setChangeClubReason(e.target.value)}
                    placeholder="Vui lòng cho chúng tôi biết lý do chuyển cơ sở..."
                    className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chọn cơ sở muốn chuyển đến
                  </label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn cơ sở</option>
                    {clubsData.map(club => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Yêu cầu chuyển cơ sở sẽ được xử lý trong vòng 24 giờ. Bạn có thể tiếp tục sử dụng cơ sở hiện tại trong thời gian chờ.
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
                  onClick={handleSubmitRequest}
                  disabled={!changeClubReason.trim() || !selectedClub}
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

        {/* Contract Modal */}
        {selectedService === 'contract' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Hợp đồng của tôi</h2>

              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{contract.name}</p>
                        <p className="text-sm text-slate-600">Ngày đăng ký: {contract.registrationDate}</p>
                      </div>
                    </div>
                    <a
                      href={contract.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Tải xuống</span>
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outlined"
                  onClick={handleCloseModal}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Support Chat Modal */}
        {selectedService === 'support' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl w-[450px] h-[600px] mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Hỗ trợ khách hàng</h3>
                    <p className="text-xs text-green-600">● Đang hoạt động</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    } rounded-2xl px-4 py-2`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
