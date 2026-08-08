import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getApiUrl, getAuthHeaders, useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/Pagination';
import { Loader2, Calendar, CreditCard, Search, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

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
  vnpay_txn_ref?: string;
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
  vnpay_txn_ref?: string;
  vnpay_bank_code?: string;
  vnpay_bank_tran_no?: string;
  vnpay_card_type?: string;
  vnpay_transaction_no?: string;
  balanceAfter?: number;
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
  'completed': { label: 'Thành công', className: 'bg-green-100 text-green-700' },
  'chờ thanh toán': { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  'pending': { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  'đã hủy': { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700' },
  'cancelled': { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700' },
  'failed': { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
  'thất bại': { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
};

const typeFilterOptions = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'package', label: 'Gói tập' },
  { value: 'booking', label: 'Đặt lịch' },
  { value: 'topup', label: 'Nạp tiền ví' },
  { value: 'payment', label: 'Thanh toán ví' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'withdraw', label: 'Rút tiền' },
];

const statusFilterOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'success', label: 'Thành công' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'failed', label: 'Thất bại' },
];

export function TransactionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      fetch(`${getApiUrl()}/api/wallet/transactions`, { headers: getAuthHeaders() }),
      fetch(`${getApiUrl()}/api/wallet/balance`, { headers: getAuthHeaders() })
    ])
      .then(([pkgRes, bookingRes, walletRes, balanceRes]) =>
        Promise.all([pkgRes.json(), bookingRes.json(), walletRes.json(), balanceRes.json()]))
      .then(([pkgData, bookingData, walletData, balanceData]) => {
        const list: Transaction[] = [];
        const bookingRawList: any[] = [];

        if (balanceData && typeof balanceData.balance === 'number') {
          setWalletBalance(balanceData.balance);
        }

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
              vnpay_txn_ref: b.vnpay_txn_ref,
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
              vnpay_txn_ref: batch.find(b => b.vnpay_txn_ref)?.vnpay_txn_ref || '',
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
              vnpay_txn_ref: b.vnpay_txn_ref,
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
            const txType = tx.type;
            let name = tx.description || '';
            let method = 'wallet';
            const walletStatus = tx.status === 'completed' ? 'paid' : tx.status === 'failed' ? 'failed' : 'chờ thanh toán';
            if (txType === 'topup') { name = name || 'Nạp tiền ví'; method = 'vnpay'; }
            else if (txType === 'payment') { name = name || 'Thanh toán ví'; method = 'wallet'; }
            else if (txType === 'refund') { name = name || 'Hoàn tiền'; method = 'wallet'; }
            else if (txType === 'withdraw') { name = name || 'Rút tiền'; method = 'wallet'; }
            list.push({
              _id: `wallet_${tx._id}`,
              type: 'wallet',
              walletSubType: txType,
              name,
              total_price: Math.abs(tx.amount || 0),
              payment_method: method,
              payment_status: walletStatus,
              createdAt: tx.createdAt || '',
              vnpay_txn_ref: tx.vnpayTxnRef,
              vnpay_bank_code: tx.vnpayBankCode,
              vnpay_bank_tran_no: tx.vnpayBankTranNo,
              vnpay_card_type: tx.vnpayCardType,
              vnpay_transaction_no: tx.vnpayTransactionNo,
              balanceAfter: tx.balanceAfter,
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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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

  const getTransactionCode = (tx: Transaction) =>
    tx.vnpay_transaction_no || tx.vnpay_txn_ref || '';

  const isIncome = (tx: Transaction) =>
    tx.type === 'wallet' && (tx.walletSubType === 'topup' || tx.walletSubType === 'refund');

  const matchesType = (tx: Transaction) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'package') return tx.type === 'package';
    if (typeFilter === 'booking') return tx.type === 'booking';
    if (typeFilter === 'topup') return tx.type === 'wallet' && tx.walletSubType === 'topup';
    if (typeFilter === 'payment') return tx.type === 'wallet' && tx.walletSubType === 'payment';
    if (typeFilter === 'refund') return tx.type === 'wallet' && tx.walletSubType === 'refund';
    if (typeFilter === 'withdraw') return tx.type === 'wallet' && tx.walletSubType === 'withdraw';
    return true;
  };

  const matchesStatus = (tx: Transaction) => {
    const s = (tx.payment_status || '').toLowerCase();
    if (statusFilter === 'all') return true;
    if (statusFilter === 'success') return s === 'paid' || s === 'đã thanh toán' || s === 'completed';
    if (statusFilter === 'pending') return s === 'pending' || s === 'chờ thanh toán';
    if (statusFilter === 'cancelled') return s === 'cancelled' || s === 'đã hủy';
    if (statusFilter === 'failed') return s === 'failed' || s === 'thất bại';
    return true;
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter, summaryFilter]);

  const baseFiltered = transactions.filter((tx) => {
    const text = [tx.name, tx.package_id?.name, tx.vnpay_transaction_no, tx.vnpay_txn_ref, tx.disciplineName, tx.trainerName]
      .filter(Boolean).join(' ').toLowerCase();
    const kw = searchTerm.trim().toLowerCase();
    return (!kw || text.includes(kw)) && matchesType(tx) && matchesStatus(tx);
  });

  const filtered = summaryFilter === 'income'
    ? baseFiltered.filter(isIncome)
    : summaryFilter === 'expense'
      ? baseFiltered.filter(tx => !isIncome(tx))
      : baseFiltered;

  const incomeTotal = baseFiltered.reduce((sum, tx) => sum + (isIncome(tx) ? tx.total_price : 0), 0);
  const expenseTotal = baseFiltered.reduce((sum, tx) => sum + (isIncome(tx) ? 0 : tx.total_price), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Số dư ví hiện tại</p>
              <p className="text-2xl font-bold text-emerald-600">{formatPrice(walletBalance)}</p>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSummaryFilter(summaryFilter === 'income' ? 'all' : 'income')}
            className={`cursor-pointer bg-white rounded-2xl shadow-sm border p-5 flex items-center gap-4 transition-all ${
              summaryFilter === 'income' ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-100 hover:border-green-300'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng thu (hoàn tiền + nạp tiền)</p>
              <p className="text-2xl font-bold text-green-600">+{formatPrice(incomeTotal)}</p>
              {summaryFilter === 'income' && <p className="text-xs text-green-600 font-medium mt-0.5">Đang lọc giao dịch thu</p>}
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSummaryFilter(summaryFilter === 'expense' ? 'all' : 'expense')}
            className={`cursor-pointer bg-white rounded-2xl shadow-sm border p-5 flex items-center gap-4 transition-all ${
              summaryFilter === 'expense' ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-100 hover:border-red-300'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng chi (đặt lịch, gói tập, thanh toán ví)</p>
              <p className="text-2xl font-bold text-red-600">-{formatPrice(expenseTotal)}</p>
              {summaryFilter === 'expense' && <p className="text-xs text-red-600 font-medium mt-0.5">Đang lọc giao dịch chi</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 border-b border-slate-200">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo nội dung, mã giao dịch..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {typeFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {statusFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Ngày giờ</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Nội dung</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Loại</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Số tiền</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Số dư sau GD</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Phương thức</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Ngân hàng</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Mã giao dịch</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Trạng thái</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      {filtered.length === 0 ? 'Chưa có giao dịch nào' : 'Không tìm thấy giao dịch phù hợp'}
                    </td>
                  </tr>
                ) : (
                  pageItems.map((tx) => {
                    const status = getStatusInfo(tx.payment_status);
                    const income = isIncome(tx);
                    const code = getTransactionCode(tx);
                    return (
                      <tr key={`${tx.type}-${tx._id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          <p className="text-slate-900 font-medium">{formatDate(tx.createdAt)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatTime(tx.createdAt)}</p>
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
                          ) : tx.type === 'package' && (tx.start_date || tx.end_date || tx.duration_months) ? (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tx.duration_months ? `${tx.duration_months} tháng` : ''}
                              {tx.start_date && tx.end_date ? ` · ${formatDate(tx.start_date)} → ${formatDate(tx.end_date)}` : tx.start_date ? ` · từ ${formatDate(tx.start_date)}` : ''}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {tx.type === 'booking' ? 'Đặt lịch' : tx.type === 'wallet'
                            ? tx.walletSubType === 'payment' ? 'Thanh toán'
                              : tx.walletSubType === 'refund' ? 'Hoàn tiền'
                              : tx.walletSubType === 'topup' ? 'Nạp tiền'
                              : tx.walletSubType === 'withdraw' ? 'Rút tiền'
                              : 'Ví'
                            : 'Gói tập'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-semibold whitespace-nowrap ${income ? 'text-green-600' : 'text-red-600'}`}>
                            {income ? '+' : '-'}{formatPrice(tx.total_price)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {tx.type === 'wallet' && tx.balanceAfter != null ? formatPrice(tx.balanceAfter) : '---'}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {getMethodLabel(tx.payment_method)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap max-w-[160px] truncate" title={getBankInfo(tx)}>
                          {getBankInfo(tx)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap max-w-[180px] truncate" title={code}>
                          {code || '---'}
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
                          {tx.type !== 'wallet' && (tx.payment_status === 'pending' || tx.payment_status === 'chờ thanh toán') && (
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

          <Pagination page={page} totalPages={totalPages} total={filtered.length} limit={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </DashboardLayout>
  );
}
