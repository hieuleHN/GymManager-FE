import { useState } from "react";
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

interface ScheduleRequest {
  id: string;
  memberName: string;
  memberAvatar: string;
  memberPhone: string;
  memberEmail: string;
  requestedDate: string;
  requestedTime: string;
  service: string;
  note?: string;
  requestedAt: string;
  status: "pending" | "confirmed" | "rejected";
}

export function ScheduleConfirmations() {
  const [requests] = useState<ScheduleRequest[]>([
    {
      id: "1",
      memberName: "Nguyễn Văn A",
      memberAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
      memberPhone: "0901234567",
      memberEmail: "nguyenvana@email.com",
      requestedDate: "2026-06-10",
      requestedTime: "08:00 - 09:00",
      service: "Personal Training",
      note: "Muốn tập trọng tâm vào cardio",
      requestedAt: "2026-06-04T10:30:00",
      status: "pending",
    },
    {
      id: "2",
      memberName: "Trần Thị B",
      memberAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
      memberPhone: "0912345678",
      memberEmail: "tranthib@email.com",
      requestedDate: "2026-06-11",
      requestedTime: "15:00 - 16:00",
      service: "Yoga",
      requestedAt: "2026-06-04T09:15:00",
      status: "pending",
    },
    {
      id: "3",
      memberName: "Lê Văn C",
      memberAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
      memberPhone: "0923456789",
      memberEmail: "levanc@email.com",
      requestedDate: "2026-06-09",
      requestedTime: "10:00 - 11:00",
      service: "Boxing",
      requestedAt: "2026-06-03T16:20:00",
      status: "confirmed",
    },
  ]);

  const [selectedRequest, setSelectedRequest] =
    useState<ScheduleRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getStatusColor = (status: ScheduleRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
    }
  };

  const getStatusText = (status: ScheduleRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "rejected":
        return "Đã từ chối";
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

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
            <p className="text-4xl font-bold text-slate-900">
              {requests.filter((r) => r.status === "confirmed").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2 text-red-600">
              <X className="w-6 h-6" />
              <h3 className="font-semibold text-slate-900">Đã từ chối</h3>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {requests.filter((r) => r.status === "rejected").length}
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Danh sách yêu cầu
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={request.memberAvatar}
                    alt={request.memberName}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {request.memberName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Ngày:{" "}
                        <span className="font-semibold text-slate-900">
                          {new Date(request.requestedDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        Giờ:{" "}
                        <span className="font-semibold text-slate-900">
                          {request.requestedTime}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Dịch vụ:{" "}
                        <span className="font-semibold text-slate-900">
                          {request.service}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Yêu cầu lúc:{" "}
                        {new Date(request.requestedAt).toLocaleString("vi-VN")}
                      </div>
                    </div>

                    {request.note && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                        <span className="font-semibold text-blue-900">
                          Ghi chú:
                        </span>
                        <span className="text-blue-800 ml-2">
                          {request.note}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Chi tiết
                    </button>

                    {request.status === "pending" && (
                      <>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Xác nhận
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2">
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
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
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
                  <img
                    src={selectedRequest.memberAvatar}
                    alt={selectedRequest.memberName}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      {selectedRequest.memberName}
                    </h4>
                    <p className="text-slate-600">
                      📞 {selectedRequest.memberPhone}
                    </p>
                    <p className="text-slate-600">
                      ✉️ {selectedRequest.memberEmail}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Ngày đặt lịch
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {new Date(
                        selectedRequest.requestedDate,
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Khung giờ
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {selectedRequest.requestedTime}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Dịch vụ
                    </label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {selectedRequest.service}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="text-sm font-medium text-slate-700">
                      Trạng thái
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}
                      >
                        {getStatusText(selectedRequest.status)}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedRequest.note && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <label className="text-sm font-medium text-blue-900">
                      Ghi chú của hội viên
                    </label>
                    <p className="text-blue-800 mt-1">{selectedRequest.note}</p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                      Xác nhận lịch tập
                    </button>
                    <button className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                      Từ chối yêu cầu
                    </button>
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
