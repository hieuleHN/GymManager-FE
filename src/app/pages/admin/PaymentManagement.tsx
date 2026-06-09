import { useState } from 'react';
import { CreditCard, QrCode, Edit2, Save, X } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export function PaymentManagement() {
  const [activeTab, setActiveTab] = useState<'bank' | 'qr'>('bank');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isEditingQR, setIsEditingQR] = useState(false);

  const [bankInfo, setBankInfo] = useState({
    bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    accountNumber: '1234567890',
    accountName: 'CÔNG TY TNHH ZENFITNESS',
    branch: 'Chi nhánh TP. Hồ Chí Minh'
  });

  const [qrImage, setQrImage] = useState('https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=400');

  const handleBankSave = () => {
    setIsEditingBank(false);
    // TODO: Save to backend
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setQrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Quản lý thanh toán</h1>
        <p className="text-slate-600 mt-2">Quản lý thông tin thanh toán của phòng gym</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeTab === 'bank'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Chuyển khoản
          </div>
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeTab === 'qr'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Mã QR
          </div>
        </button>
      </div>

      {/* Bank Transfer Tab */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Thông tin chuyển khoản</h2>
            {!isEditingBank ? (
              <button
                onClick={() => setIsEditingBank(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleBankSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditingBank(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên ngân hàng
              </label>
              {isEditingBank ? (
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-slate-900 text-lg font-semibold">{bankInfo.bankName}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số tài khoản
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-slate-900 text-lg font-mono font-bold">{bankInfo.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên tài khoản
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankInfo.accountName}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-slate-900 text-lg font-semibold">{bankInfo.accountName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chi nhánh
              </label>
              {isEditingBank ? (
                <input
                  type="text"
                  value={bankInfo.branch}
                  onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-slate-900 text-lg">{bankInfo.branch}</p>
              )}
            </div>
          </div>

          <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-2">Lưu ý khi chuyển khoản</h3>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• Vui lòng ghi rõ nội dung chuyển khoản: "Họ tên + Số điện thoại"</li>
              <li>• Thanh toán sẽ được xác nhận trong vòng 5-10 phút</li>
              <li>• Liên hệ hotline nếu cần hỗ trợ: 1900 1234</li>
            </ul>
          </div>
        </div>
      )}

      {/* QR Code Tab */}
      {activeTab === 'qr' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Mã QR thanh toán</h2>
            {!isEditingQR ? (
              <button
                onClick={() => setIsEditingQR(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Thay đổi QR
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingQR(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditingQR(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={qrImage}
                alt="QR Code"
                className="w-80 h-80 object-contain border-4 border-slate-200 rounded-2xl shadow-lg"
              />
              {isEditingQR && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <label className="cursor-pointer bg-white px-6 py-3 rounded-lg font-medium text-slate-900 hover:bg-slate-100 transition-colors">
                    Chọn ảnh mới
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-8 text-center max-w-md">
              <h3 className="font-semibold text-slate-900 mb-2">Hướng dẫn quét QR</h3>
              <p className="text-sm text-slate-600">
                Mở ứng dụng ngân hàng trên điện thoại, chọn chức năng quét mã QR và hướng camera vào mã QR trên để thực hiện thanh toán nhanh chóng.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
