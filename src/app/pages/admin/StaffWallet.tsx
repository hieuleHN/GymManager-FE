import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  description: string;
  createdAt: string;
}

export function StaffWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/staff-wallet/balance`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/staff-wallet/transactions`, { headers: getAuthHeaders() })
      ]);
      const balData = await balRes.json();
      const txData = await txRes.json();
      setBalance(balData.balance || 0);
      setTransactions(txData || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Ví điện tử nhân viên
        </h1>

        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <p className="text-sm opacity-80 mb-1">Số dư hiện tại</p>
          <p className="text-4xl font-bold mb-4">
            {balance.toLocaleString('vi-VN')}₫
          </p>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-3">Lịch sử giao dịch</h2>
        <div className="bg-white rounded-xl shadow-sm">
          {transactions.length === 0 && !loading && (
            <p className="p-6 text-gray-400 text-center">Chưa có giao dịch nào.</p>
          )}
          {loading && transactions.length === 0 && (
            <p className="p-6 text-gray-400 text-center">Đang tải...</p>
          )}
          {transactions.map(tx => (
            <div key={tx._id} className="flex items-center justify-between px-6 py-4 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tx.amount > 0
                    ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                    : <ArrowDownLeft className="w-4 h-4 text-red-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-sm">{tx.description || tx.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}₫
                </p>
                <p className="text-xs text-gray-400">
                  SD: {tx.balanceAfter.toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
