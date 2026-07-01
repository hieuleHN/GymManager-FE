import { useState, useEffect } from "react";
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Check,
  X,
  Info,
} from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { getAuthHeaders } from "../../context/AuthContext";
import { toast } from "sonner";

interface Booking {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string; email: string };
  trainerId: { _id: string; fullName: string };
  date: string;
  time: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  rejectionReason?: string;
  note?: string;
  locationId?: { _id: string; title: string };
  createdAt: string;
}

export function ScheduleConfirmations() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch("/api/bookings?limit=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách lịch đặt!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: "PUT",
        headers,
      });
      if (res.ok) {
        toast.success("Đã xác nhận lịch tập!");
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi xác nhận!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/bookings/${rejectBookingId}/reject`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });
      if (res.ok) {
        toast.success("Đã từ chối lịch tập!");
        setShowRejectModal(false);
        setRejectBookingId("");
        setRejectionReason("");
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi từ chối!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    }
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "rejected":
        return "Đã từ chối";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const rejectedCount = bookings.filter((b) => b.status === "rejected").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Xác nhận lịch tập
          </h1>
          <p className="text-slate-600 mt-2">
            Xác nhận yêu cầu đặt lịch từ hội viên
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6" />
              <h3 className="font-semibold">Chờ xác nhận</h3>
            </div>
            <p className="text-4xl font-bold">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <h3 className="font-semibold text-slate-900">Đã xác nhận</h3>
            </div>
            <p className="text-4xl font-bold text-slate-900">{confirmedCount}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2 text-red-600">
              <X className="w-6 h-6" />
              <h3 className="font-semibold text-slate-900">Đã từ chối</h3>
            </div>
            <p className="text-4xl font-bold text-slate-900">{rejectedCount}</p>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Danh sách yêu cầu
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Đang tải...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Chưa có yêu cầu đặt lịch nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center ring-2 ring-slate-200">
                      <User className="w-8 h-8 text-indigo-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {booking.customerId?.fullName || "N/A"}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}
                        >
                          {getStatusText(booking.status)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          Ngày:{" "}
                          <span className="font-semibold text-slate-900">
                            {new Date(booking.date).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          Giờ:{" "}
                          <span className="font-semibold text-slate-900">
                            {booking.time}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          HLV:{" "}
                          <span className="font-semibold text-slate-900">
                            {booking.trainerId?.fullName || "N/A"}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Yêu cầu lúc:{" "}
                          {new Date(booking.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>

                      {booking.note && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                          <span className="font-semibold text-blue-900">
                            Ghi chú:
                          </span>
                          <span className="text-blue-800 ml-2">
                            {booking.note}
                          </span>
                        </div>
                      )}

                      {booking.rejectionReason && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm mt-2">
                          <span className="font-semibold text-red-900">
                            Lý do từ chối:
                          </span>
                          <span className="text-red-800 ml-2">
                            {booking.rejectionReason}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Info className="w-4 h-4" />
                        Chi tiết
                      </button>

                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              setRejectBookingId(booking._id);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">
                  Chi tiết yêu cầu
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center ring-2 ring-slate-200">
                    <User className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      {selectedBooking.customerId?.fullName || "N/A"}
                    </h4>
                    <p className="text-slate-600">
                      SĐT: {selectedBooking.customerId?.phone || "N/A"}
                    </p>
                    <p className="text-slate-600">
                      Email: {selectedBooking.customerId?.email || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Ngày đặt lịch
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {new Date(selectedBooking.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Khung giờ
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {selectedBooking.time}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Huấn luyện viên
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {selectedBooking.trainerId?.fullName || "N/A"}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Trạng thái
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}
                      >
                        {getStatusText(selectedBooking.status)}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedBooking.note && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <label className="text-sm font-medium text-blue-900">
                      Ghi chú của hội viên
                    </label>
                    <p className="text-blue-800 mt-1">{selectedBooking.note}</p>
                  </div>
                )}

                {selectedBooking.rejectionReason && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <label className="text-sm font-medium text-red-900">
                      Lý do từ chối
                    </label>
                    <p className="text-red-800 mt-1">
                      {selectedBooking.rejectionReason}
                    </p>
                  </div>
                )}

                {selectedBooking.status === "pending" && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        handleConfirm(selectedBooking._id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Xác nhận lịch tập
                    </button>
                    <button
                      onClick={() => {
                        setRejectBookingId(selectedBooking._id);
                        setShowDetailModal(false);
                        setShowRejectModal(true);
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Từ chối yêu cầu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Từ chối lịch đặt
                </h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Lý do từ chối *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối lịch đặt..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}