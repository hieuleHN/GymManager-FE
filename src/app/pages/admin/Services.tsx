import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Check, X, Loader2, Eye, EyeOff, Wallet, Coins, RefreshCw, FileText, User, Tag, MapPin, Calendar, MessageSquareWarning } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useClub } from '../../context/ClubContext';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVICE_STATUS_LABELS,
  ALL_SERVICE_KEYS,
  REFUND_SERVICE_KEYS,
  formatVND,
  ServiceKey
} from '../../../lib/serviceCatalog';

interface RequestItem {
  _id: string;
  customer_name: string;
  customer_phone?: string;
  service_type: string;
  description: string;
  status: string;
  amount?: number;
  payment_status?: string;
  payment_method?: string;
  refund_amount?: number;
  admin_note?: string;
  createdAt: string;
  location_id?: { _id: string; title?: string; address?: string } | null;
  data?: Record<string, any>;
  has_hlv_booking?: boolean;
}

interface ServiceFeeConfig {
  service_type: string;
  hasFee: boolean;
  fee: number;
}

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Lấy lý do từ trường reason trong data (nếu có), fallback: trích từ description
const extractReason = (request: RequestItem): string => {
  const dataReason = request.data?.reason;
  if (typeof dataReason === 'string' && dataReason.trim()) return dataReason.trim();
  const desc = request.description || '';
  const m = desc.match(/(?:Lý do|Ghi chú|Nội dung):\s*([\s\S]+)/i);
  return m ? m[1].trim() : '';
};

// Nội dung hiển thị ở bảng: bỏ phần "Lý do/...:" đi để chỉ còn nội dung chính
const extractContent = (request: RequestItem): string => {
  const desc = request.description || '';
  const cleaned = desc.replace(/\s*(?:Lý do|Ghi chú|Nội dung):[\s\S]*$/i, '').trim();
  return cleaned || '—';
};

const statusBadgeCls = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'awaiting_payment':
      return 'bg-violet-100 text-violet-700';
    case 'accepted':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

export function Services() {
  const { selectedClub, selectedClubName, clubs } = useClub();
  const headers = getAuthHeaders();

  const [tab, setTab] = useState<'requests' | 'visibility'>('requests');
  const [filter, setFilter] = useState<'pending' | 'awaiting_payment' | 'accepted' | 'rejected' | 'all'>('pending');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [enabled, setEnabled] = useState<ServiceKey[]>(ALL_SERVICE_KEYS);
  const [serviceFees, setServiceFees] = useState<ServiceFeeConfig[]>([]);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      params.set('limit', '100');
      const res = await fetch(`/api/service-requests?${params.toString()}`, { headers: headers as any });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRequests(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadVisibility = async () => {
    if (tab !== 'visibility') {
      setVisibilityLoaded(false);
      setEnabled(ALL_SERVICE_KEYS);
      setServiceFees([]);
      return;
    }
    setLoadingVisibility(true);
    try {
      if (selectedClub === 'all') {
        const clubIds = (clubs || []).map(c => c._id).filter(Boolean);
        const results = await Promise.all(
          clubIds.map(id => fetch(`/api/locations/${id}/services`).then(r => (r.ok ? r.json() : null)).catch(() => null))
        );
        const valid = results.filter(Boolean);
        if (valid.length === 0) {
          setEnabled(ALL_SERVICE_KEYS);
          setServiceFees([]);
        } else {
          const enabledUnion = new Set<string>();
          const feeMap = new Map<string, ServiceFeeConfig>();
          valid.forEach(data => {
            (data.enabledServices || []).forEach((s: string) => enabledUnion.add(s));
            (data.serviceFees || []).forEach((f: ServiceFeeConfig) => {
              const existing = feeMap.get(f.service_type);
              if (!existing) {
                feeMap.set(f.service_type, { ...f });
              } else if (existing.hasFee !== f.hasFee || existing.fee !== f.fee) {
                feeMap.set(f.service_type, { ...existing, hasFee: false, fee: 0 });
              }
            });
          });
          setEnabled(Array.from(enabledUnion) as ServiceKey[]);
          setServiceFees(Array.from(feeMap.values()));
        }
      } else {
        const res = await fetch(`/api/locations/${selectedClub}/services`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.enabledServices || []) as string[];
          setEnabled(list.length ? (list as ServiceKey[]) : ALL_SERVICE_KEYS);
          setServiceFees((data.serviceFees || []) as ServiceFeeConfig[]);
        }
      }
    } catch {
      toast.error('Không thể tải cấu hình dịch vụ');
    } finally {
      setVisibilityLoaded(true);
      setLoadingVisibility(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, selectedClub]);

  useEffect(() => {
    loadVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedClub]);

  const handleAccept = async (request: RequestItem) => {
    let refund_amount: number | undefined;
    if (request.service_type === 'cancel-refund') {
      if ((request.data as any)?.noRefund) {
        refund_amount = 0;
      } else {
        const input = prompt('Nhập số tiền hoàn cho hội viên (VNĐ):');
        if (input === null) return;
        const value = Number(input.replace(/[^\d]/g, ''));
        if (!value || value <= 0) {
          toast.error('Số tiền hoàn không hợp lệ!');
          return;
        }
        refund_amount = value;
      }
    }
    if (!confirm('Bạn có chắc chắn muốn chấp nhận yêu cầu này?')) return;
    try {
      const body: any = { action: 'accepted' };
      if (refund_amount !== undefined) body.refund_amount = refund_amount;
      const res = await fetch(`/api/service-requests/${request._id}`, {
        method: 'PATCH',
        headers: headers as any,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thất bại');
      if (data.waiting) {
        toast.info(data.message || 'Tủ đang bận. Yêu cầu sẽ được xử lý tự động khi tủ trống.');
      } else {
        toast.success('Đã chấp nhận yêu cầu!');
      }
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xử lý yêu cầu');
    }
  };

  const handleMarkPaid = async (request: RequestItem) => {
    if (!confirm(`Xác nhận đã thu ${formatVND(request.amount || 0)} của hội viên này?`)) return;
    try {
      const res = await fetch(`/api/service-requests/${request._id}/payment`, {
        method: 'PATCH',
        headers: headers as any,
        body: JSON.stringify({ payment_method: 'counter' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thất bại');
      toast.success('Đã xác nhận thu tiền!');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xử lý yêu cầu');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Vui lòng nhập lý do từ chối:');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: headers as any,
        body: JSON.stringify({ action: 'rejected', admin_note: reason.trim() || 'Không phù hợp chính sách phòng tập' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thất bại');
      toast.success('Đã từ chối yêu cầu!');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xử lý yêu cầu');
    }
  };

  const toggleService = (key: ServiceKey) => {
    setEnabled(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const setServiceFee = (key: string, patch: Partial<ServiceFeeConfig>) => {
    setServiceFees(prev => {
      const existing = prev.find(f => f.service_type === key);
      if (!existing) {
        return [...prev, { service_type: key, hasFee: false, fee: 0, ...patch }];
      }
      return prev.map(f => (f.service_type === key ? { ...f, ...patch } : f));
    });
  };

  const saveVisibility = async () => {
    const targetIds = selectedClub === 'all'
      ? (clubs || []).map(c => c._id).filter(Boolean)
      : [selectedClub];
    if (targetIds.length === 0) {
      toast.error(selectedClub === 'all' ? 'Không tìm thấy cơ sở nào để áp dụng!' : 'Vui lòng chọn một cơ sở phòng tập!');
      return;
    }
    if (enabled.length === 0) {
      toast.error('Phải bật ít nhất một dịch vụ!');
      return;
    }
    setSavingVisibility(true);
    try {
      const body = JSON.stringify({ enabledServices: enabled, serviceFees });
      const results = await Promise.all(
        targetIds.map(id =>
          fetch(`/api/locations/${id}/services`, {
            method: 'PUT',
            headers: headers as any,
            body
          }).then(r => ({ id, ok: r.ok, json: r.json().catch(() => ({})) }))
        )
      );
      const failed = results.filter(r => !r.ok);
      if (failed.length === 0) {
        toast.success(selectedClub === 'all' ? `Đã áp dụng cấu hình dịch vụ cho ${targetIds.length} câu lạc bộ!` : 'Đã lưu cấu hình dịch vụ!');
      } else if (failed.length === targetIds.length) {
        throw new Error('Không thể lưu cấu hình!');
      } else {
        toast.warning(`Đã lưu ${targetIds.length - failed.length}/${targetIds.length} câu lạc bộ. Một số cơ sở lưu thất bại.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu cấu hình');
    } finally {
      setSavingVisibility(false);
    }
  };

  const filterButtons: { key: typeof filter; label: string }[] = [
    { key: 'pending', label: 'Đang xử lý' },
    { key: 'awaiting_payment', label: 'Chờ thanh toán' },
    { key: 'accepted', label: 'Đã chấp nhận' },
    { key: 'rejected', label: 'Đã từ chối' },
    { key: 'all', label: 'Tất cả' }
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý dịch vụ</h1>
            <p className="text-slate-600">Xử lý yêu cầu dịch vụ từ hội viên và cấu hình hiển thị theo cơ sở</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setTab('requests')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'requests' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Yêu cầu dịch vụ
          </button>
          <button
            onClick={() => setTab('visibility')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'visibility' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Cài đặt dịch vụ
          </button>
        </div>

        {tab === 'requests' && (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-3 flex-wrap items-center">
              {filterButtons.map(btn => (
                <Button
                  key={btn.key}
                  variant={filter === btn.key ? 'contained' : 'outlined'}
                  onClick={() => setFilter(btn.key)}
                  sx={{
                    bgcolor: filter === btn.key ? '#4f46e5' : 'transparent',
                    color: filter === btn.key ? '#fff' : '#475569',
                    borderColor: '#cbd5e1',
                    '&:hover': {
                      bgcolor: filter === btn.key ? '#4338ca' : '#f8fafc',
                      borderColor: '#94a3b8'
                    },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  {btn.label}
                </Button>
              ))}
              <button
                onClick={loadRequests}
                disabled={loadingRequests}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                Tải lại
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>Không có yêu cầu nào ở trạng thái này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">STT</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Hội viên</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Loại dịch vụ</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Nội dung</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Phí / Thanh toán</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cơ sở</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày gửi</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request, index) => (
                        <tr
                          key={request._id}
                          onClick={() => setSelectedRequest(request)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-900">{request.customer_name || 'Hội viên'}</p>
                            {request.customer_phone && (
                              <p className="text-xs text-slate-500">{request.customer_phone}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <p>{SERVICE_LABELS[request.service_type] || request.service_type}</p>
                            {request.service_type === 'change-club' && request.has_hlv_booking && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                                <MessageSquareWarning className="w-3.5 h-3.5" />
                                Có lịch tập với HLV
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 max-w-sm">
                            <p className="line-clamp-2">{extractContent(request)}</p>
                            {request.status === 'rejected' && request.admin_note && (
                              <p className="text-xs text-red-500 mt-1">Từ chối: {request.admin_note}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {request.service_type === 'cancel-refund' ? (
                              request.refund_amount ? (
                                <span className="text-emerald-700 font-medium">Hoàn {formatVND(request.refund_amount)}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : request.amount ? (
                              <div>
                                <p className="font-medium text-slate-900">{formatVND(request.amount)}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  request.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : request.payment_status === 'refunded'
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {request.payment_status === 'paid'
                                    ? `Đã thu${request.payment_method === 'vnpay' ? ' (VNPay)' : ''}`
                                    : request.payment_status === 'refunded'
                                    ? 'Đã hoàn'
                                    : 'Chưa thu'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Miễn phí</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {request.location_id?.title || request.location_id?.address || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(request.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeCls(request.status)}`}>
                              {SERVICE_STATUS_LABELS[request.status] || request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            {request.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(request)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Chấp nhận"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleReject(request._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Từ chối"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ) : request.status === 'awaiting_payment' && request.payment_status !== 'paid' ? (
                              <button
                                onClick={() => handleMarkPaid(request)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                              >
                                Đã thu tiền
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'visibility' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Cài đặt dịch vụ</h2>
                <p className="text-sm text-slate-600">
                  Cơ sở đang chọn: <strong>{selectedClubName}</strong>
                  {selectedClub === 'all' && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      Thay đổi sẽ áp dụng cho TẤT CẢ câu lạc bộ
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Bật/tắt hiển thị cho hội viên và thiết lập phí thu (thanh toán qua VNPay). Dịch vụ Hoàn phí không thu phí trước.
                </p>
              </div>
              <Button
                variant="contained"
                disabled={savingVisibility}
                onClick={saveVisibility}
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                {savingVisibility ? 'Đang lưu...' : (selectedClub === 'all' ? 'Áp dụng cho tất cả' : 'Lưu cấu hình')}
              </Button>
            </div>

            {loadingVisibility ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Đang tải cấu hình...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICE_TYPES.map(service => {
                  const isEnabled = enabled.includes(service.key);
                  const isRefundType = REFUND_SERVICE_KEYS.includes(service.key);
                  const feeConfig = serviceFees.find(f => f.service_type === service.key);
                  const hasFee = !!feeConfig?.hasFee;
                  const fee = feeConfig?.fee || 0;
                  return (
                    <div
                      key={service.key}
                      className={`rounded-xl border transition-colors overflow-hidden ${
                        isEnabled
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleService(service.key)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{service.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                        </div>
                        <div className={`flex items-center gap-2 shrink-0 ml-4 ${
                          isEnabled ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {isEnabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isEnabled ? 'Đang hiển thị' : 'Đã ẩn'}
                          </span>
                        </div>
                      </button>
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-white">
                        {isRefundType ? (
                          <p className="flex items-center gap-2 text-xs text-sky-700 font-medium">
                            <Wallet className="w-4 h-4" /> Hoàn phí theo quyết định khi duyệt - không thu phí trước
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasFee}
                                onChange={e => setServiceFee(service.key, { hasFee: e.target.checked })}
                                className="w-4 h-4 accent-indigo-600"
                              />
                              Thu phí
                            </label>
                            {hasFee && (
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  placeholder="Số tiền (VNĐ)"
                                  value={fee || ''}
                                  onChange={e => setServiceFee(service.key, { fee: Number(e.target.value) })}
                                  className="w-40 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedRequest && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedRequest(null)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Chi tiết yêu cầu</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeCls(selectedRequest.status)}`}>
                    {SERVICE_STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {SERVICE_LABELS[selectedRequest.service_type] || selectedRequest.service_type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedRequest.customer_name || 'Hội viên'}</p>
                    {selectedRequest.customer_phone && (
                      <p className="text-sm text-slate-500">{selectedRequest.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Nội dung</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.description || '—'}</p>
                </div>

                {selectedRequest.service_type === 'change-club' && selectedRequest.has_hlv_booking && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <MessageSquareWarning className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">
                      <strong>Lưu ý:</strong> Hội viên này có lịch tập với HLV tại cơ sở hiện tại.
                    </p>
                  </div>
                )}

                {(() => {
                  const reason = extractReason(selectedRequest);
                  if (!reason) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-bold text-amber-800">Lý do</p>
                      </div>
                      <p className="text-sm text-amber-800 whitespace-pre-wrap">{reason}</p>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Phí / Thanh toán</p>
                    {selectedRequest.service_type === 'cancel-refund' ? (
                      selectedRequest.refund_amount ? (
                        <p className="text-sm font-semibold text-emerald-700">Hoàn {formatVND(selectedRequest.refund_amount)}</p>
                      ) : (
                        <p className="text-sm text-slate-500">—</p>
                      )
                    ) : selectedRequest.amount ? (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatVND(selectedRequest.amount)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedRequest.payment_status === 'paid'
                            ? `Đã thu${selectedRequest.payment_method === 'vnpay' ? ' (VNPay)' : ''}`
                            : selectedRequest.payment_status === 'refunded'
                            ? 'Đã hoàn'
                            : 'Chưa thu'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Miễn phí</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Ngày gửi</p>
                    <p className="text-sm text-slate-700">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Cơ sở</p>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedRequest.location_id?.title || selectedRequest.location_id?.address || '—'}
                  </div>
                </div>

                {selectedRequest.admin_note && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-700 mb-1">Ghi chú của nhân viên</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedRequest.admin_note}</p>
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => { handleReject(selectedRequest._id); setSelectedRequest(null); }}
                      sx={{
                        height: 44,
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: '#fecaca',
                        color: '#dc2626',
                        '&:hover': { borderColor: '#f87171', bgcolor: '#fef2f2' }
                      }}
                    >
                      Từ chối
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => { handleAccept(selectedRequest); setSelectedRequest(null); }}
                      sx={{
                        height: 44,
                        borderRadius: 2,
                        textTransform: 'none',
                        bgcolor: '#16a34a',
                        '&:hover': { bgcolor: '#15803d' }
                      }}
                    >
                      Chấp nhận
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
