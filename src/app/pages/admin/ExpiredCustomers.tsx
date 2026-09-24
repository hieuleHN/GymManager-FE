import { AdminLayout } from '../../components/AdminLayout';
import { Search, X, RefreshCw, Clock, Bell } from 'lucide-react';
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

interface PackageOption {
  _id: string;
  name: string;
  unitPrice: number;
  durations?: { months: number; discount: number }[];
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
  features?: string[];
}

const formatVnd = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + 'đ';
const formatDate = (s?: string) => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');

export function ExpiredCustomers() {
  const headers = getAuthHeaders();
  const { selectedClub } = useClub();

  const [searchTerm, setSearchTerm] = useState('');

  // Khách hết hạn / sắp hết hạn
  const [rows, setRows] = useState<ExpiringRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [withinDays, setWithinDays] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Bộ lọc bổ sung (kế thừa từ main): quá hạn + bộ môn
  const [overdueFilter, setOverdueFilter] = useState<'all' | '7' | '30' | '90'>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [pkgDisciplineMap, setPkgDisciplineMap] = useState<Record<string, string[]>>({});

  // Modal gia hạn
  const [renewTarget, setRenewTarget] = useState<ExpiringRow | null>(null);
  const [renewPkg, setRenewPkg] = useState<PackageOption | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [months, setMonths] = useState(1);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPkg, setLoadingPkg] = useState(false);

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

  useEffect(() => {
    fetchExpiring(withinDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub, withinDays]);

  // Tải danh sách bộ môn + ánh xạ tên gói -> bộ môn (cho bộ lọc bộ môn)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const discRes = await fetch(`${getApiUrl()}/api/disciplines?limit=100`, { headers: headers as any });
        const discData = await discRes.json();
        const discList = Array.isArray(discData) ? discData : (discData.data || []);
        if (!cancelled) setDisciplines(discList);

        const pkgRes = await fetch(`${getApiUrl()}/api/packages?page=1&limit=100`, { headers: headers as any });
        const pkgData = await pkgRes.json();
        const pkgList = Array.isArray(pkgData) ? pkgData : (pkgData.data || []);
        const map: Record<string, string[]> = {};
        pkgList.forEach((p: any) => {
          const names: string[] = [];
          if (p?.disciplineId?.name) names.push(p.disciplineId.name);
          (p?.disciplines || []).forEach((d: any) => {
            const n = d?.name || d;
            if (n && !names.includes(n)) names.push(n);
          });
          if (p?.name && names.length > 0) map[p.name] = names;
        });
        if (!cancelled) setPkgDisciplineMap(map);
      } catch {}
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub]);

  // Mở modal gia hạn: tải đúng gói tập hiện tại của khách (kèm bảng thời gian + giá)
  const openRenewModal = async (row: ExpiringRow) => {
    setRenewTarget(row);
    setRenewPkg(null);
    setSelectedPkgId('');
    setMonths(1);
    setPreviewTotal(null);
    setLoadingPkg(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/${row._id}`, { headers: headers as any });
      const reg = await res.json();
      if (!res.ok) throw new Error(reg.error || 'Không tải được thông tin gói');
      const pkg = reg.package_id || null;
      if (!pkg || !pkg._id) throw new Error('Hợp đồng này không còn thông tin gói tập');
      setRenewPkg({
        _id: pkg._id,
        name: pkg.name,
        unitPrice: pkg.unitPrice,
        durations: pkg.durations || [],
        ptSessionsPerMonth: pkg.ptSessionsPerMonth,
        isFullMonth: pkg.isFullMonth,
        features: pkg.features || [],
      });
      setSelectedPkgId(pkg._id);
      const firstMonths = pkg.durations?.[0]?.months || 1;
      setMonths(firstMonths);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải thông tin gói tập');
    } finally {
      setLoadingPkg(false);
    }
  };

  // Thành tiền từng mốc thời gian (cùng công thức server: unitPrice * tháng * (1 - giảm%), làm tròn nghìn)
  const tierTotal = (unitPrice: number, m: number, discount: number) =>
    Math.round((unitPrice * m * (1 - discount / 100)) / 1000) * 1000;

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

  // Gia hạn thẳng: tạo phiếu rồi duyệt luôn để gói có hiệu lực ngay
  const handleRenewNow = async () => {
    if (!renewTarget || !selectedPkgId) return;
    setSubmitting(true);
    try {
      const createRes = await fetch(`${getApiUrl()}/api/user-packages/admin-renew`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({
          customerId: renewTarget.customer._id,
          registrationId: renewTarget._id,
          package_id: selectedPkgId,
          duration_months: months,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || 'Gia hạn thất bại');
      const ticketId = created.data?._id;
      if (!ticketId) throw new Error('Không nhận được phiếu gia hạn từ server');
      const approveRes = await fetch(`${getApiUrl()}/api/user-packages/${ticketId}/approve`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' } as any,
        body: JSON.stringify({ action: 'approve' }),
      });
      const approved = await approveRes.json();
      if (!approveRes.ok) throw new Error(approved.error || 'Duyệt gia hạn thất bại');
      toast.success('Đã gia hạn thành công! Gói của khách có hiệu lực ngay.');
      setRenewTarget(null);
      fetchExpiring();
    } catch (err: any) {
      toast.error(err.message || 'Gia hạn thất bại');
    } finally {
      setSubmitting(false);
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
  }).filter((r) => {
    // Lọc theo mức quá hạn (remaining_days <= 0 là đã hết hạn)
    const daysOverdue = Math.max(0, -(r.remaining_days || 0));
    if (overdueFilter === '7' && daysOverdue > 7) return false;
    if (overdueFilter === '30' && (daysOverdue <= 7 || daysOverdue > 30)) return false;
    if (overdueFilter === '90' && daysOverdue <= 30) return false;
    return true;
  }).filter((r) => {
    // Lọc theo bộ môn (ánh xạ từ tên gói -> bộ môn)
    if (disciplineFilter === 'all') return true;
    const discNames = pkgDisciplineMap[r.packageName || ''] || [];
    if (discNames.includes(disciplineFilter)) return true;
    const chosen = disciplines.find((d: any) => String(d._id) === disciplineFilter);
    return chosen ? discNames.includes(chosen.name) : false;
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gia hạn hộ hội viên</h1>
          <p className="text-slate-600">
            Gia hạn trực tiếp cho khách sắp hết hạn / đã hết hạn — gói có hiệu lực ngay, không cần duyệt.
            Hội viên còn hạn sẽ được nối tiếp từ ngày hết hạn cũ, không mất ngày.
            Bấm <strong>Gửi nhắc tất cả</strong> (hoặc tick chọn khách rồi bấm Gửi nhắc) để hội viên nhận thông báo —
            mỗi khách chỉ nhận nhắc 1 lần trong 24 giờ.
          </p>
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên / tài khoản / SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
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
          <select
            value={overdueFilter}
            onChange={(e) => setOverdueFilter(e.target.value as any)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm"
            title="Lọc theo mức quá hạn"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="7">Quá hạn &lt;7 ngày</option>
            <option value="30">Quá hạn 7-30 ngày</option>
            <option value="90">Quá hạn &gt;30 ngày</option>
          </select>
          {disciplines.length > 0 && (
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm"
              title="Lọc theo bộ môn"
            >
              <option value="all">Tất cả bộ môn</option>
              {disciplines.map((d: any) => (
                <option key={d._id} value={String(d._id)}>{d.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => fetchExpiring()}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          {!loadingRows && filteredRows.length > 0 && (
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

        {/* Bảng khách hết hạn */}
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
                            Gia hạn
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        {/* Modal gia hạn */}
        {renewTarget && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setRenewTarget(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Gia hạn gói tập</h2>
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

                {loadingPkg ? (
                  <div className="p-6 text-center text-sm text-slate-500">Đang tải thông tin gói...</div>
                ) : !renewPkg ? (
                  <div className="p-6 text-center text-sm text-red-500">Không tải được thông tin gói tập của khách.</div>
                ) : (
                  <>
                    <div className="border border-slate-200 rounded-xl p-3 text-sm space-y-1">
                      <p className="font-bold text-slate-900">{renewPkg.name}</p>
                      <p className="text-slate-600">Giá: <b className="text-indigo-600">{formatVnd(renewPkg.unitPrice)}/tháng</b></p>
                      <p className="text-slate-600">
                        HLV: <b>{renewPkg.isFullMonth ? 'Không giới hạn' : `${renewPkg.ptSessionsPerMonth || 0} buổi/tháng`}</b>
                      </p>
                      {(renewPkg.features || []).length > 0 && (
                        <p className="text-xs text-slate-500">{(renewPkg.features || []).slice(0, 3).join(' • ')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Thời gian gia hạn</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(renewPkg.durations && renewPkg.durations.length > 0 ? renewPkg.durations : [{ months: 1, discount: 0 }, { months: 3, discount: 0 }, { months: 6, discount: 0 }, { months: 12, discount: 0 }]).map((d) => (
                          <button
                            key={d.months}
                            onClick={() => setMonths(d.months)}
                            className={`p-2.5 rounded-xl border-2 text-sm transition-all text-left ${
                              months === d.months
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-bold">{d.months} tháng</span>
                            {d.discount > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full">-{d.discount}%</span>
                            )}
                            <span className="block mt-0.5 font-semibold text-indigo-600">
                              {formatVnd(tierTotal(renewPkg.unitPrice, d.months, d.discount || 0))}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const now = new Date();
                      const oldEnd = renewTarget.end_date ? new Date(renewTarget.end_date) : now;
                      const start = oldEnd > now ? oldEnd : now;
                      const end = new Date(start);
                      end.setMonth(end.getMonth() + months);
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Hiệu lực mới</span>
                            <b>{formatDate(start.toISOString())} → {formatDate(end.toISOString())}</b>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Thành tiền:</span>
                      <span className="font-bold text-indigo-700">
                        {previewTotal !== null ? formatVnd(previewTotal) : '...'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t flex gap-3">
                <button
                  onClick={() => setRenewTarget(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-sm text-slate-600 hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRenewNow}
                  disabled={!selectedPkgId || submitting || loadingPkg || !renewPkg}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang gia hạn...' : 'Gia hạn'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
