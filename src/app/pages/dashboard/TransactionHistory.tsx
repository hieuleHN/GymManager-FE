import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Transaction {
  _id: string;
  package_id: {
    _id: string;
    name: string;
    unitPrice: number;
  };
  locationId?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branch?: string;
  };
  total_price: number;
  payment_method: string;
  payment_status: string;
  createdAt: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  vnpay_bank_code?: string;
  vnpay_bank_tran_no?: string;
  vnpay_card_type?: string;
  vnpay_transaction_no?: string;
}

const bankNameMap: Record<string, string> = {
  'NCB': 'Ngân hàng NCB',
  'VNPAY': 'VNPay',
  'VISA': 'Visa',
  'MB': 'Ngân hàng Quân đội (MB)',
  'BIDV': 'Ngân hàng BIDV',
  'VIETCOM': 'Ngân hàng Vietcombank',
  'VIETIN': 'Ngân hàng VietinBank',
  'AGRI': 'Ngân hàng Agribank',
  'TECH': 'Ngân hàng Techcombank',
  'VP': 'Ngân hàng VPBank',
  'TP': 'Ngân hàng TPBank',
  'ACB': 'Ngân hàng ACB',
  'HDB': 'Ngân hàng HDBank',
  'SHB': 'Ngân hàng SHB',
  'SCB': 'Ngân hàng SCB',
  'EXIM': 'Ngân hàng Eximbank',
  'MSB': 'Ngân hàng MSB',
  'NAMAB': 'Ngân hàng Nam Á Bank',
  'SACOM': 'Ngân hàng Sacombank',
  'SEA': 'Ngân hàng Seabank',
  'OJB': 'Ngân hàng OCB',
  'VIB': 'Ngân hàng VIB',
  'PGB': 'Ngân hàng PG Bank',
  'BVB': 'Ngân hàng Bảo Việt',
  'DAB': 'Ngân hàng Đông Á',
  'STB': 'Ngân hàng Sacombank',
  'PVC': 'Ngân hàng PVcomBank',
  'VAB': 'Ngân hàng Việt Á',
};

const paymentMethodLabels: Record<string, string> = {
  'vnpay': 'VNPay',
  'momo': 'MoMo',
  'bank-card': 'Thẻ ngân hàng',
  'bank-transfer': 'Chuyển khoản',
  'qr-code': 'VietQR',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  'đã thanh toán': { label: 'Thành công', className: 'bg-green-100 text-green-700' },
  'chờ thanh toán': { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  'đã hủy': { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/user-packages/transactions`, {
      headers: getAuthHeaders(),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTransactions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    price.toLocaleString('vi-VN') + 'đ';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  const getMethodLabel = (method: string) =>
    paymentMethodLabels[method] || method || '---';

  const getStatusInfo = (status: string) =>
    statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-700' };

  const getBankInfo = (tx: Transaction) => {
    if (tx.payment_method === 'vnpay' && tx.vnpay_bank_code) {
      return bankNameMap[tx.vnpay_bank_code] || `Ngân hàng ${tx.vnpay_bank_code}`;
    }
    if (tx.payment_method === 'bank-transfer' || tx.payment_method === 'qr-code') {
      return tx.locationId?.bankName || '---';
    }
    return '---';
  };

  const getAccountNumber = (tx: Transaction) => {
    if (tx.payment_method === 'vnpay' && tx.vnpay_bank_tran_no) {
      return tx.vnpay_bank_tran_no;
    }
    if (tx.payment_method === 'bank-transfer' || tx.payment_method === 'qr-code') {
      return tx.locationId?.accountNumber || '---';
    }
    return '---';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử giao dịch</h1>
          <p className="text-slate-600">Theo dõi chi tiêu và thanh toán của bạn</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Ngày</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Nội dung</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Loại</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Số tiền</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Phương thức</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Ngân hàng</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Số tài khoản</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const status = getStatusInfo(tx.payment_status);
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">
                            {tx.package_id?.name || 'Đã xóa'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          Gói tập
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {formatPrice(tx.total_price)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {getMethodLabel(tx.payment_method)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {getBankInfo(tx)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {getAccountNumber(tx)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}