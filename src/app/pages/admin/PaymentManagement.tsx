import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Edit2, Save, X, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

interface PaymentData {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  qrImage: string;
}

const emptyPayment: PaymentData = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  branch: '',
  qrImage: '',
};

export function PaymentManagement() {
  const { selectedClub, clubs } = useClub();
  const headers = getAuthHeaders();

  const [activeTab, setActiveTab] = useState<'bank' | 'qr'>('bank');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isEditingQR, setIsEditingQR] = useState(false);
  const [payment, setPayment] = useState<PaymentData>(emptyPayment);
  const [loading, setLoading] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  const selectedClubData = clubs.find(c => c._id === selectedClub);

  useEffect(() => {
    if (!selectedClub || selectedClub === 'all') {
      setPayment(emptyPayment);
      setIsEditingBank(false);
      setIsEditingQR(false);
      return;
    }
    const fetchPayment = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/${selectedClub}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPayment({
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          branch: data.branch || '',
          qrImage: data.qrImage || '',
        });
      } catch {
        toast.error('Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [selectedClub]);

  const handleBankSave = async () => {
    if (!selectedClub || selectedClub === 'all') return;
    setSavingBank(true);
    try {
      const res = await fetch(`/api/locations/${selectedClub}/payment`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: payment.bankName,
          accountNumber: payment.accountNumber,
          accountName: payment.accountName,
          branch: payment.branch,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Cập nhật thông tin chuyển khoản thành công!');
      setIsEditingBank(false);
    } catch {
      toast.error('Lưu thông tin thất bại');
    } finally {
      setSavingBank(false);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClub || selectedClub === 'all') return;

    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append('qrImage', file);
      const res = await fetch(`/api/locations/${selectedClub}/qr`, {
        method: 'POST',
        headers: { Authorization: headers?.Authorization || '' },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setPayment(prev => ({ ...prev, qrImage: data.qrImage }));
      toast.success('Cập nhật mã QR thành công!');
      setIsEditingQR(false);
    } catch {
      toast.error('Tải ảnh QR thất bại');
    } finally {
      setUploadingQR(false);
    }
  };

  const qrImageUrl = payment.qrImage
    ? `/uploads/locations/${payment.qrImage}`
    : '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý thanh toán</h1>
          <p className="text-slate-600 mt-2">
            {selectedClub === 'all'
              ? 'Vui lòng chọn một cơ sở từ dropdown phía trên'
              : `Quản lý thông tin thanh toán: ${selectedClubData?.address || ''}`
            }
          </p>
        </div>

        {selectedClub === 'all' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            <p className="text-lg font-medium">Chọn một cơ sở phòng tập từ dropdown góc phải trên cùng để quản lý thanh toán</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : (
          <>
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
                        disabled={savingBank}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                        value={payment.bankName}
                        onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 text-lg font-semibold">{payment.bankName || 'Chưa cập nhật'}</p>
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
                          value={payment.accountNumber}
                          onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-900 text-lg font-mono font-bold">{payment.accountNumber || 'Chưa cập nhật'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tên tài khoản
                      </label>
                      {isEditingBank ? (
                        <input
                          type="text"
                          value={payment.accountName}
                          onChange={(e) => setPayment({ ...payment, accountName: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-900 text-lg font-semibold">{payment.accountName || 'Chưa cập nhật'}</p>
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
                        value={payment.branch}
                        onChange={(e) => setPayment({ ...payment, branch: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 text-lg">{payment.branch || 'Chưa cập nhật'}</p>
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
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg transition-colors"
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
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code"
                        className="w-80 h-80 object-contain border-4 border-slate-200 rounded-2xl shadow-lg"
                      />
                    ) : (
                      <div className="w-80 h-80 border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                        <QrCode className="w-16 h-16" />
                      </div>
                    )}
                    {isEditingQR && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <label className="cursor-pointer bg-white px-6 py-3 rounded-lg font-medium text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-2">
                          {uploadingQR && <Loader2 className="w-4 h-4 animate-spin" />}
                          {uploadingQR ? 'Đang tải...' : 'Chọn ảnh mới'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQRUpload}
                            className="hidden"
                            disabled={uploadingQR}
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
