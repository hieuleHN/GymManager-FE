import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import { Search, Edit, Trash2, Loader2, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { Button } from '@mui/material';

const STATUS_OPTIONS = ['hoạt động', 'bảo trì', 'hỏng hóc', 'thiếu linh kiện'];

export function EquipmentList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportListModal, setShowReportListModal] = useState(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportStatusType, setReportStatusType] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportAffectedQty, setReportAffectedQty] = useState(1);

  const fetchEquipment = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub !== 'all' ? `?locationId=${selectedClub}` : '?';
      const url = `${getApiUrl()}/api/equipments${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tải danh sách thất bại');
      setEquipment(data?.data || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchEquipment(1); }, [selectedClub]);

  const handleEdit = (id: string) => navigate(`/admin/equipment/${id}/edit`);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/equipments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Xóa thiết bị thất bại'); }
      toast.success('Xóa thiết bị thành công!');
      fetchEquipment(page);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReport = (item: any) => {
    setSelectedEquipment(item);
    setReportStatusType('');
    setReportReason('');
    setReportAffectedQty(1);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) { toast.error('Vui lòng nhập lý do!'); return; }
    if (!selectedEquipment) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/equipments/${selectedEquipment._id}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statusType: reportStatusType || undefined, reason: reportReason, affectedQuantity: reportAffectedQty })
      });
      if (res.ok) {
        toast.success('Đã gửi báo cáo');
        setShowReportModal(false);
        setSelectedEquipment(null);
        setReportStatusType('');
        setReportReason('');
        setReportAffectedQty(1);
        fetchEquipment(page);
      } else { toast.error('Gửi báo cáo thất bại'); }
    } catch { toast.error('Gửi báo cáo thất bại'); }
  };

  const handleResolveReport = async (equipmentId: string, reportId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/equipments/${equipmentId}/report/${reportId}/resolve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success('Đã hoàn thành báo cáo');
        setShowReportDetailModal(false);
        setShowReportListModal(false);
        setSelectedReport(null);
        setSelectedEquipment(null);
        fetchEquipment(page);
      } else { toast.error('Hoàn thành báo cáo thất bại'); }
    } catch { toast.error('Hoàn thành báo cáo thất bại'); }
  };

  const handleViewReport = (item: any, report: any) => {
    setSelectedEquipment(item);
    setSelectedReport(report);
    setShowReportDetailModal(true);
  };

  const handleOpenReportList = (item: any) => {
    setSelectedEquipment(item);
    setShowReportListModal(true);
  };

  const pendingReports = (item: any) => item.reports?.filter((r: any) => r.status === 'pending') || [];

  const getStatusDisplay = (item: any) => {
    const pending = pendingReports(item);
    if (pending.length === 0) {
      return { label: 'hoạt động', color: 'text-green-700 bg-green-100' };
    }
    const latestStatusType = pending[pending.length - 1].statusType || pending[pending.length - 1].reason;
    if (latestStatusType === 'bảo trì') {
      return { label: 'bảo trì', color: 'text-yellow-700 bg-yellow-100' };
    }
    if (latestStatusType === 'hoạt động') {
      return { label: 'hoạt động', color: 'text-green-700 bg-green-100' };
    }
    return { label: latestStatusType, color: 'text-red-700 bg-red-100' };
  };

  const filteredEquipment = equipment.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách thiết bị</h1>
          <p className="text-slate-600">Quản lý thiết bị phòng tập</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo tên thiết bị, nhà cung cấp..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Tên thiết bị</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Mô tả</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Đơn giá</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Số lượng</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Bảo hành</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Tổng tiền</th>
                  <th className="px-2 py-3 text-left text-sm font-bold text-slate-900 truncate">Trạng thái</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-slate-900 truncate">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item: any) => {
                  const statusInfo = getStatusDisplay(item);
                  return (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 text-sm font-medium text-slate-900 truncate" title={item.name}>{item.name}</td>
                      <td className="px-2 py-3 text-sm text-slate-600 truncate" title={item.description}>{item.description}</td>
                      <td className="px-2 py-3 text-sm text-slate-600 truncate" title={item.unitPrice?.toLocaleString('vi-VN')}>{item.unitPrice?.toLocaleString('vi-VN')}đ</td>
                      <td className="px-2 py-3 text-sm text-slate-600 truncate">{item.quantity}</td>
                      <td className="px-2 py-3 text-sm text-slate-600 truncate">{item.warranty_period} th</td>
                      <td className="px-2 py-3 text-sm font-semibold text-indigo-600 truncate">{item.total?.toLocaleString('vi-VN')}đ</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-1.5 items-center justify-center">
                          <button onClick={() => handleEdit(item._id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button onClick={() => handleReport(item)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Báo cáo">
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            {pendingReports(item).length > 0 && (
                              <button onClick={() => handleOpenReportList(item)}
                                className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                title="Danh sách báo cáo">
                                {pendingReports(item).length}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEquipment.length === 0 && (
                  <tr><td colSpan={8} className="px-2 py-8 text-center text-slate-500 text-sm">Không tìm thấy thiết bị nào</td></tr>
                )}
              </tbody>
            </table>
          )}
          {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPageChange={(p) => { setPage(p); fetchEquipment(p); }} />}
        </div>
      </div>

      {/* Report List Modal */}
      {showReportListModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowReportListModal(false); setSelectedEquipment(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Danh sách báo cáo</h3>
              <button onClick={() => { setShowReportListModal(false); setSelectedEquipment(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-600">Thiết bị</p>
              <p className="text-lg font-semibold text-slate-900">{selectedEquipment.name}</p>
            </div>
            {pendingReports(selectedEquipment).length === 0 ? (
              <p className="text-center text-slate-500 py-4">Không có báo cáo nào đang chờ</p>
            ) : (
              <div className="space-y-3">
                {pendingReports(selectedEquipment).map((report: any, idx: number) => (
                  <div key={report._id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">Báo cáo #{idx + 1}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            (report.statusType || report.reason) === 'bảo trì' ? 'bg-yellow-100 text-yellow-700' :
                            (report.statusType || report.reason) === 'hoạt động' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>{report.statusType || 'hoạt động'}</span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {report.affectedQuantity || 1}/{selectedEquipment.quantity || 1} máy
                          </span>
                          <span className="text-sm text-slate-700 line-clamp-2">{report.reason}</span>
                        </div>
                        {report.reportedAt && (
                          <p className="text-xs text-slate-400">{new Date(report.reportedAt).toLocaleDateString('vi-VN')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleViewReport(selectedEquipment, report)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                          Chi tiết
                        </button>
                        <button onClick={() => handleResolveReport(selectedEquipment._id, report._id!)}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors">
                          Hoàn thành
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetailModal && selectedEquipment && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedEquipment(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Chi tiết báo cáo</h3>
              <button onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedEquipment(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 mb-1">Thiết bị</p>
              <p className="text-lg font-semibold text-slate-900">{selectedEquipment.name}</p>
              <p className="text-sm text-slate-500">Số lượng bị ảnh hưởng: <span className="font-semibold text-slate-800">{selectedReport.affectedQuantity || 1} / {selectedEquipment.quantity || 1}</span></p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Trạng thái</p>
              <p className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${
                (selectedReport.statusType || selectedReport.reason) === 'bảo trì' ? 'bg-yellow-100 text-yellow-700' :
                (selectedReport.statusType || selectedReport.reason) === 'hoạt động' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>{selectedReport.statusType || 'hoạt động'}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">Lý do</p>
              <p className="text-base bg-slate-50 rounded-xl p-4 text-slate-800">{selectedReport.reason}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" onClick={() => { setShowReportDetailModal(false); setSelectedReport(null); setSelectedEquipment(null); }}
                sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2 }}>
                Hủy
              </Button>
              <Button variant="contained" color="success" onClick={() => handleResolveReport(selectedEquipment._id, selectedReport._id)}
                sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}>
                Hoàn thành
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Báo cáo thiết bị</h3>
            <p className="text-sm text-slate-600 mb-4">
              Thiết bị: <span className="font-semibold text-slate-900">{selectedEquipment?.name}</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-slate-500">Tổng: {selectedEquipment?.quantity || 1}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
              <select value={reportStatusType} onChange={(e) => setReportStatusType(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Chọn trạng thái --</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng thiết bị có vấn đề</label>
              <input type="number" min={1} max={selectedEquipment?.quantity || 1}
                value={reportAffectedQty}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1;
                  setReportAffectedQty(Math.max(1, Math.min(v, selectedEquipment?.quantity || 1)));
                }}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-slate-400 mt-1">Số máy bị ảnh hưởng trong tổng {selectedEquipment?.quantity || 1} máy</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Lý do</label>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                rows={4} className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập lý do báo cáo..." />
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" onClick={() => { setShowReportModal(false); setSelectedEquipment(null); setReportStatusType(''); setReportReason(''); }}
                sx={{ flex: 1, borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2 }}>
                Hủy
              </Button>
              <Button variant="contained" onClick={handleSubmitReport}
                sx={{ flex: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2 }}>
                Gửi báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
