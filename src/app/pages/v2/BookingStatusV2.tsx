import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CalendarCheck2,
  CalendarX2,
  Users,
  Info,
  Trash2,
  RefreshCw,
  Send,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowRightLeft,
  X,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

interface BookingRecord {
  _id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  packageName: string;
  sessionType: string;
  sessionTypeLabel?: string;
  disciplineName: string;
  trainerName: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  statusLabel?: string;
  rejectionReason: string;
  note: string;
  price: number;
  paymentStatus: string;
  paymentMethod: string;
  transferType: string;
  transferStatus: string;
  transferStatusLabel?: string;
  transferReason: string;
  transferToTrainerName: string;
  transferNewDate: string | null;
  transferNewTime: string;
  hasTransfer?: boolean;
  isOverdue?: boolean;
  createdAt: string;
}

interface StatsData {
  total: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  totalPrice: number;
  paidCount: number;
  today?: {
    total: number;
    confirmedCount: number;
  };
  trend?: { date: string; label: string; count: number }[];
}

interface Trainer {
  _id: string;
  fullName: string;
}

const STATUS_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "REJECTED", label: "Bị từ chối" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị từ chối",
};

const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString("vi-VN");

export function BookingStatusV2() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    rejectedCount: 0,
    totalPrice: 0,
    paidCount: 0,
  });
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<BookingRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [transferTarget, setTransferTarget] = useState<BookingRecord | null>(
    null,
  );
  const [detail, setDetail] = useState<BookingRecord | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("limit", "200");
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      const [listRes, statsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/v2/bookings?${params.toString()}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${getApiUrl()}/api/v2/bookings/stats`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const [listData, statsData] = await Promise.all([
        listRes.json(),
        statsRes.json(),
      ]);
      if (!listRes.ok)
        throw new Error(listData.message || "Lỗi tải danh sách lịch đặt");
      setBookings(listData.data || []);
      if (statsData?.data) setStats(statsData.data);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/api/v2/staff?role=PT&status=ACTIVE&limit=100`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        if (res.ok) setTrainers(data.data || []);
      } catch {
        /* ignore */
      }
    };
    fetchTrainers();
  }, []);

  const runAction = async (
    url: string,
    method: string,
    body?: any,
    successMsg?: string,
  ) => {
    setBusyId(url);
    try {
      const res = await fetch(`${getApiUrl()}${url}`, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thao tác thất bại");
      toast.success(successMsg || data.message || "Thành công!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = (b: BookingRecord) => {
    if (
      window.confirm(
        `Xác nhận lịch đặt "${b.bookingCode}" của ${b.customerName}?`,
      )
    ) {
      runAction(`/api/v2/bookings/${b._id}/confirm`, "PUT");
    }
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    runAction(`/api/v2/bookings/${rejectTarget._id}/reject`, "PUT", {
      reason: rejectReason.trim(),
    });
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleCancel = (b: BookingRecord) => {
    if (
      window.confirm(`Hủy lịch đặt "${b.bookingCode}" của ${b.customerName}?`)
    ) {
      runAction(`/api/v2/bookings/${b._id}/cancel`, "PUT", {
        reason: "Hủy bởi lễ tân",
      });
    }
  };

  const handleComplete = (b: BookingRecord) => {
    if (window.confirm(`Hoàn thành buổi tập "${b.bookingCode}"?`)) {
      runAction(`/api/v2/bookings/${b._id}/complete`, "PUT", {
        paymentStatus: b.paymentStatus === "PAID" ? "PAID" : "PENDING",
      });
    }
  };

  const handleDelete = (b: BookingRecord) => {
    if (window.confirm(`Xóa vĩnh viễn lịch đặt "${b.bookingCode}"?`)) {
      runAction(
        `/api/v2/bookings/${b._id}`,
        "DELETE",
        undefined,
        "Đã xóa lịch đặt",
      );
    }
  };

  const handleTransfer = () => {
    if (!transferTarget) return;
    runAction(
      `/api/v2/bookings/${transferTarget._id}/transfer`,
      "PUT",
      {
        type: transferType,
        toTrainerId: toTrainerId || undefined,
        toTrainerName: toTrainerName,
        reason: transferReason.trim(),
        newDate: transferNewDate || undefined,
        newTime: transferNewTime || undefined,
      },
      "Đã gửi yêu cầu chuyển lịch",
    );
    setTransferTarget(null);
    resetTransfer();
  };

  const handleApproveTransfer = (b: BookingRecord) => {
    if (window.confirm(`Duyệt yêu cầu chuyển lịch của "${b.bookingCode}"?`)) {
      runAction(
        `/api/v2/bookings/${b._id}/transfer/approve`,
        "PUT",
        {},
        "Đã duyệt chuyển lịch",
      );
    }
  };

  const handleRejectTransfer = (b: BookingRecord) => {
    const reason = window.prompt("Lý do từ chối chuyển lịch:");
    if (reason === null) return;
    runAction(`/api/v2/bookings/${b._id}/transfer/reject`, "PUT", { reason });
  };

  const [transferType, setTransferType] = useState("TO_COLLEAGUE");
  const [toTrainerId, setToTrainerId] = useState("");
  const [toTrainerName, setToTrainerName] = useState("");
  const [transferNewDate, setTransferNewDate] = useState("");
  const [transferNewTime, setTransferNewTime] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const resetTransfer = () => {
    setTransferType("TO_COLLEAGUE");
    setToTrainerId("");
    setToTrainerName("");
    setTransferNewDate("");
    setTransferNewTime("");
    setTransferReason("");
  };

  const openTransfer = (b: BookingRecord) => {
    resetTransfer();
    setTransferTarget(b);
  };

  const today = toInputDate(new Date());

  const statCards = [
    {
      label: "Chờ xác nhận",
      value: stats.pendingCount,
      color: "text-amber-600",
    },
    {
      label: "Đã xác nhận",
      value: stats.confirmedCount,
      color: "text-sky-600",
    },
    {
      label: "Hoàn thành",
      value: stats.completedCount,
      color: "text-emerald-600",
    },
    {
      label: "Hôm nay",
      value: stats.today?.confirmedCount ?? stats.today?.total ?? 0,
      color: "text-indigo-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý lịch đặt V2
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Xác nhận, từ chối, hoàn thành và chuyển lịch tập cho khách hàng
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
            >
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                {card.label}
              </p>
              <p className={`text-3xl font-black ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === f.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã, tên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  setDateFilter("");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  fetchAll();
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Mã Lịch</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Ngày / Giờ</th>
                  <th className="p-4">PT</th>
                  <th className="p-4">Loại Buổi</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4">Chuyển Lịch</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />{" "}
                      Đang tải...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <CalendarX2 className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-base font-medium text-slate-500">
                          Không có lịch đặt nào
                        </p>
                        <p className="text-sm mt-1">
                          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <button
                          onClick={() => setDetail(b)}
                          className="font-mono text-xs font-bold text-indigo-600 hover:underline"
                        >
                          {b.bookingCode}
                        </button>
                        {b.isOverdue && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            quá hạn
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">
                          {b.customerName}
                        </span>
                        <div className="text-xs text-slate-400">
                          {b.customerPhone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">
                          {b.dateLabel}
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.timeLabel}
                        </div>
                      </td>
                      <td className="p-4 text-xs">{b.trainerName || "—"}</td>
                      <td className="p-4 text-xs">
                        {b.sessionTypeLabel || b.sessionType}
                      </td>
                      <td className="p-4 font-medium text-emerald-600">
                        {formatVnd(b.price)} ₫
                      </td>
                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-xs font-bold ${STATUS_STYLES[b.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {b.status === "PENDING" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          )}
                          {b.statusLabel || STATUS_LABELS[b.status] || b.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {b.hasTransfer ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              b.transferStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.transferStatus === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {b.transferStatusLabel || b.transferStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {b.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirm(b)}
                              disabled={
                                busyId === `/api/v2/bookings/${b._id}/confirm`
                              }
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"
                              title="Xác nhận"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {(b.status === "PENDING" ||
                            b.status === "CONFIRMED") && (
                            <>
                              <button
                                onClick={() => {
                                  setRejectTarget(b);
                                  setRejectReason("");
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Từ chối"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(b)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                title="Hủy"
                              >
                                <CalendarX2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openTransfer(b)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Chuyển lịch"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleComplete(b)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Hoàn thành"
                            >
                              <CalendarCheck2 className="w-4 h-4" />
                            </button>
                          )}
                          {b.hasTransfer &&
                            b.transferStatus === "PENDING_APPROVAL" && (
                              <>
                                <button
                                  onClick={() => handleApproveTransfer(b)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Duyệt chuyển"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(b)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Từ chối chuyển"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          <button
                            onClick={() => handleDelete(b)}
                            disabled={b.status === "COMPLETED"}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Từ chối lịch đặt
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {rejectTarget.bookingCode} · {rejectTarget.customerName} ·{" "}
              {rejectTarget.dateLabel} {rejectTarget.timeLabel}
            </p>
            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {transferTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chuyển lịch đặt
                </h3>
                <p className="text-sm text-slate-500">
                  {transferTarget.bookingCode} · {transferTarget.customerName} ·{" "}
                  {transferTarget.dateLabel} {transferTarget.timeLabel}
                </p>
              </div>
              <button
                onClick={() => setTransferTarget(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Loại chuyển
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTransferType("TO_COLLEAGUE")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${transferType === "TO_COLLEAGUE" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    Chuyển PT khác
                  </button>
                  <button
                    onClick={() => setTransferType("TO_ANOTHER_DAY")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${transferType === "TO_ANOTHER_DAY" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    Dời sang ngày khác
                  </button>
                </div>
              </div>
              {transferType === "TO_COLLEAGUE" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    PT nhận chuyển
                  </label>
                  <select
                    value={toTrainerId}
                    onChange={(e) => {
                      setToTrainerId(e.target.value);
                      const t = trainers.find((x) => x._id === e.target.value);
                      setToTrainerName(t ? t.fullName : "");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn PT --</option>
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {transferType === "TO_ANOTHER_DAY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Ngày mới
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={transferNewDate}
                      onChange={(e) => setTransferNewDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Giờ mới
                    </label>
                    <input
                      type="time"
                      value={transferNewTime}
                      onChange={(e) => setTransferNewTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Lý do chuyển
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập lý do chuyển lịch..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleTransfer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                <Send className="w-4 h-4" /> Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" />{" "}
                  {detail.bookingCode}
                </h3>
                <span
                  className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[detail.status] || ""}`}
                >
                  {detail.statusLabel || STATUS_LABELS[detail.status]}
                </span>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Khách hàng
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.customerName}
                </dd>
                <dd className="text-xs text-slate-500">
                  {detail.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  PT
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.trainerName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Ngày / Giờ
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.dateLabel} {detail.timeLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Loại buổi
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.sessionTypeLabel || detail.sessionType}{" "}
                  {detail.disciplineName ? `· ${detail.disciplineName}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Gói tập
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.packageName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Giá / Thanh toán
                </dt>
                <dd className="font-semibold text-slate-800 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> {formatVnd(detail.price)}{" "}
                  · {detail.paymentStatus}
                </dd>
              </div>
              {detail.note && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400 font-bold uppercase">
                    Ghi chú
                  </dt>
                  <dd className="font-semibold text-slate-800">
                    {detail.note}
                  </dd>
                </div>
              )}
              {detail.status === "REJECTED" && detail.rejectionReason && (
                <div className="col-span-2">
                  <dt className="text-xs text-red-400 font-bold uppercase">
                    Lý do từ chối
                  </dt>
                  <dd className="font-semibold text-red-600">
                    {detail.rejectionReason}
                  </dd>
                </div>
              )}
              {detail.hasTransfer && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">
                    {detail.transferStatusLabel || detail.transferStatus}
                  </p>
                  <p className="text-sm text-amber-800">
                    {detail.transferType === "TO_COLLEAGUE"
                      ? `Chuyển sang PT ${detail.transferToTrainerName || "khác"}`
                      : `Dời sang ${detail.transferNewDate ? new Date(detail.transferNewDate).toLocaleDateString("vi-VN") : "ngày khác"} ${detail.transferNewTime}`}
                    {detail.transferReason ? ` · ${detail.transferReason}` : ""}
                  </p>
                </div>
              )}
            </dl>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setDetail(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CalendarCheck2,
  CalendarX2,
  Users,
  Info,
  Trash2,
  RefreshCw,
  Send,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowRightLeft,
  X,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

interface BookingRecord {
  _id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  packageName: string;
  sessionType: string;
  sessionTypeLabel?: string;
  disciplineName: string;
  trainerName: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  statusLabel?: string;
  rejectionReason: string;
  note: string;
  price: number;
  paymentStatus: string;
  paymentMethod: string;
  transferType: string;
  transferStatus: string;
  transferStatusLabel?: string;
  transferReason: string;
  transferToTrainerName: string;
  transferNewDate: string | null;
  transferNewTime: string;
  hasTransfer?: boolean;
  isOverdue?: boolean;
  createdAt: string;
}

interface StatsData {
  total: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  totalPrice: number;
  paidCount: number;
  today?: {
    total: number;
    confirmedCount: number;
  };
  trend?: { date: string; label: string; count: number }[];
}

interface Trainer {
  _id: string;
  fullName: string;
}

const STATUS_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "REJECTED", label: "Bị từ chối" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị từ chối",
};

const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const formatVnd = (value: number) => (value ?? 0).toLocaleString("vi-VN");

export function BookingStatusV2() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    rejectedCount: 0,
    totalPrice: 0,
    paidCount: 0,
  });
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<BookingRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [transferTarget, setTransferTarget] = useState<BookingRecord | null>(
    null,
  );
  const [detail, setDetail] = useState<BookingRecord | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("limit", "200");
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      const [listRes, statsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/v2/bookings?${params.toString()}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${getApiUrl()}/api/v2/bookings/stats`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const [listData, statsData] = await Promise.all([
        listRes.json(),
        statsRes.json(),
      ]);
      if (!listRes.ok)
        throw new Error(listData.message || "Lỗi tải danh sách lịch đặt");
      setBookings(listData.data || []);
      if (statsData?.data) setStats(statsData.data);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/api/v2/staff?role=PT&status=ACTIVE&limit=100`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        if (res.ok) setTrainers(data.data || []);
      } catch {
        /* ignore */
      }
    };
    fetchTrainers();
  }, []);

  const runAction = async (
    url: string,
    method: string,
    body?: any,
    successMsg?: string,
  ) => {
    setBusyId(url);
    try {
      const res = await fetch(`${getApiUrl()}${url}`, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thao tác thất bại");
      toast.success(successMsg || data.message || "Thành công!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = (b: BookingRecord) => {
    if (
      window.confirm(
        `Xác nhận lịch đặt "${b.bookingCode}" của ${b.customerName}?`,
      )
    ) {
      runAction(`/api/v2/bookings/${b._id}/confirm`, "PUT");
    }
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    runAction(`/api/v2/bookings/${rejectTarget._id}/reject`, "PUT", {
      reason: rejectReason.trim(),
    });
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleCancel = (b: BookingRecord) => {
    if (
      window.confirm(`Hủy lịch đặt "${b.bookingCode}" của ${b.customerName}?`)
    ) {
      runAction(`/api/v2/bookings/${b._id}/cancel`, "PUT", {
        reason: "Hủy bởi lễ tân",
      });
    }
  };

  const handleComplete = (b: BookingRecord) => {
    if (window.confirm(`Hoàn thành buổi tập "${b.bookingCode}"?`)) {
      runAction(`/api/v2/bookings/${b._id}/complete`, "PUT", {
        paymentStatus: b.paymentStatus === "PAID" ? "PAID" : "PENDING",
      });
    }
  };

  const handleDelete = (b: BookingRecord) => {
    if (window.confirm(`Xóa vĩnh viễn lịch đặt "${b.bookingCode}"?`)) {
      runAction(
        `/api/v2/bookings/${b._id}`,
        "DELETE",
        undefined,
        "Đã xóa lịch đặt",
      );
    }
  };

  const handleTransfer = () => {
    if (!transferTarget) return;
    runAction(
      `/api/v2/bookings/${transferTarget._id}/transfer`,
      "PUT",
      {
        type: transferType,
        toTrainerId: toTrainerId || undefined,
        toTrainerName: toTrainerName,
        reason: transferReason.trim(),
        newDate: transferNewDate || undefined,
        newTime: transferNewTime || undefined,
      },
      "Đã gửi yêu cầu chuyển lịch",
    );
    setTransferTarget(null);
    resetTransfer();
  };

  const handleApproveTransfer = (b: BookingRecord) => {
    if (window.confirm(`Duyệt yêu cầu chuyển lịch của "${b.bookingCode}"?`)) {
      runAction(
        `/api/v2/bookings/${b._id}/transfer/approve`,
        "PUT",
        {},
        "Đã duyệt chuyển lịch",
      );
    }
  };

  const handleRejectTransfer = (b: BookingRecord) => {
    const reason = window.prompt("Lý do từ chối chuyển lịch:");
    if (reason === null) return;
    runAction(`/api/v2/bookings/${b._id}/transfer/reject`, "PUT", { reason });
  };

  const [transferType, setTransferType] = useState("TO_COLLEAGUE");
  const [toTrainerId, setToTrainerId] = useState("");
  const [toTrainerName, setToTrainerName] = useState("");
  const [transferNewDate, setTransferNewDate] = useState("");
  const [transferNewTime, setTransferNewTime] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const resetTransfer = () => {
    setTransferType("TO_COLLEAGUE");
    setToTrainerId("");
    setToTrainerName("");
    setTransferNewDate("");
    setTransferNewTime("");
    setTransferReason("");
  };

  const openTransfer = (b: BookingRecord) => {
    resetTransfer();
    setTransferTarget(b);
  };

  const today = toInputDate(new Date());

  const statCards = [
    {
      label: "Chờ xác nhận",
      value: stats.pendingCount,
      color: "text-amber-600",
    },
    {
      label: "Đã xác nhận",
      value: stats.confirmedCount,
      color: "text-sky-600",
    },
    {
      label: "Hoàn thành",
      value: stats.completedCount,
      color: "text-emerald-600",
    },
    {
      label: "Hôm nay",
      value: stats.today?.confirmedCount ?? stats.today?.total ?? 0,
      color: "text-indigo-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý lịch đặt V2
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Xác nhận, từ chối, hoàn thành và chuyển lịch tập cho khách hàng
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
            >
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                {card.label}
              </p>
              <p className={`text-3xl font-black ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === f.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã, tên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  setDateFilter("");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  fetchAll();
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Mã Lịch</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Ngày / Giờ</th>
                  <th className="p-4">PT</th>
                  <th className="p-4">Loại Buổi</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4">Chuyển Lịch</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />{" "}
                      Đang tải...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <CalendarX2 className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-base font-medium text-slate-500">
                          Không có lịch đặt nào
                        </p>
                        <p className="text-sm mt-1">
                          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <button
                          onClick={() => setDetail(b)}
                          className="font-mono text-xs font-bold text-indigo-600 hover:underline"
                        >
                          {b.bookingCode}
                        </button>
                        {b.isOverdue && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            quá hạn
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">
                          {b.customerName}
                        </span>
                        <div className="text-xs text-slate-400">
                          {b.customerPhone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">
                          {b.dateLabel}
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.timeLabel}
                        </div>
                      </td>
                      <td className="p-4 text-xs">{b.trainerName || "—"}</td>
                      <td className="p-4 text-xs">
                        {b.sessionTypeLabel || b.sessionType}
                      </td>
                      <td className="p-4 font-medium text-emerald-600">
                        {formatVnd(b.price)} ₫
                      </td>
                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-xs font-bold ${STATUS_STYLES[b.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {b.status === "PENDING" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          )}
                          {b.statusLabel || STATUS_LABELS[b.status] || b.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {b.hasTransfer ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              b.transferStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.transferStatus === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {b.transferStatusLabel || b.transferStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {b.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirm(b)}
                              disabled={
                                busyId === `/api/v2/bookings/${b._id}/confirm`
                              }
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"
                              title="Xác nhận"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {(b.status === "PENDING" ||
                            b.status === "CONFIRMED") && (
                            <>
                              <button
                                onClick={() => {
                                  setRejectTarget(b);
                                  setRejectReason("");
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Từ chối"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(b)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                title="Hủy"
                              >
                                <CalendarX2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openTransfer(b)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Chuyển lịch"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleComplete(b)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Hoàn thành"
                            >
                              <CalendarCheck2 className="w-4 h-4" />
                            </button>
                          )}
                          {b.hasTransfer &&
                            b.transferStatus === "PENDING_APPROVAL" && (
                              <>
                                <button
                                  onClick={() => handleApproveTransfer(b)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Duyệt chuyển"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(b)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Từ chối chuyển"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          <button
                            onClick={() => handleDelete(b)}
                            disabled={b.status === "COMPLETED"}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Từ chối lịch đặt
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {rejectTarget.bookingCode} · {rejectTarget.customerName} ·{" "}
              {rejectTarget.dateLabel} {rejectTarget.timeLabel}
            </p>
            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {transferTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chuyển lịch đặt
                </h3>
                <p className="text-sm text-slate-500">
                  {transferTarget.bookingCode} · {transferTarget.customerName} ·{" "}
                  {transferTarget.dateLabel} {transferTarget.timeLabel}
                </p>
              </div>
              <button
                onClick={() => setTransferTarget(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Loại chuyển
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTransferType("TO_COLLEAGUE")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${transferType === "TO_COLLEAGUE" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    Chuyển PT khác
                  </button>
                  <button
                    onClick={() => setTransferType("TO_ANOTHER_DAY")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${transferType === "TO_ANOTHER_DAY" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    Dời sang ngày khác
                  </button>
                </div>
              </div>
              {transferType === "TO_COLLEAGUE" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    PT nhận chuyển
                  </label>
                  <select
                    value={toTrainerId}
                    onChange={(e) => {
                      setToTrainerId(e.target.value);
                      const t = trainers.find((x) => x._id === e.target.value);
                      setToTrainerName(t ? t.fullName : "");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn PT --</option>
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {transferType === "TO_ANOTHER_DAY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Ngày mới
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={transferNewDate}
                      onChange={(e) => setTransferNewDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Giờ mới
                    </label>
                    <input
                      type="time"
                      value={transferNewTime}
                      onChange={(e) => setTransferNewTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Lý do chuyển
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập lý do chuyển lịch..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleTransfer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                <Send className="w-4 h-4" /> Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" />{" "}
                  {detail.bookingCode}
                </h3>
                <span
                  className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[detail.status] || ""}`}
                >
                  {detail.statusLabel || STATUS_LABELS[detail.status]}
                </span>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Khách hàng
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.customerName}
                </dd>
                <dd className="text-xs text-slate-500">
                  {detail.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  PT
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.trainerName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Ngày / Giờ
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.dateLabel} {detail.timeLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Loại buổi
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.sessionTypeLabel || detail.sessionType}{" "}
                  {detail.disciplineName ? `· ${detail.disciplineName}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Gói tập
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.packageName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 font-bold uppercase">
                  Giá / Thanh toán
                </dt>
                <dd className="font-semibold text-slate-800 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> {formatVnd(detail.price)}{" "}
                  · {detail.paymentStatus}
                </dd>
              </div>
              {detail.note && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400 font-bold uppercase">
                    Ghi chú
                  </dt>
                  <dd className="font-semibold text-slate-800">
                    {detail.note}
                  </dd>
                </div>
              )}
              {detail.status === "REJECTED" && detail.rejectionReason && (
                <div className="col-span-2">
                  <dt className="text-xs text-red-400 font-bold uppercase">
                    Lý do từ chối
                  </dt>
                  <dd className="font-semibold text-red-600">
                    {detail.rejectionReason}
                  </dd>
                </div>
              )}
              {detail.hasTransfer && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">
                    {detail.transferStatusLabel || detail.transferStatus}
                  </p>
                  <p className="text-sm text-amber-800">
                    {detail.transferType === "TO_COLLEAGUE"
                      ? `Chuyển sang PT ${detail.transferToTrainerName || "khác"}`
                      : `Dời sang ${detail.transferNewDate ? new Date(detail.transferNewDate).toLocaleDateString("vi-VN") : "ngày khác"} ${detail.transferNewTime}`}
                    {detail.transferReason ? ` · ${detail.transferReason}` : ""}
                  </p>
                </div>
              )}
            </dl>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setDetail(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
