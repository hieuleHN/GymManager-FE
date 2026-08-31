import { AdminLayout } from '../../components/AdminLayout';
import { Search, Eye, X, Loader2, Package, Phone, Calendar, Clock, Bell, Send, RefreshCw, Mail, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { Button } from '@mui/material';

interface AlertItem {
  _id: string;
  customer: any;
  packageName: string;
  packageId?: string;
  disciplineName?: string;
  disciplineId?: string;
  end_date: string;
  daysLeft?: number;
  daysOverdue?: number;
  total_price: number;
}

export function ExpiredCustomers() {
  const { selectedClub } = useClub();
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueFilter, setOverdueFilter] = useState<'all' | '7' | '30' | '90'>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState<AlertItem[]>([]);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [renewTarget, setRenewTarget] = useState<AlertItem | null>(null);
  const [renewPkgDetail, setRenewPkgDetail] = useState<any>(null);
  const [renewDuration, setRenewDuration] = useState<{ months: number; discount: number } | null>(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const backendUrl = getApiUrl() || 'http://localhost:5000';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '';
      const res = await fetch(`${getApiUrl()}/api/customers/alerts${base}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu');
      setExpired(data.expired || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplines = async () => {
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}&limit=100` : '?limit=100';
      const res = await fetch(`${getApiUrl()}/api/disciplines${base}`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setDisciplines(list);
    } catch {}
  };

  useEffect(() => { fetchAlerts(); setSelectedIds(new Set()); setDisciplineFilter('all'); }, [selectedClub]);
  useEffect(() => { fetchDisciplines(); }, [selectedClub]);

  const filtered = expired.filter(item => {
    const c = item.customer || {};
    const matchSearch = (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    const overdue = item.daysOverdue || 0;
    if (overdueFilter === '7' && overdue > 7) return false;
    if (overdueFilter === '30' && (overdue <= 7 || overdue > 30)) return false;
    if (overdueFilter === '90' && overdue <= 30) return false;
    if (disciplineFilter !== 'all') {
      const dId = String(item.disciplineId || '');
      const dName = String(item.disciplineName || '');
      if (dId !== disciplineFilter && dName !== disciplineFilter) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(x => x._id)));
  };

  const handleSingleRemind = async (item: AlertItem) => {
    if (!confirm(`Gửi nhắc gia hạn cho ${item.customer?.fullName} - ${item.packageName}?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/renewal-reminders/send`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationIds: [item._id] })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Gửi thất bại');
      toast.success(d.message || 'Đã gửi nhắc gia hạn');
    } catch (e:any) { toast.error(e.message); }
  };

  const handleBulkRemind = async () => {
    if (!selectedIds.size) { toast.error('Chọn ít nhất 1 khách'); return; }
    if (!confirm(`Gửi nhắc gia hạn cho ${selectedIds.size} khách đã chọn? (chống spam 24h)`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/renewal-reminders/send`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationIds: Array.from(selectedIds) })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Gửi thất bại');
      toast.success(d.message || `Đã gửi ${selectedIds.size} nhắc`); setSelectedIds(new Set());
    } catch (e:any) { toast.error(e.message); }
  };

  const openRenewModal = async (item: AlertItem) => {
    setRenewTarget(item);
    setRenewPkgDetail(null); setRenewDuration(null);
    try {
      const pid = item.packageId;
      if (!pid) { toast.error('Không tìm thấy mã gói'); return; }
      const res = await fetch(`${getApiUrl()}/api/packages/${pid}`, { headers: getAuthHeaders() as any });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Không tải được gói');
      setRenewPkgDetail(data);
      if (data.durations?.length) setRenewDuration(data.durations[0]);
      else setRenewDuration({ months: 1, discount: 0 });
    } catch (e:any) { toast.error(e.message); }
  };

  const handleRenewConfirm = async () => {
    if (!renewTarget || !renewDuration) return;
    const customerId = renewTarget.customer?._id || renewTarget.customer;
    if (!customerId) { toast.error('Thiếu mã khách'); return; }
    setRenewSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/user-packages/admin-renew`, {
        method: 'POST', headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: String(customerId), registrationId: renewTarget._id, duration_months: renewDuration.months })
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Gia hạn thất bại');
      toast.success(`Đã gia hạn ${renewDuration.months} tháng`);
      setRenewTarget(null); setRenewPkgDetail(null);
      fetchAlerts();
    } catch (e:any) { toast.error(e.message); } finally { setRenewSubmitting(false); }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Khách hàng hết hạn</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý khách đã hết hạn gói tập • gia hạn trực tiếp • lọc theo bộ môn</p>
          </div>
          <Button variant="outlined" onClick={fetchAlerts} startIcon={<RefreshCw className="w-4 h-4" />} sx={{ textTransform:'none', borderRadius:2, borderColor:'#e2e8f0', color:'#475569', bgcolor:'white' }}>Làm mới</Button>
        </div>

        {/* Bộ lọc gọn - tìm kiếm + quá hạn + bộ môn */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Tìm tên, tài khoản, SĐT, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
            </div>
            <select value={overdueFilter} onChange={e=>setOverdueFilter(e.target.value as any)} className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 min-w-[160px]">
              <option value="all">Tất cả thời gian</option>
              <option value="7">Quá hạn &lt;7 ngày</option>
              <option value="30">Quá hạn 7-30 ngày</option>
              <option value="90">Quá hạn &gt;30 ngày</option>
            </select>
            <select value={disciplineFilter} onChange={e=>setDisciplineFilter(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 min-w-[180px]">
              <option value="all">Tất cả bộ môn</option>
              {disciplines.map((d:any)=>(
                <option key={d._id} value={String(d._id)}>{d.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-3">Hiển thị {filtered.length}/{expired.length} khách • {disciplineFilter!=='all' ? `bộ môn: ${disciplines.find((d:any)=>String(d._id)===disciplineFilter)?.name || disciplineFilter} • ` : ''}sắp xếp quá hạn mới nhất</p>
        </div>

        {selectedIds.size>0 && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Đã chọn {selectedIds.size}</span>
            <button onClick={handleBulkRemind} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> Gửi nhắc gia hạn</button>
            <button onClick={()=>setSelectedIds(new Set())} className="ml-auto px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">Bỏ chọn</button>
          </div>
        )}

        {/* Bảng - giao diện dễ nhìn, không loè loẹt */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left">
                    <th className="px-3 py-3 w-10"><input type="checkbox" checked={selectedIds.size===filtered.length && filtered.length>0} onChange={toggleSelectAll} className="rounded border-slate-300" /></th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Khách hàng</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Liên hệ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Gói tập</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Ngày hết hạn</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Quá hạn</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, idx) => {
                    const c = item.customer || {};
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(item._id)} onChange={()=>toggleSelect(item._id)} className="rounded border-slate-300" /></td>
                        <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{c.fullName || '-'}</p>
                            <p className="text-xs text-slate-500 truncate">{c.account || ''} {c.gender ? `• ${c.gender}` : ''}</p>
                            {c.address && <p className="text-xs text-slate-400 truncate max-w-[200px] flex items-center gap-1"><MapPin className="w-3 h-3"/>{c.address}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/>{c.phone || '-'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5 text-slate-400"/>{c.email || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{item.packageName}</p>
                          {item.disciplineName && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">{item.disciplineName}</span>}
                          <p className="text-xs text-slate-400 mt-1">{item.total_price?.toLocaleString('vi-VN')}đ</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400"/>{new Date(item.end_date).toLocaleDateString('vi-VN')}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400"/> Quá {item.daysOverdue} ngày
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setSelected(item)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                            <button onClick={()=>openRenewModal(item)} className="px-2.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800" title="Gia hạn">Gia hạn</button>
                            <button onClick={()=>handleSingleRemind(item)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200" title="Gửi nhắc"><Bell className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length===0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Không có khách hàng phù hợp bộ lọc</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chi tiết - đầy đủ thông tin */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Chi tiết khách hết hạn</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Khách hàng</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{selected.customer?.fullName} • {selected.customer?.account}</p>
                  <p className="text-sm text-slate-600 mt-1 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5"/>{selected.customer?.phone || '-'}</span>
                    <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5"/>{selected.customer?.email || '-'}</span>
                    {selected.customer?.gender && <span>• {selected.customer.gender}</span>}
                  </p>
                  {selected.customer?.address && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>{selected.customer.address}</p>}
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gói tập</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{selected.packageName} {selected.disciplineName && <span className="ml-2 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600">{selected.disciplineName}</span>}</p>
                  <p className="text-sm text-slate-600 mt-1">{selected.total_price?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thời gian</p>
                  <p className="text-sm text-slate-900 mt-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400"/> Hết hạn {new Date(selected.end_date).toLocaleDateString('vi-VN')} <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">Quá {selected.daysOverdue} ngày</span></p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-sm">Đóng</button>
                <button onClick={() => { const it = selected; setSelected(null); if(it) openRenewModal(it); }} className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 text-sm">Gia hạn ngay</button>
              </div>
            </div>
          </div>
        )}

        {/* Gia hạn - chọn kỳ hạn từ bảng giá, không loè loẹt */}
        {renewTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200" onClick={(e)=>e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Gia hạn gói tập</h2>
                  <p className="text-xs text-slate-500 mt-1">Khách <b className="text-slate-800">{renewTarget.customer?.fullName}</b> • {renewTarget.packageName} {renewTarget.disciplineName && `• ${renewTarget.disciplineName}`} • Quá {renewTarget.daysOverdue} ngày</p>
                </div>
                <button onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!renewPkgDetail ? (
                  <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải bảng giá...</p>
                ) : (renewPkgDetail.durations?.length ? (
                  <>
                    <h3 className="text-sm font-semibold text-slate-900">Chọn kỳ hạn</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {renewPkgDetail.durations.map((d:any, idx:number)=>{
                        const isSel = renewDuration?.months===d.months && renewDuration?.discount===d.discount;
                        const unit = renewPkgDetail.unitPrice || 0;
                        const total = unit * d.months * (1 - (d.discount||0)/100);
                        return (
                          <button key={idx} onClick={()=>setRenewDuration(d)} className={`p-4 rounded-xl border text-left ${isSel ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <p className="text-sm font-bold text-slate-900">{d.months} tháng</p>
                            <p className="text-base font-bold text-slate-900 mt-1">{total.toLocaleString('vi-VN')}đ</p>
                            {d.discount>0 && <span className="inline-block mt-1 px-2 py-0.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">-{d.discount}%</span>}
                          </button>
                        );
                      })}
                    </div>
                    {renewDuration && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between text-sm text-slate-600"><span>Tạm tính</span><span>{(renewPkgDetail.unitPrice*renewDuration.months).toLocaleString('vi-VN')}đ</span></div>
                        <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center"><span className="text-sm font-semibold text-slate-900">Tổng tiền</span><span className="text-base font-bold text-slate-900">{(renewPkgDetail.unitPrice*renewDuration.months*(1-(renewDuration.discount||0)/100)).toLocaleString('vi-VN')}đ</span></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 border border-slate-200 rounded-xl text-center bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">{renewPkgDetail.name}</p>
                    <p className="text-base font-bold text-slate-900 mt-1">{(renewPkgDetail.unitPrice||0).toLocaleString('vi-VN')}đ / tháng</p>
                    <button onClick={()=>setRenewDuration({ months: 1, discount: 0 })} className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold border ${renewDuration ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}>Chọn 1 tháng</button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 flex gap-3 bg-white">
                <Button variant="outlined" onClick={()=>{ setRenewTarget(null); setRenewPkgDetail(null); }} sx={{flex:1, textTransform:'none', borderRadius:2, borderColor:'#e2e8f0', color:'#475569'}}>Hủy</Button>
                <Button variant="contained" disabled={!renewDuration || renewSubmitting} onClick={handleRenewConfirm} sx={{flex:1, bgcolor:'#0f172a', '&:hover':{bgcolor:'#1e293b'}, textTransform:'none', borderRadius:2}}>{renewSubmitting ? 'Đang xử lý...' : `Gia hạn ${renewDuration?`${renewDuration.months} tháng`:''}`}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
