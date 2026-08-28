import { AdminLayout } from '../../components/AdminLayout';
import { Search, X, RefreshCw, CheckCircle, XCircle, FileText, Clock, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { toast } from 'sonner';

interface ExpiringRow {
  _id: string;
  customer: {
    _id?: string;
    fullName?: string;
    account?: string;
    phone?: string;
    email?: string;
  };
  packageName?: string;
  start_date?: string;
  end_date?: string;
  remaining_days: number;
  last_renewal_reminder_at?: string;
}

interface RenewalTicket {
  _id: string;
  customer_id?: { fullName?: string; account?: string; phone?: string };
  package_id?: { name?: string; unitPrice?: number };
  original_registration_id?: { end_date?: string } | null;
  duration_months: number;
  total_price: number;
  start_date?: string;
  end_date?: string;
  status: string;
  renewal_note?: string;
  createdAt: string;
}

interface PackageOption {
  _id: string;
  name: string;
  unitPrice: number;
}

const formatVnd = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + 'đ';
const formatDate = (s?: string) => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');

export function ExpiredCustomers() {
  const headers = getAuthHeaders();
  const { selectedClub } = useClub();

  const [tab, setTab] = useState<'expiring' | 'tickets'>('expiring');
  const [searchTerm, setSearchTerm] = useState('');

  // Tab khách hết hạn / sắp hết hạn
  const [rows, setRows] = useState<ExpiringRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [withinDays, setWithinDays] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Tab phiếu gia hạn
  const [tickets, setTickets] = useState<RenewalTicket[]>([]);
  const [ticketStatus, setTicketStatus] = useState('chờ xác nhận');
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Modal tạo phiếu
  const [renewTarget, setRenewTarget] = useState<ExpiringRow | null>(null);
  const [pkgOptions, setPkgOptions] = useState<PackageOption[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [months, setMonths] = useState(1);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchExpiring = async (days = withinDays) => {
    setLoadingRows(true);
    setSelectedIds([]);
    try {
      let url = `${getApiUrl()}/api/user-packages/expiring?within_days=${days}&include_expired=true&page=1&limit=100`;
      if (selectedClub && selectedClub !== 'all') url += `&locationId=${selectedClub}`;
      const res = await fetch(url, { headers: headers as any });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách khách hết hạn');
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  // Gửi nhắc gia hạn.
  // - Đã tick chọn khách -> chỉ gửi cho đúng những người đó (registrationIds).
  // - Không tick ai -> gửi cho TẤT CẢ khách sắp hết hạn theo bộ lọc thời gian
  //   (body rỗng, BE tự lấy danh sách theo within_days + cơ sở đang chọn).
  // BE tự chống trùng: mỗi hợp đồng chỉ nhận nhắc 1 lần / 24 giờ.
  const handleBulkRemind = async () => {
    const ids = selectedIds;
    if (ids.length === 0 && filteredRows.length === 0) {
      toast.error('Không có khách nào để gửi nhắc.');
      return;
    }
    if (ids.length === 0) {
      const ok = confirm(
        `Gửi lời nhắc gia hạn cho TẤT CẢ ${filteredRows.length} khách đang hiển thị?\n` +
          '(Khách đã được nhắc trong 24h qua sẽ tự động được bỏ qua)',
      );
      if (!ok) return;
    }
    setSendingReminders(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/renewal-reminders/send`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify(ids.length ? { registrationIds: ids } : {}),
      });
      const raw = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server trả về phản hồi không hợp lệ (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || 'Gửi nhắc thất bại');
      if (data.sent > 0) {
        toast.success(
          `Đã gửi nhắc gia hạn cho ${data.sent} hội viên` +
            (data.skippedCount > 0 ? `, bỏ qua ${data.skippedCount} khách đã được nhắc trong 24h qua.` : '.'),
        );
      } else {
        toast.warning('Không có ai cần nhắc: tất cả khách đều đã nhận lời nhắc trong 24h qua.');
      }
      setSelectedIds([]);
      fetchExpiring();
    } catch (err: any) {
      toast.error(err.message || 'Gửi nhắc thất bại');
    } finally {
      setSendingReminders(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const url = `${getApiUrl()}/api/user-packages/renewal-tickets?page=1&limit=50${ticketStatus !== 'all' ? `&status=${encodeURIComponent(ticketStatus)}` : ''}`;
      const res = await fetch(url, { headers: headers as any });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách phiếu gia hạn');
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (tab === 'expiring') fetchExpiring(withinDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedClub, withinDays]);

  useEffect(() => {
    if (tab === 'tickets') fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ticketStatus]);

  // Mở modal tạo phiếu: tải gói đang bán
  const openRenewModal = async (row: ExpiringRow) => {
    setRenewTarget(row);
    setSelectedPkgId('');
    setMonths(1);
    setPreviewTotal(null);
    setNote('');
    try {
      const res = await fetch(`${getApiUrl()}/api/packages?page=1&limit=50`, { headers: headers as any });
      const data = await res.json();
      const onSale = (data.data || []).filter(
        (p: any) => !p.lifecycle_status || p.lifecycle_status === 'đang bán',
      );
      setPkgOptions(onSale);
      if (onSale.length > 0) setSelectedPkgId(onSale[0]._id);
    } catch {
      toast.error('Không thể tải danh sách gói tập');
    }
  };

  // Giá xem trước do server tính theo bảng giá hiện hành
  useEffect(() => {
    if (!renewTarget || !selectedPkgId || !months) return;
    let active = true;
    setPreviewTotal(null);
    fetch(`${getApiUrl()}/api/packages/preview-price`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' } as any,
      body: JSON.stringify({ package_id: selectedPkgId, months }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (active && typeof d.total_price === 'number') setPreviewTotal(d.total_price);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renewTarget, selectedPkgId, months]);

  const handleCreateTicket = async () => {
    if (!renewTarget || !selectedPkgId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/admin-renew`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({
          customerId: renewTarget.customer._id,
          registrationId: renewTarget._id,
          package_id: selectedPkgId,
          duration_months: months,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo phiếu thất bại');
      toast.success('Đã tạo phiếu gia hạn! Vào tab "Phiếu chờ xác nhận" để duyệt.');
      setRenewTarget(null);
      fetchExpiring();
    } catch (err: any) {
      toast.error(err.message || 'Tạo phiếu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTicketAction = async (ticket: RenewalTicket, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('Từ chối phiếu gia hạn này?')) return;
    setActingId(ticket._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/${ticket._id}/approve`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại');
      toast.success(action === 'approve' ? 'Đã duyệt! Gói của khách có hiệu lực ngay.' : 'Đã từ chối phiếu.');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally {
      setActingId(null);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.customer?.fullName?.toLowerCase().includes(q) ||
      r.customer?.account?.toLowerCase().includes(q) ||
      r.customer?.phone?.includes(searchTerm.trim())
    );
  });

  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.includes(r._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r) => r._id));
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.customer_id?.fullName?.toLowerCase().includes(q) ||
      t.customer_id?.account?.toLowerCase().includes(q) ||
      t.customer_id?.phone?.includes(searchTerm.trim())
    );
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gia hạn hộ hội viên</h1>
          <p className="text-slate-600">
            Tạo phiếu gia hạn cho khách sắp hết hạn / đã hết hạn, sau đó duyệt để kích hoạt.
            Hội viên còn hạn sẽ được nối tiếp từ ngày hết hạn cũ, không mất ngày.
            Bấm <strong>Gửi nhắc tất cả</strong> (hoặc tick chọn khách rồi bấm Gửi nhắc) để hội viên nhận thông báo —
            mỗi khách chỉ nhận nhắc 1 lần trong 24 giờ.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => { setTab('expiring'); setSearchTerm(''); setSelectedIds([]); }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === 'expiring'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Khách sắp hết hạn / hết hạn
          </button>
          <button
            onClick={() => { setTab('tickets'); setSearchTerm(''); setSelectedIds([]); }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              tab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Phiếu chờ xác nhận
          </button>
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={tab === 'expiring' ? 'Tìm theo tên / tài khoản / SĐT...' : 'Tìm theo tên / tài khoản / SĐT trên tab hiện tại...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          {tab === 'expiring' && (
            <select
              value={withinDays}
              onChange={(e) => setWithinDays(Number(e.target.value))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm"
            >
              <option value={10}>Sắp hết hạn trong 10 ngày</option>
              <option value={7}>Trong 7 ngày</option>
              <option value={15}>Trong 15 ngày</option>
              <option value={30}>Trong 30 ngày</option>
              <option value={60}>Trong 60 ngày</option>
            </select>
          )}
          {tab === 'tickets' && (
            <select
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm"
            >
              <option value="chờ xác nhận">Chờ xác nhận</option>
              <option value="đang hoạt động">Đã duyệt (đang hoạt động)</option>
              <option value="đã hủy">Đã từ chối / hủy</option>
              <option value="all">Tất cả</option>
            </select>
          )}
          <button
            onClick={() => (tab === 'expiring' ? fetchExpiring() : fetchTickets())}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          {tab === 'expiring' && !loadingRows && filteredRows.length > 0 && (
            <button
              onClick={handleBulkRemind}
              disabled={sendingReminders}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-colors text-sm font-semibold disabled:opacity-50 whitespace-nowrap ${
                selectedIds.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              {sendingReminders
                ? 'Đang gửi...'
                : selectedIds.length > 0
                  ? `Gửi nhắc gia hạn (${selectedIds.length})`
                  : 'Gửi nhắc tất cả'}
            </button>
          )}
        </div>

        {/* Tab: khách hết hạn */}
        {tab === 'expiring' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loadingRows ? (
              <div className="p-10 text-center text-slate-500">Đang tải...</div>
            ) : filteredRows.length === 0 ? (
              <div className="p-10 text-center text-slate-500">Không có khách nào sắp hết hạn / đã hết hạn.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Hội viên</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Liên hệ</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Gói đang dùng</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Hết hạn ngày</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Trạng thái</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-slate-700 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const expired = row.remaining_days <= 0;
                    const remindedRecently =
                      row.last_renewal_reminder_at &&
                      Date.now() - new Date(row.last_renewal_reminder_at).getTime() < 24 * 3600 * 1000;
                    return (
                      <tr key={row._id} className={`border-b border-slate-100 hover:bg-slate-50 ${selectedIds.includes(row._id) ? 'bg-indigo-50/60' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row._id)}
                            onChange={() => toggleSelect(row._id)}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{row.customer?.fullName || '—'}</p>
                          <p className="text-xs text-slate-400">@{row.customer?.account || '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          <p>{row.customer?.phone || '—'}</p>
                          <p className="text-slate-400">{row.customer?.email || ''}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700">{row.packageName || '—'}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{formatDate(row.end_date)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${expired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {expired ? `Quá hạn ${Math.abs(row.remaining_days)} ngày` : `Còn ${row.remaining_days} ngày`}
                          </span>
                          {remindedRecently && (
                            <span className="inline-flex items-center gap-1 mt-1 ml-0 sm:ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                              <Bell className="w-3 h-3" />
                              Đã nhắc {new Date(row.last_renewal_reminder_at!).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => openRenewModal(row)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Tạo phiếu gia hạn
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: phiếu gia hạn */}
        {tab === 'tickets' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loadingTickets ? (
              <div className="p-10 text-center text-slate-500">Đang tải...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-10 text-center text-slate-500">Không có phiếu nào ở trạng thái này.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Hội viên</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Gói / Thời hạn</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Số tiền</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Hiệu lực dự kiến</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Trạng thái</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-slate-700 uppercase">Duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{t.customer_id?.fullName || '—'}</p>
                        <p className="text-xs text-slate-400">{t.customer_id?.phone || `@${t.customer_id?.account || ''}`}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        <p>{t.package_id?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{t.duration_months} tháng</p>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-indigo-600">{formatVnd(t.total_price)}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {formatDate(t.start_date)} → {formatDate(t.end_date)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          t.status === 'chờ xác nhận'
                            ? 'bg-blue-100 text-blue-700'
                            : t.status === 'đã hủy'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {t.status === 'chờ xác nhận' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={actingId === t._id}
                              onClick={() => handleTicketAction(t, 'approve')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Duyệt
                            </button>
                            <button
                              disabled={actingId === t._id}
                              onClick={() => handleTicketAction(t, 'reject')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 block text-center">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal tạo phiếu gia hạn */}
        {renewTarget && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setRenewTarget(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Tạo phiếu gia hạn</h2>
                <button onClick={() => setRenewTarget(null)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-slate-800">{renewTarget.customer?.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gói hiện tại: {renewTarget.packageName || '—'} ·{' '}
                    {renewTarget.remaining_days <= 0
                      ? `đã hết hạn ${Math.abs(renewTarget.remaining_days)} ngày`
                      : `còn ${renewTarget.remaining_days} ngày`}
                  </p>
                  {renewTarget.remaining_days > 0 && (
                    <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Sẽ nối tiếp từ ngày hết hạn cũ ({formatDate(renewTarget.end_date)}) — không mất ngày còn lại
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gói tập (đang bán)</label>
                  <select
                    value={selectedPkgId}
                    onChange={(e) => setSelectedPkgId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {pkgOptions.length === 0 && <option value="">Không có gói đang bán</option>}
                    {pkgOptions.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} — {formatVnd(p.unitPrice)}/tháng
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tháng gia hạn</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          months === m
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {m} tháng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Thành tiền (giá hiện tại):</span>
                  <span className="font-bold text-indigo-700">
                    {previewTotal !== null ? formatVnd(previewTotal) : '...'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú (không bắt buộc)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="VD: khách đóng tiền mặt tại quầy..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Phiếu sẽ ở trạng thái <strong>"Chờ xác nhận"</strong> và chưa cộng thời gian.
                  Bấm <strong>Duyệt</strong> ở tab Phiếu chờ xác nhận để kích hoạt gói cho khách.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t flex gap-3">
                <button
                  onClick={() => setRenewTarget(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-sm text-slate-600 hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!selectedPkgId || submitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo phiếu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
