import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getApiUrl, getAuthHeaders, useAuth } from '../../context/AuthContext';
import { Loader2, Calendar, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface BookingItem {
  _id: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  price?: number;
  batchId?: string;
  createdAt?: string;
  vnpay_bank_code?: string;
  vnpay_bank_tran_no?: string;
  vnpay_card_type?: string;
  vnpay_transaction_no?: string;
  trainerId?: { _id: string; fullName: string; phone?: string; disciplineId?: any; specialties?: string[] };
  disciplineId?: { _id: string; name: string } | null;
  disciplineName?: string;
}

interface BatchGroup {
  batchId: string;
  bookings: BookingItem[];
  count: number;
  totalPrice: number;
  firstCreatedAt: string;
  trainerName: string;
  disciplineName: string;
  paymentMethod: string;
  paymentStatus: string;
}

interface Transaction {
  _id: string;
  type: 'package' | 'booking' | 'wallet';
  walletSubType?: 'topup' | 'payment' | 'refund' | 'withdraw';
  name: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  createdAt: string;
  package_id?: { _id: string; name: string; unitPrice: number };
  locationId?: { bankName?: string; accountNumber?: string; accountName?: string; branch?: string };
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  vnpay_bank_code?: string;
  vnpay_bank_tran_no?: string;
  vnpay_card_type?: string;
  vnpay_transaction_no?: string;
  disciplineName?: string;
  date?: string;
  time?: string;
  trainerName?: string;
  batchId?: string;
  bookingCount?: number;
  bookingIds?: string[];
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
  'wallet': 'Ví điện tử',
  'bank-transfer': 'Chuyển khoản',
  'qr-code': 'VietQR',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  'đã thanh toán': { label: 'Thành công', className: 'bg-green-100 text-green-700' },
  'paid': { label: 'Thành công', className: 'bg-green-100 text-green-700' },
  'chờ thanh toán': { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  'pending': { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  'đã hủy': { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700' },
  'cancelled': { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700' },
};

export function TransactionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [rawBookings, setRawBookings] = useState<any[]>([]);

  const handleContinuePayment = (tx: Transaction) => {
    if (tx.type === 'package') {
      navigate('/payment', {
        state: {
          type: 'package',
          registration: { _id: tx._id },
          package: { name: tx.package_id?.name || 'Gói tập', price: tx.total_price },
          totalPrice: tx.total_price,
          customer: user
        }
      });
    } else if (tx.type === 'booking') {
      const related = rawBookings.filter((b: any) => tx.batchId ? b.batchId === tx.batchId : b._id === tx._id);
      const first = related[0];
      if (!first) return;
      const trainerInfo = first.trainerId || { fullName: tx.trainerName };
      navigate('/payment', {
        state: {
          type: 'trainer_booking',
          bookings: related,
          batchId: tx.batchId || '',
          trainer: trainerInfo,
          totalPrice: tx.total_price,
          package: { name: tx.name, price: tx.total_price }
        }
      });
    }
  };

  const handleViewBatchBookings = (tx: Transaction) => {
    if (tx.batchId && tx.bookingIds && tx.bookingIds.length > 0) {
      navigate(`/dashboard/bookings/${tx.bookingIds[0]}/status?success=true&batchId=${tx.batchId}`);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`${getApiUrl()}/api/user-packages/transactions`, { headers: getAuthHeaders() }),
      fetch(`${getApiUrl()}/api/bookings/my`, { headers: getAuthHeaders() }),
      fetch(`${getApiUrl()}/api/wallet/transactions`, { headers: getAuthHeaders() })
    ])
      .then(([pkgRes, bookingRes, walletRes]) => Promise.all([pkgRes.json(), bookingRes.json(), walletRes.json()]))
      .then(([pkgData, bookingData, walletData]) => {
        const list: Transaction[] = [];
        const bookingRawList: any[] = [];

        if (Array.isArray(pkgData)) {
          pkgData.forEach((tx: any) => list.push({ ...tx, type: 'package' }));
        }

        if (Array.isArray(bookingData)) {
          const bookingsByBatch: Record<string, BookingItem[]> = {};
          const standaloneBookings: BookingItem[] = [];
          bookingData.forEach((b: any) => {
            bookingRawList.push(b);
            const item: BookingItem = {
              _id: b._id,
              date: b.date,
              time: b.time || b.startTime,
              startTime: b.startTime,
              endTime: b.endTime,
              status: b.status,
              paymentStatus: b.paymentStatus || 'pending',
              paymentMethod: b.paymentMethod || '',
              price: b.price || 0,
              batchId: b.batchId || '',
              createdAt: b.createdAt || b.created_at,
              vnpay_bank_code: b.vnpay_bank_code,
              vnpay_bank_tran_no: b.vnpay_bank_tran_no,
              vnpay_card_type: b.vnpay_card_type,
              vnpay_transaction_no: b.vnpay_transaction_no,
              trainerId: b.trainerId,
              disciplineId: b.disciplineId,
              disciplineName: b.disciplineName,
            };
            if (b.batchId) {
              if (!bookingsByBatch[b.batchId]) bookingsByBatch[b.batchId] = [];
              bookingsByBatch[b.batchId].push(item);
            } else {
              standaloneBookings.push(item);
            }
          });

          Object.values(bookingsByBatch).forEach(batch => {
            const first = batch[0];
            const batchTx: Transaction = {
              _id: `batch_${first.batchId}`,
              type: 'booking',
              batchId: first.batchId,
              name: `Tập với HLV ${first.trainerId?.fullName || 'HLV'}` + (first.disciplineName ? ` (${first.disciplineName})` : ''),
              total_price: batch.reduce((sum, b) => sum + (b.price || 0), 0),
              payment_method: batch.find(b => b.paymentMethod)?.paymentMethod || batch[0].paymentMethod || '',
              payment_status: batch.every(b => b.paymentStatus === 'paid') ? 'paid' : batch.every(b => b.paymentStatus === 'cancelled') ? 'cancelled' : 'pending',
              createdAt: batch.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())[0].createdAt || '',
              vnpay_bank_code: batch.find(b => b.vnpay_bank_code)?.vnpay_bank_code || '',
              vnpay_bank_tran_no: batch.find(b => b.vnpay_bank_tran_no)?.vnpay_bank_tran_no || '',
              vnpay_card_type: batch.find(b => b.vnpay_card_type)?.vnpay_card_type || '',
              vnpay_transaction_no: batch.find(b => b.vnpay_transaction_no)?.vnpay_transaction_no || '',
              disciplineName: first.disciplineName,
              trainerName: first.trainerId?.fullName,
              bookingCount: batch.length,
              bookingIds: batch.map(b => b._id),
            };
            list.push(batchTx);
          });

          standaloneBookings.forEach(b => {
            list.push({
              _id: b._id,
              type: 'booking',
              name: `Tập với HLV ${b.trainerId?.fullName || 'HLV'}` + (b.disciplineName ? ` (${b.disciplineName})` : ''),
              total_price: b.price || 0,
              payment_method: b.paymentMethod || '',
              payment_status: b.paymentStatus || 'pending',
              createdAt: b.createdAt || '',
              vnpay_bank_code: b.vnpay_bank_code,
              vnpay_bank_tran_no: b.vnpay_bank_tran_no,
              vnpay_card_type: b.vnpay_card_type,
              vnpay_transaction_no: b.vnpay_transaction_no,
              date: b.date,
              time: b.time,
              trainerName: b.trainerId?.fullName,
              disciplineName: b.disciplineName,
            });
          });
        }

        setRawBookings(bookingRawList);

        if (Array.isArray(walletData)) {
          walletData.forEach((tx: any) => {
            if (tx.status !== 'completed') return;
            const txType = tx.type;
            let name = tx.description || '';
            let method = 'wallet';
            if (txType === 'topup') { name = name || 'Nạp tiền ví'; method = 'vnpay'; }
            else if (txType === 'payment') { name = name || 'Thanh toán ví'; method = 'wallet'; }
            else if (txType === 'refund') { name = name || 'Hoàn tiền'; method = 'wallet'; }
            list.push({
              _id: `wallet_${tx._id}`,
              type: 'wallet',
              walletSubType: txType,
              name,
              total_price: Math.abs(tx.amount || 0),
              payment_method: method,
              payment_status: 'paid',
              createdAt: tx.createdAt || '',
              vnpay_bank_code: tx.vnpayBankCode,
              vnpay_bank_tran_no: tx.vnpayBankTranNo,
              vnpay_card_type: tx.vnpayCardType,
              vnpay_transaction_no: tx.vnpayTransactionNo,
            });
          });
        }

        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    (price || 0).toLocaleString('vi-VN') + 'đ';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  const getMethodLabel = (method: string) =>
    paymentMethodLabels[method] || method || '---';

  const getStatusInfo = (status: string) =>
    statusConfig[status?.toLowerCase()] || { label: status || '---', className: 'bg-slate-100 text-slate-700' };

  const getBankInfo = (tx: Transaction) => {
    if (tx.payment_method === 'wallet') return '';
    if (tx.payment_method === 'vnpay' && tx.vnpay_bank_code) {
      return bankNameMap[tx.vnpay_bank_code] || `Ngân hàng ${tx.vnpay_bank_code}`;
    }
    if (tx.payment_method === 'bank-transfer' || tx.payment_method === 'qr-code') {
      return tx.locationId?.bankName || '';
    }
    return '';
  };

  const getAccountNumber = (tx: Transaction) => {
    if (tx.payment_method === 'wallet') return '';
    if (tx.payment_method === 'vnpay' && tx.vnpay_bank_tran_no) {
      return tx.vnpay_bank_tran_no;
    }
    if (tx.payment_method === 'bank-transfer' || tx.payment_method === 'qr-code') {
      return tx.locationId?.accountNumber || '';
    }
    return '';
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
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const status = getStatusInfo(tx.payment_status);
                    return (
                      <tr key={`${tx.type}-${tx._id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">
                            {tx.type === 'booking' ? tx.name : tx.type === 'wallet' ? tx.name : (tx.package_id?.name || 'Đã xóa')}
                          </p>
                          {tx.type === 'booking' && tx.bookingCount && tx.bookingCount > 1 ? (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tx.bookingCount} buổi
                            </p>
                          ) : tx.type === 'booking' && tx.date ? (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(tx.date)}{tx.time ? ` ${tx.time}` : ''}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {tx.type === 'booking' ? 'Đặt lịch' : tx.type === 'wallet'
                            ? tx.walletSubType === 'payment' ? 'Thanh toán'
                              : tx.walletSubType === 'refund' ? 'Hoàn tiền'
                              : tx.walletSubType === 'topup' ? 'Nạp tiền'
                              : 'Ví'
                            : 'Gói tập'}
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          {tx.type === 'booking' && tx.bookingCount && tx.bookingCount > 1 && tx.payment_status === 'paid' && (
                            <button onClick={() => handleViewBatchBookings(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              Xem {tx.bookingCount} buổi
                            </button>
                          )}
                          {(tx.payment_status === 'pending' || tx.payment_status === 'chờ thanh toán') && (
                            <button onClick={() => handleContinuePayment(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold">
                              <CreditCard className="w-3.5 h-3.5" />
                              Tiếp tục thanh toán
                            </button>
                          )}
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
