import { useState, useEffect } from "react";
import {
  Mail,
  Edit2,
  Save,
  X,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import axios from "axios";
import { toast } from "sonner";

// Cập nhật Interface khớp với dữ liệu từ Backend trả về
interface CV {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  description: string;
  cvUrl: string;
  status: "Chờ xử lý" | "Hẹn phỏng vấn" | "Đã duyệt" | "Từ chối";
  createdAt: string;
}

export function RecruitmentManagement() {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [recruitmentEmail, setRecruitmentEmail] = useState(
    "recruitment@zenfitness.com",
  );
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);

  // State chứa dữ liệu thật từ Backend
  const [recruitments, setRecruitments] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách khi trang vừa load
  useEffect(() => {
    fetchRecruitments();
  }, []);

  const fetchRecruitments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/recruitments",
      );
      setRecruitments(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách ứng viên!");
    } finally {
      setLoading(false);
    }
  };

  // Hàm gọi API cập nhật trạng thái
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/recruitments/${id}/status`, {
        status: newStatus,
      });
      toast.success("Đã cập nhật trạng thái hồ sơ");

      // Nếu đang mở Modal thì cập nhật luôn trạng thái trong Modal
      if (selectedCV && selectedCV._id === id) {
        setSelectedCV({ ...selectedCV, status: newStatus as CV["status"] });
      }

      fetchRecruitments(); // Tải lại danh sách bên ngoài
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleEmailSave = () => {
    setIsEditingEmail(false);
    toast.success("Đã lưu cấu hình Email");
  };

  const getStatusColor = (status: CV["status"]) => {
    switch (status) {
      case "Chờ xử lý":
        return "bg-blue-100 text-blue-700";
      case "Hẹn phỏng vấn":
        return "bg-yellow-100 text-yellow-700";
      case "Đã duyệt":
        return "bg-green-100 text-green-700";
      case "Từ chối":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Quản lý tuyển dụng
          </h1>
          <p className="text-slate-600 mt-2">
            Quản lý CV ứng tuyển và thông tin liên hệ
          </p>
        </div>

        {/* Email Configuration (Giữ nguyên giao diện của ông) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Email nhận CV
                </h2>
                <p className="text-sm text-slate-600">
                  Email để nhận CV từ ứng viên
                </p>
              </div>
            </div>
            {!isEditingEmail ? (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Thay đổi
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleEmailSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditingEmail(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            )}
          </div>
          {isEditingEmail ? (
            <input
              type="email"
              value={recruitmentEmail}
              onChange={(e) => setRecruitmentEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="email@example.com"
            />
          ) : (
            <div className="px-4 py-3 bg-slate-50 rounded-lg">
              <p className="text-lg font-semibold text-slate-900">
                {recruitmentEmail}
              </p>
            </div>
          )}
        </div>

        {/* CV List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Danh sách CV ứng tuyển
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Tổng cộng {recruitments.length} CV
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Đang tải dữ liệu...
              </div>
            ) : recruitments.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                Chưa có hồ sơ nào.
              </div>
            ) : (
              recruitments.map((cv) => (
                <div
                  key={cv._id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {cv.fullName}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cv.status)}`}
                            >
                              {cv.status}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Vị trí:{" "}
                              <span className="font-semibold text-slate-900">
                                {cv.position}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {cv.email}
                              </div>
                              <div>📞 {cv.phone}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Nộp ngày:{" "}
                              {new Date(cv.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </div>
                          </div>
                          {cv.description && (
                            <p className="mt-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                              {cv.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <FileText className="w-4 h-4" />
                            {/* Cắt lấy tên file từ chuỗi URL */}
                            <span className="font-medium">
                              {cv.cvUrl.split("/").pop()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedCV(cv)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      <a
                        href={`http://localhost:5000${cv.cvUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Tải CV
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CV Detail Modal */}
        {selectedCV && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">
                  Chi tiết CV - {selectedCV.fullName}
                </h3>
                <button
                  onClick={() => setSelectedCV(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Họ tên
                    </label>
                    <p className="text-slate-900 font-semibold mt-1">
                      {selectedCV.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Vị trí ứng tuyển
                    </label>
                    <p className="text-slate-900 font-semibold mt-1">
                      {selectedCV.position}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <p className="text-slate-900 mt-1">{selectedCV.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Số điện thoại
                    </label>
                    <p className="text-slate-900 mt-1">{selectedCV.phone}</p>
                  </div>
                </div>

                {selectedCV.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Mô tả
                    </label>
                    <p className="text-slate-900 mt-2 p-4 bg-slate-50 rounded-lg">
                      {selectedCV.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Đổi trạng thái
                  </label>
                  <select
                    value={selectedCV.status}
                    onChange={(e) =>
                      handleStatusChange(selectedCV._id, e.target.value)
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
                  >
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Hẹn phỏng vấn">Hẹn phỏng vấn</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Từ chối">Từ chối</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() =>
                      handleStatusChange(selectedCV._id, "Đã duyệt")
                    }
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Duyệt ứng viên
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(selectedCV._id, "Từ chối")
                    }
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
