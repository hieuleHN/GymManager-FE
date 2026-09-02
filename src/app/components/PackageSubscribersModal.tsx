import { useEffect, useState } from "react";
import { X, Search, Mail, Phone, CalendarDays, MapPin } from "lucide-react";
import { getAuthHeaders } from "../context/AuthContext";
import { toast } from "sonner";
import { Pagination } from "./Pagination";

interface SubscriberCustomer {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  account?: string;
  avatar?: string;
}

interface Subscriber {
  _id: string;
  customer: SubscriberCustomer | null;
  start_date?: string;
  end_date?: string;
  remaining_days: number | null;
  duration_months?: number;
  total_price?: number;
  status: string;
  payment_status?: string;
  locationId?: { _id?: string; title?: string } | string | null;
}

interface PackageSubscribersModalProps {
  packageId: string;
  packageName: string;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "owned", label: "Đang sở hữu" },
  { value: "all", label: "Tất cả" },
  { value: "đang hoạt động", label: "Đang hoạt động" },
  { value: "còn 10 ngày", label: "Còn 10 ngày" },
  { value: "đang tạm ngưng", label: "Đang tạm ngưng" },
  { value: "chờ xác nhận", label: "Chờ xác nhận" },
  { value: "hết hạn", label: "Hết hạn" },
  { value: "đã hủy", label: "Đã hủy" },
];

const STATUS_BADGES: Record<string, string> = {
  "đang hoạt động": "bg-green-100 text-green-700",
  "còn 10 ngày": "bg-amber-100 text-amber-700",
  "đang tạm ngưng": "bg-orange-100 text-orange-700",
  "chờ xác nhận": "bg-blue-100 text-blue-700",
  "hết hạn": "bg-slate-200 text-slate-600",
  "đã hủy": "bg-red-100 text-red-700",
};

const PAYMENT_BADGES: Record<string, string> = {
  "đã thanh toán": "bg-green-50 text-green-600",
  "chờ thanh toán": "bg-amber-50 text-amber-600",
  "đã hủy": "bg-red-50 text-red-600",
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PackageSubscribersModal({
  packageId,
  packageName,
  onClose,
}: PackageSubscribersModalProps) {
  const headers = getAuthHeaders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("owned");
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [ownerCount, setOwnerCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    setSearchTerm("");
    setStatusFilter("owned");
  }, [packageId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "8");
      params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      fetch(`/api/packages/${packageId}/subscribers?${params.toString()}`, {
        headers: headers as any,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then((data) => {
          setSubs(data.data || []);
          setOwnerCount(data.ownerCount || 0);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        })
        .catch(() => toast.error("Không thể tải danh sách hội viên"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [packageId, page, searchTerm, statusFilter]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Người sở hữu gói: {packageName}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {ownerCount} hội viên đang sở hữu · {total} bản ghi hiển thị
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên / email / SĐT hội viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : subs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm.trim()
                ? `Không tìm thấy hội viên nào khớp "${searchTerm}"`
                : "Chưa có ai đăng ký gói này"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Hội viên</th>
                  <th className="px-4 py-3 font-medium">Liên hệ</th>
                  <th className="px-4 py-3 font-medium">Thời hạn</th>
                  <th className="px-4 py-3 font-medium">Đã trả</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Cơ sở</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const c = s.customer || {};
                  const loc =
                    typeof s.locationId === "object" && s.locationId !== null
                      ? s.locationId.title
                      : undefined;
                  return (
                    <tr
                      key={s._id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.fullName}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs shrink-0">
                              {getInitials(c.fullName)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">
                              {c.fullName || "Chưa có tên"}
                            </p>
                            <p className="text-xs text-slate-400">
                              @{c.account || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-slate-600">
                          {c.email && (
                            <p className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {c.email}
                            </p>
                          )}
                          {c.phone && (
                            <p className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {c.phone}
                            </p>
                          )}
                          {!c.email && !c.phone && <span>—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(s.start_date)} → {formatDate(s.end_date)}
                        </p>
                        {s.remaining_days !== null && (
                          <p className="mt-1 text-slate-400">
                            Còn {s.remaining_days} ngày
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {(s.total_price ?? 0).toLocaleString("vi-VN")}đ
                        </span>
                        {s.payment_status && (
                          <span
                            className={`block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${
                              PAYMENT_BADGES[s.payment_status] ||
                              "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {s.payment_status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            STATUS_BADGES[s.status] ||
                            "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {loc ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {loc}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={8}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
