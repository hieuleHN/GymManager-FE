import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import {
  Pause,
  Play,
  Users,
  FileText,
  HelpCircle,
  Undo2,
  Lock,
  MessageSquareWarning,
  Loader2,
  Download,
  CreditCard,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth, getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';
import { toast } from 'sonner';
import {
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVICE_STATUS_LABELS,
  ALL_SERVICE_KEYS,
  REFUND_SERVICE_KEYS,
  FREE_SERVICE_KEYS,
  formatVND,
  ServiceKey
} from '../../../lib/serviceCatalog';

interface ServiceMeta {
  key: ServiceKey;
  title: string;
  description: string;
  icon: typeof Pause;
  color: string;
  iconColor: string;
}

const SERVICE_CATALOG: ServiceMeta[] = [
  { ...serviceMeta('freeze', Pause, 'bg-blue-50', 'text-blue-600') },
  { ...serviceMeta('activate', Play, 'bg-green-50', 'text-green-600') },
  { ...serviceMeta('transfer', Users, 'bg-purple-50', 'text-purple-600') },
  { ...serviceMeta('contract', FileText, 'bg-slate-50', 'text-slate-600') },
  { ...serviceMeta('support', HelpCircle, 'bg-indigo-50', 'text-indigo-600') },
  { ...serviceMeta('cancel-refund', Undo2, 'bg-rose-50', 'text-rose-600') },
  { ...serviceMeta('locker', Lock, 'bg-cyan-50', 'text-cyan-600') },
  { ...serviceMeta('complaint', MessageSquareWarning, 'bg-orange-50', 'text-orange-600') }
];

function serviceMeta(
  key: ServiceKey,
  icon: typeof Pause,
  color: string,
  iconColor: string
): ServiceMeta {
  const def = SERVICE_TYPES.find(t => t.key === key)!;
  return {
    key,
    title: def.title,
    description: def.description,
    icon,
    color,
    iconColor
  };
}

interface MyPackage {
  _id: string;
  name?: string;
  status: string;
  payment_status?: string;
  end_date?: string;
  createdAt?: string;
  package_id?: { _id: string; name: string } | null;
}

interface LocationItem {
  _id: string;
  title?: string;
  address: string;
}

interface ServiceRequestItem {
  _id: string;
  service_type: string;
  description: string;
  status: string;
  admin_note?: string;
  amount?: number;
  payment_status?: string;
  refund_amount?: number;
  data?: Record<string, any>;
  createdAt: string;
}

interface ServiceFeeConfig {
  service_type: string;
  hasFee: boolean;
  fee: number;
}

interface RequestForm {
  description: string;
  packageId: string;
  duration: string;
  recipient: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
  targetClub: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  subject: string;
  lockerId: string;
  lockerNumber: string;
  durationDays: string;
  lockerNote: string;
}

const emptyForm: RequestForm = {
  description: '',
  packageId: '',
  duration: '1',
  recipient: '',
  recipientId: '',
  recipientName: '',
  recipientAvatar: '',
  targetClub: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  subject: '',
  lockerId: '',
  lockerNumber: '',
  durationDays: '7',
  lockerNote: ''
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export function Services() {
  const { user, refreshUser } = useAuth();
  const { openSupportChat } = useChatContext();
  const headers = getAuthHeaders();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [enabledServices, setEnabledServices] = useState<ServiceKey[]>(ALL_SERVICE_KEYS);
  const [serviceFees, setServiceFees] = useState<ServiceFeeConfig[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceKey | null>(null);
  const [form, setForm] = useState<RequestForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [packages, setPackages] = useState<MyPackage[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [availableLockers, setAvailableLockers] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequestItem[]>([]);
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const searchTimer = useRef<any>(null);

  const memberLocationId = user?.locationId || null;

  useEffect(() => {
    const svcPay = searchParams.get('svc_pay');
    if (svcPay === 'success') {
      toast.success(`Thanh toán thành công${searchParams.get('amount') ? ` - ${formatVND(Number(searchParams.get('amount')))}` : ''}!`);
      loadMyRequests();
    } else if (svcPay === 'fail') {
      toast.error('Thanh toán thất bại hoặc đã bị hủy.');
    }
    if (svcPay) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const loadAll = async () => {
      setLoadingServices(true);
      try {
        if (memberLocationId) {
          const res = await fetch(`${getApiUrl()}/api/locations/${memberLocationId}/services`);
          if (res.ok) {
            const data = await res.json();
            const enabled = (data.enabledServices || []) as string[];
            setEnabledServices(enabled.length ? (enabled as ServiceKey[]) : ALL_SERVICE_KEYS);
            setServiceFees((data.serviceFees || []) as ServiceFeeConfig[]);
          }
        }
      } catch {
        /* mặc định hiện tất cả */
      } finally {
        setLoadingServices(false);
      }
    };
    loadAll();
    loadMyPackages();
    loadMyRequests();
    loadLocations();
    loadAvailableLockers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberLocationId]);

  const loadAvailableLockers = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/lockers`, { headers: headers as any });
      if (res.ok) {
        const data = await res.json();
        const lockers = Array.isArray(data?.data) ? data.data : [];
        const filtered = memberLocationId
          ? lockers.filter((l: any) => !l.locationId || String(l.locationId) === String(memberLocationId))
          : lockers;
        setAvailableLockers(filtered.filter((l: any) => l.status === 'AVAILABLE'));
      }
    } catch {
      /* ignore */
    }
  };

  const loadMyPackages = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/my`, { headers: headers as any });
      if (res.ok) {
        const data = await res.json();
        const list: MyPackage[] = (Array.isArray(data) ? data : []).map((reg: any) => ({
          _id: reg._id,
          name: reg.package_id?.name || reg.name || 'Gói tập',
          status: reg.status || '',
          payment_status: reg.payment_status || '',
          end_date: reg.end_date,
          createdAt: reg.createdAt,
          package_id: reg.package_id
        }));
        setPackages(list);
      }
    } catch {
      /* ignore */
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/service-requests/mine`, { headers: headers as any });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMyRequests(data);
      }
    } catch {
      /* ignore */
    }
  };

  const loadLocations = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/locations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocations(
            data.map((l: any) => ({ _id: l._id, title: l.title, address: l.address }))
          );
        }
      }
    } catch {
      /* ignore */
    }
  };

  const dedupeByPackage = (list: MyPackage[]): MyPackage[] => {
    const map = new Map<string, MyPackage>();
    list.forEach(p => {
      const key = p.package_id?._id || p._id;
      const existing = map.get(key);
      if (
        !existing ||
        (p.end_date && (!existing.end_date || new Date(p.end_date) > new Date(existing.end_date)))
      ) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
  };

  const pendingFreezeRegIds = new Set(
    myRequests
      .filter(
        r =>
          r.service_type === 'freeze' &&
          (r.status === 'pending' || r.status === 'awaiting_payment')
      )
      .map(r => r.data?.packageId)
      .filter(Boolean)
  );
  const blockedFreezePackageIds = new Set(
    packages
      .filter(
        p =>
          p.status === 'đang tạm ngưng' ||
          pendingFreezeRegIds.has(p._id)
      )
      .map(p => p.package_id?._id)
      .filter(Boolean)
  );

  const activePackages = dedupeByPackage(
    packages.filter(
      p =>
        (p.status === 'đang hoạt động' || p.status === 'còn 10 ngày') &&
        p.payment_status === 'đã thanh toán' &&
        (!p.end_date || new Date(p.end_date) > new Date()) &&
        !blockedFreezePackageIds.has(p.package_id?._id)
    )
  );
  const frozenPackages = dedupeByPackage(
    packages.filter(p => p.status === 'đang tạm ngưng')
  );
  const cancelablePackages = packages.filter(p => p.status !== 'đã hủy');
  const contractList = (() => {
    const map = new Map<string, MyPackage>();
    packages
      .filter(p => p.payment_status === 'đã thanh toán')
      .forEach(p => {
        const key = p.package_id?._id || p._id;
        const existing = map.get(key);
        if (!existing || (p.createdAt && (!existing.createdAt || new Date(p.createdAt) > new Date(existing.createdAt)))) {
          map.set(key, p);
        }
      });
    return Array.from(map.values());
  })();

  const visibleServices = SERVICE_CATALOG.filter(s => enabledServices.includes(s.key));

  const getServiceFee = (key: ServiceKey) => {
    const cfg = serviceFees.find(f => f.service_type === key);
    return cfg && cfg.hasFee && Number(cfg.fee) > 0 ? Math.floor(Number(cfg.fee)) : 0;
  };

  const handlePayRequest = async (reqId: string) => {
    setPayingId(reqId);
    try {
      const res = await fetch(`${getApiUrl()}/api/service-requests/mine`, { headers: headers as any });
      if (res.ok) {
        const data = await res.json();
        const req = (Array.isArray(data) ? data : []).find((r: any) => r._id === reqId);
        if (req) {
          const amount = Math.floor(Number(req.amount) || 0);
          navigate('/payment', {
            state: {
              type: 'service_request',
              requestId: req._id,
              amount,
              totalPrice: amount,
              serviceTitle: SERVICE_LABELS[req.service_type] || req.service_type
            }
          });
          return;
        }
      }
      toast.error('Không tìm thấy yêu cầu thanh toán. Vui lòng thử lại!');
    } catch {
      toast.error('Không thể tải thông tin thanh toán');
    } finally {
      setPayingId(null);
    }
  };

  const handleServiceClick = (serviceId: ServiceKey) => {
    if (serviceId === 'support') {
      openSupportChat();
      return;
    }
    if (serviceId === 'freeze' || serviceId === 'activate') {
      loadMyPackages();
      loadMyRequests();
    }
    setForm(emptyForm);
    setSelectedService(serviceId);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setForm(emptyForm);
  };

  const setField = (key: keyof RequestForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const searchRecipients = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) {
      setRecipientResults([]);
      setSearchingRecipient(false);
      return;
    }
    setSearchingRecipient(true);
    setRecipientOpen(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/search?q=${encodeURIComponent(q)}${memberLocationId ? `&locationId=${encodeURIComponent(memberLocationId)}` : ''}`, { headers: headers as any });
      if (res.ok) {
        const data = await res.json();
        setRecipientResults(Array.isArray(data) ? data : []);
      }
    } catch {
      setRecipientResults([]);
    } finally {
      setSearchingRecipient(false);
    }
  };

  const handleRecipientChange = (value: string) => {
    setField('recipient', value);
    if (value !== form.recipientId && value !== form.recipientName) {
      setField('recipientId', '');
      setField('recipientName', '');
      setField('recipientAvatar', '');
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchRecipients(value), 350);
  };

  const selectRecipient = (m: any) => {
    setField('recipientId', m._id);
    setField('recipientName', m.fullName || m.account || '');
    setField('recipientAvatar', m.avatar || '');
    setField('recipient', m.phone || m.account || m.fullName || '');
    setRecipientOpen(false);
    setRecipientResults([]);
  };

  const buildPayload = () => {
    const selected = packages.find(p => p._id === form.packageId);
    const pkgName = selected?.package_id?.name || selected?.name || 'gói tập';
    const reason = form.description.trim();
    const data: Record<string, any> = {};

    switch (selectedService) {
      case 'freeze':
        data.packageId = form.packageId;
        data.duration = form.duration;
        data.reason = reason;
        return {
          description: `Tạm ngưng gói "${pkgName}" trong ${form.duration} tháng${reason ? `. Lý do: ${reason}` : ''}`,
          data
        };
      case 'activate':
        data.packageId = form.packageId;
        data.reason = reason;
        return {
          description: `Kích hoạt lại gói "${pkgName}"${reason ? `. Lý do: ${reason}` : ''}`,
          data
        };
      case 'transfer':
        data.packageId = form.packageId;
        data.recipientId = form.recipientId;
        data.recipient = form.recipientName || form.recipient;
        data.reason = reason;
        return {
          description: `Chuyển nhượng gói "${pkgName}" cho ${form.recipientName || form.recipient}${reason ? `. Lý do: ${reason}` : ''}`,
          data
        };
      case 'cancel-refund':
        data.packageId = form.packageId;
        data.bankName = form.bankName;
        data.accountNumber = form.accountNumber;
        data.accountName = form.accountName;
        data.reason = reason;
        return {
          description: `Hủy gói "${pkgName}"${reason ? `. Lý do: ${reason}` : ''}${form.bankName && form.accountNumber ? ` | Hoàn về ${form.bankName} • ${form.accountNumber}` : ''}`,
          data
        };
      case 'locker':
        data.lockerId = form.lockerId;
        data.lockerNumber = form.lockerNumber;
        data.durationDays = form.durationDays;
        data.note = form.lockerNote;
        return {
          description: `Thuê tủ ${form.lockerNumber || ''} trong ${form.durationDays || ''} ngày${form.lockerNote ? `. Ghi chú: ${form.lockerNote}` : ''}`,
          data
        };
      case 'complaint':
        data.subject = form.subject;
        data.content = reason;
        return {
          description: `[${form.subject || 'Góp ý'}] ${reason}`,
          data
        };
      default:
        return { description: reason, data };
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedService) return;
    await doSubmitRequest();
  };

  const doSubmitRequest = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`${getApiUrl()}/api/service-requests`, {
        method: 'POST',
        headers: headers as any,
        body: JSON.stringify({
          service_type: selectedService,
          description: payload.description,
          data: payload.data
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gửi yêu cầu thất bại!');
        return;
      }
      handleCloseModal();
      loadMyRequests();
      if (refreshUser) refreshUser();
      if (data.request?.status === 'awaiting_payment') {
        toast.success(`Yêu cầu đã ghi nhận. Vui lòng thanh toán ${formatVND(data.request.amount || 0)} để được xử lý.`);
        await handlePayRequest(data.request._id);
      } else {
        toast.success(data.message || 'Yêu cầu của bạn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm!');
      }
    } catch {
      alert('Không thể gửi yêu cầu. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = (() => {
    if (!selectedService) return false;
    switch (selectedService) {
      case 'freeze':
        return !!form.packageId && form.description.trim().length > 0;
      case 'activate':
        return !!form.packageId;
      case 'transfer':
        return !!form.packageId && !!form.recipientId && form.description.trim().length > 0;
      case 'cancel-refund':
        return !!form.packageId && form.description.trim().length > 0;
      case 'locker':
        return !!form.lockerId && !!form.lockerNumber;
      case 'complaint':
        return form.description.trim().length > 0;
      default:
        return false;
    }
  })();

  const renderFormFields = () => {
    const inputCls =
      'w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500';
    const labelCls = 'block text-sm font-medium text-slate-700 mb-2';

    switch (selectedService) {
      case 'freeze':
        if (activePackages.length === 0) {
          return (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-600">
              Bạn hiện không có gói tập nào đang hoạt động để tạm ngưng.
            </div>
          );
        }
        return (
          <>
            <div>
              <label className={labelCls}>Lý do tạm ngưng</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn tạm ngưng..."
                className={`${inputCls} resize-none`}
                rows={3}
              />
            </div>
            <div>
              <label className={labelCls}>Chọn gói đang hoạt động</label>
              <select
                value={form.packageId}
                onChange={e => setField('packageId', e.target.value)}
                className={inputCls}
              >
                <option value="">Chọn gói tập</option>
                {activePackages.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Thời gian tạm ngưng</label>
              <select
                value={form.duration}
                onChange={e => setField('duration', e.target.value)}
                className={inputCls}
              >
                <option value="1">1 tháng</option>
                <option value="2">2 tháng</option>
                <option value="3">3 tháng</option>
              </select>
            </div>
          </>
        );
      case 'activate':
        if (frozenPackages.length === 0) {
          return (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-600">
              Bạn hiện không có gói tập nào đang tạm ngưng để kích hoạt lại.
            </div>
          );
        }
        return (
          <div>
            <label className={labelCls}>Gói đang tạm ngưng</label>
            <select
              value={form.packageId}
              onChange={e => setField('packageId', e.target.value)}
              className={inputCls}
            >
              <option value="">Chọn gói cần kích hoạt lại</option>
              {frozenPackages.map(pkg => (
                <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
              ))}
            </select>
          </div>
        );
      case 'transfer':
        return (
          <>
            <div>
              <label className={labelCls}>Lý do chuyển nhượng</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Vui lòng cho chúng tôi biết lý do chuyển nhượng..."
                className={`${inputCls} resize-none`}
                rows={3}
              />
            </div>
            <div>
              <label className={labelCls}>Chọn gói để chuyển nhượng</label>
              <select
                value={form.packageId}
                onChange={e => setField('packageId', e.target.value)}
                className={inputCls}
              >
                <option value="">Chọn gói tập</option>
                {activePackages.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Người được chuyển nhượng</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.recipient}
                  onChange={e => handleRecipientChange(e.target.value)}
                  onFocus={() => form.recipient && setRecipientOpen(true)}
                  placeholder="Nhập tên, số điện thoại hoặc tài khoản để tìm kiếm..."
                  className={inputCls}
                />
                {form.recipientId && form.recipientName && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    {form.recipientAvatar ? (
                      <img
                        src={
                          form.recipientAvatar.startsWith('http') || form.recipientAvatar.startsWith('data:')
                            ? form.recipientAvatar
                            : `${getApiUrl()}/uploads/customers/${form.recipientAvatar}`
                        }
                        alt={form.recipientName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                        {form.recipientName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{form.recipientName}</p>
                      <p className="text-xs text-green-700">Đã xác minh - gói sẽ chuyển đến hội viên này</p>
                    </div>
                    <button
                      onClick={() => {
                        setField('recipient', '');
                        setField('recipientId', '');
                        setField('recipientName', '');
                        setField('recipientAvatar', '');
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Bỏ chọn"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {recipientOpen && !form.recipientId && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {searchingRecipient ? (
                      <div className="flex items-center justify-center py-6 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Đang tìm kiếm...</span>
                      </div>
                    ) : recipientResults.length > 0 ? (
                      recipientResults.map(m => (
                        <button
                          key={m._id}
                          onClick={() => selectRecipient(m)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          {m.avatar ? (
                            <img
                              src={
                                m.avatar.startsWith('http') || m.avatar.startsWith('data:')
                                  ? m.avatar
                                  : `${getApiUrl()}/uploads/customers/${m.avatar}`
                              }
                              alt={m.fullName || m.account}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                              {(m.fullName || m.account || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-slate-900 truncate">{m.fullName || m.account}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {m.phone ? `SDT: ${m.phone}` : ''}{m.phone && m.account ? ' • ' : ''}{m.account ? `Tài khoản: ${m.account}` : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-slate-500 text-center">
                        Không tìm thấy hội viên phù hợp. Vui lòng kiểm tra lại thông tin.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      case 'cancel-refund':
        return (
          <>
            <div>
              <label className={labelCls}>Lý do hủy gói</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Vui lòng cho chúng tôi biết lý do hủy gói..."
                className={`${inputCls} resize-none`}
                rows={3}
              />
            </div>
            <div>
              <label className={labelCls}>Chọn gói muốn hủy</label>
              <select
                value={form.packageId}
                onChange={e => setField('packageId', e.target.value)}
                className={inputCls}
              >
                <option value="">Chọn gói tập</option>
                {cancelablePackages.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Ngân hàng nhận hoàn tiền</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={e => setField('bankName', e.target.value)}
                  placeholder="VD: Vietcombank"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Số tài khoản</label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={e => setField('accountNumber', e.target.value)}
                  placeholder="Số tài khoản nhận hoàn tiền"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Chủ tài khoản</label>
              <input
                type="text"
                value={form.accountName}
                onChange={e => setField('accountName', e.target.value)}
                placeholder="Tên chủ tài khoản"
                className={inputCls}
              />
            </div>
          </>
        );
      case 'locker':
        const lockerRows = availableLockers.reduce((acc: Record<string, any[]>, l: any) => {
          const prefix = l.prefix || 'LK';
          if (!acc[prefix]) acc[prefix] = [];
          acc[prefix].push(l);
          return acc;
        }, {});
        const lockerFee = getServiceFee('locker');
        return (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Chọn tủ trống</label>
              {Object.keys(lockerRows).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
                  Hiện tại không còn tủ nào trống tại cơ sở của bạn.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-3">
                  {Object.keys(lockerRows).sort().map(prefix => (
                    <div key={prefix}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dãy {prefix}</p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {lockerRows[prefix].map((l: any) => (
                          <button
                            key={l._id}
                            type="button"
                            onClick={() => {
                              setField('lockerId', l._id);
                              setField('lockerNumber', l.lockerNumber);
                            }}
                            className={`p-2 rounded-lg text-sm font-semibold border transition-colors ${
                              form.lockerId === l._id
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {l.lockerNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.lockerNumber && (
                <p className="mt-2 text-sm text-cyan-700 font-medium">Đã chọn: Tủ {form.lockerNumber}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Thời gian thuê</label>
              <select
                value={form.durationDays}
                onChange={e => setField('durationDays', e.target.value)}
                className={inputCls}
              >
                {Array.from({ length: 19 }, (_, i) => i + 2).map(d => (
                  <option key={d} value={d}>{d} ngày</option>
                ))}
              </select>
            </div>
            {lockerFee > 0 && (
              <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 p-4 rounded-xl">
                <div>
                  <p className="text-sm text-cyan-800"><strong>{formatVND(lockerFee)}</strong> / ngày</p>
                  <p className="text-xs text-cyan-700 mt-0.5">Tổng cho {form.durationDays || '—'} ngày</p>
                </div>
                <p className="text-lg font-bold text-cyan-800">{formatVND(lockerFee * (Number(form.durationDays) || 0))}</p>
              </div>
            )}
            <div>
              <label className={labelCls}>Ghi chú (tùy chọn)</label>
              <textarea
                value={form.lockerNote}
                onChange={e => setField('lockerNote', e.target.value)}
                placeholder="VD: cần tủ lớn, vị trí gần cửa ra vào..."
                className={`${inputCls} resize-none`}
                rows={2}
              />
            </div>
          </div>
        );
      case 'complaint':
        return (
          <>
            <div>
              <label className={labelCls}>Tiêu đề</label>
              <select
                value={form.subject}
                onChange={e => setField('subject', e.target.value)}
                className={inputCls}
              >
                <option value="">Chọn loại phản hồi</option>
                <option value="Khiếu nại">Khiếu nại</option>
                <option value="Góp ý">Góp ý</option>
                <option value="Khen ngợi">Khen ngợi</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nội dung</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Vui lòng mô tả chi tiết nội dung..."
                className={`${inputCls} resize-none`}
                rows={4}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dịch vụ</h1>
          <p className="text-slate-600">Quản lý các dịch vụ và yêu cầu của bạn</p>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Đang tải danh sách dịch vụ...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleServices.map(service => {
              const Icon = service.icon;
              const isFree = FREE_SERVICE_KEYS.includes(service.key) || REFUND_SERVICE_KEYS.includes(service.key);
              const fee = getServiceFee(service.key);
              return (
                <button
                  key={service.key}
                  onClick={() => handleServiceClick(service.key)}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all text-left group"
                >
                  <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${service.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-600">{service.description}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5">
                    {isFree || fee === 0 ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {formatVND(fee)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Yêu cầu gần đây</h2>
          {myRequests.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Bạn chưa có yêu cầu dịch vụ nào.</p>
          ) : (
            <div className="space-y-4">
              {myRequests.slice(0, 5).map(req => (
                <div key={req._id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">{SERVICE_LABELS[req.service_type] || req.service_type}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{req.description}</p>
                    {req.amount ? (
                      <p className="text-sm text-indigo-700 font-medium mt-1">
                        {req.service_type === 'cancel-refund' && req.refund_amount
                          ? `Hoàn ${formatVND(req.refund_amount)}`
                          : `${formatVND(req.amount)}${req.payment_status === 'paid' ? ' - đã thanh toán' : req.payment_status === 'refunded' ? ' - đã hoàn' : ''}`}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-400 mt-1">{formatDate(req.createdAt)}</p>
                    {req.status === 'rejected' && req.admin_note && (
                      <p className="text-xs text-red-500 mt-1">Lý do từ chối: {req.admin_note}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : req.status === 'awaiting_payment'
                        ? 'bg-violet-100 text-violet-700'
                        : req.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {SERVICE_STATUS_LABELS[req.status] || req.status}
                    </span>
                    {req.status === 'awaiting_payment' && req.payment_status !== 'paid' && (
                      <button
                        onClick={() => handlePayRequest(req._id)}
                        disabled={payingId === req._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
                      >
                        {payingId === req._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        {payingId === req._id ? 'Đang mở...' : 'Thanh toán ngay'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedService && selectedService !== 'contract' && selectedService !== 'support' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{SERVICE_LABELS[selectedService]}</h2>

              {(() => {
                const fee = getServiceFee(selectedService);
                if (fee > 0 && !REFUND_SERVICE_KEYS.includes(selectedService) && selectedService !== 'locker') {
                  return (
                    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-6">
                      <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                      <p className="text-sm text-indigo-800">
                        <strong>Phí dịch vụ: {formatVND(fee)}</strong> - thanh toán trực tuyến qua VNPay sau khi gửi yêu cầu.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-4 mb-6">
                {renderFormFields()}
              </div>

              {selectedService === 'freeze' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Lưu ý:</strong> Gói sẽ được tạm ngưng trong {form.duration || '1'} tháng và tự động kích hoạt lại khi hết thời gian. Thời gian tạm ngưng sẽ được cộng thêm vào hạn sử dụng.
                  </p>
                </div>
              )}

              {selectedService === 'activate' && frozenPackages.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Sau khi được duyệt, gói sẽ hoạt động trở lại và thời gian đã tạm ngưng sẽ được cộng thêm vào hạn sử dụng.
                  </p>
                </div>
              )}

              {selectedService === 'cancel-refund' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Lưu ý:</strong> Việc hoàn phí sẽ được tính theo chính sách của phòng tập. Yêu cầu sẽ được xử lý trong vòng 24 giờ.
                  </p>
                </div>
              )}

              {selectedService === 'transfer' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Lưu ý:</strong> Sau khi chuyển nhượng, bạn sẽ không thể sử dụng gói tập này.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                  }}
                >
                  Hủy
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmitRequest}
                  disabled={!canSubmit || submitting}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' }
                  }}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedService === 'contract' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Hợp đồng của tôi</h2>

              {contractList.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Bạn chưa có gói tập nào đã thanh toán để xem hợp đồng.</p>
              ) : (
                <div className="space-y-4">
                  {contractList.map((contract) => {
                    const pdfUrl = `${getApiUrl()}/api/user-packages/${contract._id}/contract-pdf?token=${encodeURIComponent(JSON.parse(localStorage.getItem('auth_user') || '{}').token || '')}`;
                    return (
                      <div key={contract._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 group cursor-pointer"
                        >
                          <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{contract.name}</p>
                            <p className="text-sm text-slate-600">
                              Ngày đăng ký: {contract.createdAt ? formatDate(contract.createdAt) : '—'}
                            </p>
                          </div>
                        </a>
                        <a
                          href={pdfUrl}
                          download={`hop-dong-${contract._id}.pdf`}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Tải xuống</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outlined"
                  onClick={handleCloseModal}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
