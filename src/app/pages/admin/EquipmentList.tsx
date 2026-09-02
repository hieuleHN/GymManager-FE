import { AdminLayout } from "../../components/AdminLayout";
import { Pagination } from "../../components/Pagination";
import {
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Download,
  BellRing,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useClub } from "../../context/ClubContext";
import { toast } from "sonner";
import { getAuthHeaders, getApiUrl } from "../../context/AuthContext";
import { Button } from "@mui/material";

const STATUS_OPTIONS = ["hoạt động", "bảo trì", "hỏng hóc", "thiếu linh kiện"];

export function EquipmentList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [searchTerm, setSearchTerm] = useState("");
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

  const [reportStatusType, setReportStatusType] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportAffectedQty, setReportAffectedQty] = useState(1);

  const [resolveCost, setResolveCost] = useState("");
  const [resolveDowntime, setResolveDowntime] = useState("");
  const [resolveResult, setResolveResult] = useState("");
  const [resolveAssignee, setResolveAssignee] = useState("");

  const [alerts, setAlerts] = useState<any>({
    maintenance_due: [],
    warranty_expiring: [],
    overdue_tickets: [],
    broken_long_time: [],
  });

  const fetchEquipment = async (p = page) => {
    setLoading(true);
    try {
      const base = selectedClub !== "all" ? `?locationId=${selectedClub}` : "?";
      const url = `${getApiUrl()}/api/equipments${base}&page=${p}&limit=15`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải danh sách thất bại");
      setEquipment(data?.data || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/equipments/alerts", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data) {
        setAlerts({
          maintenance_due:
            data.maintenance_due || data.data?.maintenance_due || [],
          warranty_expiring:
            data.warranty_expiring || data.data?.warranty_expiring || [],
          overdue_tickets:
            data.overdue_tickets || data.data?.overdue_tickets || [],
          broken_long_time:
            data.broken_long_time || data.data?.broken_long_time || [],
        });
      }
    } catch (err) {
      console.error("Lỗi tải cảnh báo:", err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEquipment(1);
    fetchAlerts();
  }, [selectedClub]);

  const handleEdit = (id: string) => navigate(`/admin/equipment/${id}/edit`);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/equipments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xóa thiết bị thất bại");
      }
      toast.success("Xóa thiết bị thành công!");
      fetchEquipment(page);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReport = (item: any) => {
    setSelectedEquipment(item);
    setReportStatusType("");
    setReportReason("");
    setReportAffectedQty(1);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do!");
      return;
    }
    if (!selectedEquipment) return;
    try {
      const res = await fetch(
        `${getApiUrl()}/api/equipments/${selectedEquipment._id}/report`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            statusType: reportStatusType || undefined,
            reason: reportReason,
            affectedQuantity: reportAffectedQty,
          }),
        },
      );
      if (res.ok) {
        toast.success("Đã gửi báo cáo");
        setShowReportModal(false);
        setSelectedEquipment(null);
        setReportStatusType("");
        setReportReason("");
        setReportAffectedQty(1);
        fetchEquipment(page);
        fetchAlerts();
      } else {
        toast.error("Gửi báo cáo thất bại");
      }
    } catch {
      toast.error("Gửi báo cáo thất bại");
    }
  };

  const handleResolveReport = async (equipmentId: string, reportId: string) => {
    try {
      const res = await fetch(
        `${getApiUrl()}/api/equipments/${equipmentId}/report/${reportId}/resolve`,
        {
          method: "PUT",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            cost: Number(resolveCost) || 0,
            downtime_days: Number(resolveDowntime) || 0,
            result: resolveResult,
            assigned_to: resolveAssignee,
          }),
        },
      );
      if (res.ok) {
        toast.success("Đã hoàn thành báo cáo");
        setShowReportDetailModal(false);
        setShowReportListModal(false);
        setSelectedReport(null);
        setSelectedEquipment(null);
        setResolveCost("");
        setResolveDowntime("");
        setResolveResult("");
        setResolveAssignee("");
        fetchEquipment(page);
        fetchAlerts();
      } else {
        toast.error("Hoàn thành báo cáo thất bại");
      }
    } catch {
      toast.error("Hoàn thành báo cáo thất bại");
    }
  };

  const handleExportExcel = async () => {
    try {
      const base = selectedClub !== "all" ? `?locationId=${selectedClub}` : "";
      const url = `${getApiUrl()}/api/equipments/export/excel${base}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Xuất báo cáo thất bại");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Bao_Cao_Thiet_Bi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Xuất file Excel thành công!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleViewReport = (item: any, report: any) => {
    setSelectedEquipment(item);
    setSelectedReport(report);
    setResolveCost("");
    setResolveDowntime("");
    setResolveResult("");
    setResolveAssignee("");
    setShowReportDetailModal(true);
  };

  const handleOpenReportList = (item: any) => {
    setSelectedEquipment(item);
    setShowReportListModal(true);
  };

  const pendingReports = (item: any) =>
    item.reports?.filter((r: any) => r.status === "pending") || [];

  const getStatusDisplay = (item: any) => {
    if (item.status === "bảo trì")
      return { label: "bảo trì", color: "text-yellow-700 bg-yellow-100" };
    if (item.status === "hỏng hóc")
      return { label: "hỏng hóc", color: "text-red-700 bg-red-100" };
    if (item.status === "thiếu linh kiện")
      return {
        label: "thiếu linh kiện",
        color: "text-orange-700 bg-orange-100",
      };
    return { label: "hoạt động", color: "text-green-700 bg-green-100" };
  };

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quản lý Thiết bị & Tài sản
          </h1>
          <p className="text-slate-600">
            Kiểm soát vòng đời, bảo trì và hiệu suất thiết bị
          </p>
        </div>

        {/* CẢNH BÁO BẢO HÀNH & SỰ CỐ - CHUẨN 30 NGÀY */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-orange-500" /> Cảnh báo Bảo hành &
            Sự cố (30 ngày tới)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.maintenance_due.length === 0 &&
              alerts.warranty_expiring.length === 0 &&
              alerts.broken_long_time.length === 0 &&
              alerts.overdue_tickets.length === 0 && (
                <p className="text-sm text-slate-500 italic col-span-2">
                  Không có cảnh báo nào cần xử lý ngay.
                </p>
              )}

            {/* 1. Đến hạn bảo trì */}
            {alerts.maintenance_due.map((eq: any) => (
              <div
                key={`m-${eq._id}`}
                className="flex items-center justify-between bg-yellow-50 p-4 rounded-xl border border-yellow-200"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse mt-1.5"></span>
                  <div>
                    <p className="text-sm font-bold text-yellow-900">
                      {eq.name}
                    </p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      Đã đến hạn bảo trì định kỳ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenReportList(eq)}
                  className="text-xs px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
                >
                  Xử lý
                </button>
              </div>
            ))}

            {/* 2. Sắp hết hạn bảo hành trong 30 ngày */}
            {alerts.warranty_expiring.map((eq: any) => (
              <div
                key={`w-${eq._id}`}
                className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5"></span>
                  <div>
                    <p className="text-sm font-bold text-blue-900">{eq.name}</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Sắp hết hạn bảo hành trong vòng 30 ngày
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReport(eq)}
                  className="text-xs px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Gửi đi BH
                </button>
              </div>
            ))}

            {/* 3. Hỏng quá N ngày (7 ngày) */}
            {alerts.broken_long_time.map((eq: any) => (
              <div
                key={`b-${eq._id}`}
                className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-200"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-1.5"></span>
                  <div>
                    <p className="text-sm font-bold text-red-900">{eq.name}</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Nằm đắp chiếu quá 7 ngày chưa sửa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenReportList(eq)}
                  className="text-xs px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-colors"
                >
                  Sửa gấp
                </button>
              </div>
            ))}

            {/* 4. Phiếu quá hạn */}
            {alerts.overdue_tickets.map((item: any) => (
              <div
                key={`ot-${item.equipment_id}`}
                className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5"></span>
                  <div>
                    <p className="text-sm font-bold text-orange-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Có {item.tickets.length} phiếu yêu cầu quá hạn xử lý
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleOpenReportList({
                      _id: item.equipment_id,
                      name: item.name,
                      reports: item.tickets,
                    })
                  }
                  className="text-xs px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg font-semibold transition-colors"
                >
                  Xem phiếu
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên thiết bị, nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button
              variant="contained"
              onClick={handleExportExcel}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                display: "flex",
                gap: 1,
                fontWeight: "bold",
              }}
            >
              <Download className="w-5 h-5" /> Xuất Excel KPI
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tên thiết bị
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Nguyên giá
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    SL
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Bảo hành
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Thời gian SD
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Phí sửa (Lũy kế)
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    TCO (Tổng CF)
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Downtime
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item: any) => {
                  const statusInfo = getStatusDisplay(item);

                  const purchaseDate = new Date(
                    item.purchase_date || item.createdAt,
                  );
                  const usageDays = Math.max(
                    1,
                    Math.floor(
                      (new Date().getTime() - purchaseDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  );
                  const tco =
                    (item.unitPrice || 0) + (item.total_maintenance_cost || 0);
                  const isHighRisk =
                    item.total_maintenance_cost > item.unitPrice * 0.5 ||
                    item.total_downtime_days > 30;

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td
                        className="px-3 py-4 text-sm font-semibold text-slate-900 truncate"
                        title={item.name}
                      >
                        {item.name}
                        {isHighRisk && (
                          <span className="ml-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                            Cần thay mới
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 truncate">
                        {item.unitPrice?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 truncate">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 truncate">
                        {item.warranty_period} tháng
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-600 truncate">
                        {usageDays} ngày
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-red-600 truncate">
                        {item.total_maintenance_cost?.toLocaleString("vi-VN") ||
                          0}
                        đ
                      </td>
                      <td className="px-3 py-4 text-sm font-bold text-indigo-700 truncate">
                        {tco.toLocaleString("vi-VN")}đ
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-600 truncate">
                        {item.total_downtime_days || 0} ngày
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1.5 items-center justify-center">
                          <button
                            onClick={() => handleEdit(item._id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => handleReport(item)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Báo cáo hỏng/bảo trì"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            {pendingReports(item).length > 0 && (
                              <button
                                onClick={() => handleOpenReportList(item)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                title="Danh sách báo cáo đang chờ"
                              >
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
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      Không tìm thấy thiết bị nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {!loading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={15}
              onPageChange={(p) => {
                setPage(p);
                fetchEquipment(p);
              }}
            />
          )}
        </div>
      </div>

      {showReportListModal && selectedEquipment && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => {
            setShowReportListModal(false);
            setSelectedEquipment(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Danh sách báo cáo & bảo trì chờ xử lý
              </h3>
              <button
                onClick={() => {
                  setShowReportListModal(false);
                  setSelectedEquipment(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-indigo-600 mb-1">
                Đang xử lý cho thiết bị:
              </p>
              <p className="text-lg font-bold text-indigo-950">
                {selectedEquipment.name}
              </p>
            </div>
            {pendingReports(selectedEquipment).length === 0 ? (
              <p className="text-center text-slate-500 py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Không có phiếu nào đang chờ xử lý
              </p>
            ) : (
              <div className="space-y-3">
                {pendingReports(selectedEquipment).map(
                  (report: any, idx: number) => (
                    <div
                      key={report._id}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                (report.statusType || report.reason).includes(
                                  "bảo trì",
                                )
                                  ? "bg-yellow-100 text-yellow-700"
                                  : (
                                        report.statusType || report.reason
                                      ).includes("hỏng")
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {report.statusType || "Cảnh báo"}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">
                            {report.reason}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Ngày lập:{" "}
                            {new Date(report.reportedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleViewReport(selectedEquipment, report)
                            }
                            className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                          >
                            Cập nhật chi phí & Chốt
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showReportDetailModal && selectedEquipment && selectedReport && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => {
            setShowReportDetailModal(false);
            setSelectedReport(null);
            setSelectedEquipment(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Nghiệm thu bảo trì / sửa chữa
              </h3>
              <button
                onClick={() => {
                  setShowReportDetailModal(false);
                  setSelectedReport(null);
                  setSelectedEquipment(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-sm font-bold text-slate-800">
                {selectedEquipment.name}
              </p>
              <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 italic">
                "{selectedReport.reason}"
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Người phụ trách sửa chữa
                </label>
                <input
                  type="text"
                  value={resolveAssignee}
                  onChange={(e) => setResolveAssignee(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nhập tên nhân viên / kỹ thuật viên..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nội dung / Kết quả xử lý
                </label>
                <textarea
                  value={resolveResult}
                  onChange={(e) => setResolveResult(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ví dụ: Đã thay bo mạch, vệ sinh tra dầu..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Chi phí sửa chữa (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={resolveCost}
                  onChange={(e) => setResolveCost(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Ví dụ: 1500000"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống sẽ tự động cộng dồn vào tổng chi phí của thiết bị
                  này.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Số ngày chết máy (Downtime)
                </label>
                <input
                  type="number"
                  min="0"
                  value={resolveDowntime}
                  onChange={(e) => setResolveDowntime(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Ví dụ: 3"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Dùng để tính KPI tỷ lệ sẵn sàng (Availability) trên Excel.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowReportDetailModal(false);
                  setSelectedReport(null);
                  setSelectedEquipment(null);
                }}
                sx={{
                  flex: 1,
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  handleResolveReport(selectedEquipment._id, selectedReport._id)
                }
                sx={{
                  flex: 1,
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                  boxShadow: "none",
                }}
              >
                Xác nhận hoàn thành
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Tạo phiếu sự cố / Bảo trì
            </h3>
            <p className="text-sm text-slate-600 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Thiết bị:{" "}
              <span className="font-bold text-slate-900">
                {selectedEquipment?.name}
              </span>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={reportStatusType}
                  onChange={(e) => setReportStatusType(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn phân loại sự cố --</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Mô tả lý do / Tình trạng
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                  placeholder="Ví dụ: Đứt cáp ròng rọc, cần thay thế khẩn cấp..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedEquipment(null);
                  setReportStatusType("");
                  setReportReason("");
                }}
                sx={{
                  flex: 1,
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitReport}
                sx={{
                  flex: 1,
                  bgcolor: "#4f46e5",
                  "&:hover": { bgcolor: "#4338ca" },
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                  boxShadow: "none",
                }}
              >
                Gửi phiếu yêu cầu
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
