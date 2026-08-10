import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  SERVICE_LABELS,
  SERVICE_STATUS_LABELS
} from '../../../lib/serviceCatalog';

interface RequestItem {
  _id: string;
  customer_name: string;
  customer_phone?: string;
  service_type: string;
  description: string;
  status: string;
  admin_note?: string;
  createdAt: string;
  processed_at?: string;
  location_id?: { _id: string; title?: string; address?: string } | null;
}

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export function ServiceHistory() {
  const headers = getAuthHeaders();
  const [filter, setFilter] = useState<'accepted' | 'rejected' | 'all'>('all');
  const [history, setHistory] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      params.set('limit', '100');
      const res = await fetch(`/api/service-requests?${params.toString()}`, { headers: headers as any });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setHistory(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error('Không thể tải lịch sử dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filterButtons: { key: typeof filter; label: string; color: string }[] = [
    { key: 'all', label: 'Tất cả', color: '#4f46e5' },
    { key: 'accepted', label: 'Đã chấp nhận', color: '#10b981' },
    { key: 'rejected', label: 'Đã từ chối', color: '#ef4444' }
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử dịch vụ</h1>
          <p className="text-slate-600">Lịch sử các yêu cầu đã xử lý</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          {filterButtons.map(btn => (
            <Button
              key={btn.key}
              variant={filter === btn.key ? 'contained' : 'outlined'}
              onClick={() => setFilter(btn.key)}
              sx={{
                bgcolor: filter === btn.key ? btn.color : 'transparent',
                color: filter === btn.key ? '#fff' : '#475569',
                borderColor: '#cbd5e1',
                '&:hover': {
                  bgcolor: filter === btn.key ? btn.color : '#f8fafc',
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>Chưa có yêu cầu nào được xử lý ở trạng thái này.</p>
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Cơ sở</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày gửi</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Ngày xử lý</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{item.customer_name || 'Hội viên'}</p>
                        {item.customer_phone && (
                          <p className="text-xs text-slate-500">{item.customer_phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{SERVICE_LABELS[item.service_type] || item.service_type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-sm">
                        <p className="line-clamp-2">{item.description || '—'}</p>
                        {item.status === 'rejected' && item.admin_note && (
                          <p className="text-xs text-red-500 mt-1">Lý do từ chối: {item.admin_note}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.location_id?.title || item.location_id?.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(item.processed_at || '')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {SERVICE_STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
