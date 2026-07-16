import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Wallet, Plus, Loader2, X, ExternalLink, Smartphone, Check, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, getApiUrl, getAuthHeaders } from '../context/AuthContext';
import { toast } from 'sonner';

interface WalletBalanceProps {
  balance?: number;
  onBalanceUpdate?: (balance: number) => void;
}

const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + '₫';
}

export function WalletBalance({ balance: initialBalance = 0, onBalanceUpdate }: WalletBalanceProps) {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [balance, setBalance] = useState(initialBalance);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [loading, setLoading] = useState(false);
  const canTopUp = amount >= 10000 && agree1 && agree2;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topupStatus = params.get('wallet_topup');
    if (topupStatus === 'success') {
      const amt = Number(params.get('amount') || 0);
      toast.success(`Nạp tiền thành công! Số dư +${amt.toLocaleString('vi-VN')}₫`);
    } else if (topupStatus === 'fail') {
      toast.error('Nạp tiền thất bại! Vui lòng thử lại.');
    }
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/wallet/balance`, {
        headers: getAuthHeaders() as any
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        const stored = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (stored.token) {
          stored.balance = data.balance || 0;
          localStorage.setItem('auth_user', JSON.stringify(stored));
        }
        if (onBalanceUpdate) onBalanceUpdate(data.balance || 0);
      }
    } catch {}
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toLocaleString('vi-VN'));
  };

  const handleCustomAmount = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) {
      setCustomAmount('');
      setAmount(0);
      return;
    }
    const num = Number(raw);
    setCustomAmount(num.toLocaleString('vi-VN'));
    setAmount(num);
  };

  const handleTopUp = async () => {
    if (!amount || amount < 10000) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/wallet/topup`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error('Lỗi tạo giao dịch');
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => { setShowModal(true); fetchBalance(); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 hover:from-emerald-100 hover:to-teal-100 transition-all group">
        <Wallet className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-bold text-emerald-700">{formatPrice(balance)}</span>
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white group-hover:bg-emerald-600 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Nạp tiền vào Ví</h2>
                    <p className="text-sm text-slate-500">Số dư: <span className="font-bold text-emerald-600">{formatPrice(balance)}</span></p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Số tiền nạp</label>
                <div className="relative mb-3">
                  <input type="text" inputMode="numeric"
                    value={customAmount}
                    onChange={e => handleCustomAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 text-lg font-bold text-slate-900 outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₫</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map(val => (
                    <button key={val}
                      onClick={() => handleQuickAmount(val)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                        amount === val
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                      }`}>
                      {formatPrice(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">VNPay</p>
                    <p className="text-xs text-slate-500">ATM / Internet Banking / Ví điện tử</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-3">
                <label onClick={() => setAgree1(!agree1)}
                  className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    agree1
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-300 group-hover:border-emerald-400'
                  }`}>
                    {agree1 && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">
                    Tôi đã đọc và đồng ý với{' '}
                    <button onClick={e => { e.stopPropagation(); alert('Chính sách nạp tiền và hoàn tiền'); }}
                      className="text-emerald-600 hover:text-emerald-700 underline font-medium">
                      Chính sách nạp & hoàn tiền
                    </button>
                  </span>
                </label>

                <label onClick={() => setAgree2(!agree2)}
                  className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    agree2
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-300 group-hover:border-emerald-400'
                  }`}>
                    {agree2 && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">
                    Tôi đã đọc và đồng ý với{' '}
                    <button onClick={e => { e.stopPropagation(); alert('Điều khoản sử dụng ví điện tử'); }}
                      className="text-emerald-600 hover:text-emerald-700 underline font-medium">
                      Điều khoản sử dụng Ví
                    </button>
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}
                className="flex-1 h-12 rounded-xl text-sm font-bold border-slate-300 text-slate-600 hover:bg-slate-50">
                Hủy
              </Button>
              {canTopUp ? (
                <Button onClick={handleTopUp} disabled={loading}
                  className="flex-1 h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Nạp {formatPrice(amount)}</>}
                </Button>
              ) : (
                <div className="flex-1 h-12 rounded-xl text-sm font-bold bg-slate-100 text-slate-400 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  {!agree1 || !agree2 ? 'Đồng ý chính sách để nạp tiền' : 'Nhập số tiền tối thiểu 10.000₫'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
