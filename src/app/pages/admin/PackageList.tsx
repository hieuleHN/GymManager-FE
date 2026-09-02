import { AdminLayout } from "../../components/AdminLayout";
import { Pagination } from "../../components/Pagination";
import { useEffect, useState } from "react";
import { Edit, Trash2, Pause, Play, Search, Users, History } from "lucide-react";
import { useClub } from "../../context/ClubContext";
import { getAuthHeaders } from "../../context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { PackageSubscribersModal } from "../../components/PackageSubscribersModal";

interface Discipline {
  _id: string;
  name: string;
}

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  disciplineId: Discipline | string;
  combo?: boolean;
  disciplines?: Discipline[];
  features: string[];
  durations: { months: number; discount: number }[];
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
  is_active: boolean;
  lifecycle_status?: string;
  ownerCount?: number;
}

// Nhãn + màu theo vòng đời gói (dự phòng dữ liệu cũ chỉ có is_active)
const LIFECYCLE_BADGES: Record<string, { label: string; cls: string }> = {
  "nháp": { label: "Nháp", cls: "bg-slate-100 text-slate-600" },
  "đang bán": { label: "Đang bán", cls: "bg-green-100 text-green-700" },
  "tạm ngưng": { label: "Tạm ngưng", cls: "bg-amber-100 text-amber-700" },
  "ngừng bán": { label: "Ngừng bán", cls: "bg-red-100 text-red-700" },
};

function getLifecycleBadge(pkg: PackageItem) {
  if (pkg.lifecycle_status && LIFECYCLE_BADGES[pkg.lifecycle_status]) {
    return LIFECYCLE_BADGES[pkg.lifecycle_status];
  }
  return pkg.is_active
    ? { label: "Đang bán", cls: "bg-green-100 text-green-700" }
    : { label: "Tạm ngưng", cls: "bg-amber-100 text-amber-700" };
}

export function PackageList() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const headers = getAuthHeaders();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [subscribersPkg, setSubscribersPkg] = useState<PackageItem | null>(
    null,
  );

  useEffect(() => {
    const fetchDisciplines = async () => {
      try {
        const url =
          selectedClub && selectedClub !== "all"
            ? `/api/disciplines?locationId=${selectedClub}`
            : "/api/disciplines";
        const res = await fetch(url, { headers: headers as any });
        if (res.ok) {
          const data = await res.json();
          setDisciplines(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        // silent
      }
    };
    fetchDisciplines();
  }, [selectedClub]);

  const fetchPackages = async (disciplineId: string, p = page, search = "") => {
    setLoading(true);
    try {
      // Dùng thống nhất endpoint /api/packages: staff có token -> thấy đủ vòng đời,
      // server hỗ trợ locationId + disciplineId + search + phân trang cùng lúc.
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "15");
      if (selectedClub && selectedClub !== "all") {
        params.set("locationId", selectedClub);
      }
      if (disciplineId !== "all") {
        params.set("disciplineId", disciplineId);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/packages?${params.toString()}`, {
        headers: headers as any,
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPackages(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error("Không thể tải danh sách gói tập");
    } finally {
      setLoading(false);
    }
  };

  // Tự tải lại khi đổi bộ môn / cơ sở / từ khóa tìm kiếm (debounce 300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPackages(selectedDiscipline, 1, searchTerm);
    }, 300);
    return () => clearTimeout(t);
  }, [selectedDiscipline, selectedClub, searchTerm]);

  const handleDisciplineClick = (id: string) => {
    setSelectedDiscipline(id);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/packages/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gói tập này?")) return;
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "DELETE",
        headers: headers as any,
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Đã xóa gói tập");
      fetchPackages(selectedDiscipline, page, searchTerm);
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const toggleStatus = async (pkg: PackageItem) => {
    const newActive = !pkg.is_active;
    try {
      const res = await fetch(`/api/packages/${pkg._id}`, {
        method: "PUT",
        headers: headers as any,
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      toast.success(
        newActive ? "Đã kích hoạt gói tập" : "Đã tạm ngưng gói tập",
      );
      fetchPackages(selectedDiscipline, page, searchTerm);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const getDisciplineName = (pkg: PackageItem): string => {
    if (pkg.combo) return "Combo";
    const dId = pkg.disciplineId;
    if (typeof dId === "object" && dId !== null && "name" in dId) {
      return (dId as Discipline).name;
    }
    if (typeof dId === "string") {
      const found = disciplines.find((d) => d._id === dId);
      return found ? found.name : "N/A";
    }
    return "N/A";
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Danh sách gói tập
          </h1>
          <p className="text-slate-600">Quản lý các gói tập của phòng gym</p>
        </div>

        {/* Tìm kiếm gói tập */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên gói tập hoặc tên / email / SĐT hội viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 ml-1">
            Gõ tên gói tập để lọc gói, hoặc nhập tên / email / số điện thoại
            hội viên để xem các gói họ đang sở hữu.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => handleDisciplineClick("all")}
            className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedDiscipline === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Tất cả
          </button>
          {disciplines.map((discipline) => (
            <button
              key={discipline._id}
              onClick={() => handleDisciplineClick(discipline._id)}
              className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedDiscipline === discipline._id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {discipline.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
            Đang tải...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4 pb-0 flex justify-between items-center">
                  <button
                    onClick={() => setSubscribersPkg(pkg)}
                    title="Xem chi tiết người sở hữu gói"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{pkg.ownerCount ?? 0} người sở hữu</span>
                  </button>
                  {(() => {
                    const badge = getLifecycleBadge(pkg);
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="p-6 pt-3">
                  <div className="mb-4">
                    <p className="text-sm text-indigo-600 font-semibold mb-1">
                      {getDisciplineName(pkg)}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-slate-900">
                        {pkg.unitPrice?.toLocaleString("vi-VN") || "0"}
                      </p>
                      <span className="text-slate-500">đ/tháng</span>
                    </div>
                    {(pkg.ptSessionsPerMonth > 0 || pkg.isFullMonth) && (
                      <p className="text-xs text-indigo-600 font-semibold mt-1">
                        {pkg.isFullMonth ? 'PT: Full tháng' : `PT: ${pkg.ptSessionsPerMonth} buổi/tháng`}
                      </p>
                    )}
                    {pkg.combo && pkg.disciplines && pkg.disciplines.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pkg.disciplines.map((d) => (
                          <span key={d._id} className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                            {d.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    {(pkg.features || []).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-slate-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleEdit(pkg._id)}
                      className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Xóa</span>
                    </button>
                    <button
                      onClick={() => toggleStatus(pkg)}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                        pkg.is_active
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {pkg.is_active ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span className="text-sm font-medium">Tạm ngưng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="text-sm font-medium">Kích hoạt</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/admin/packages/${pkg._id}/price-history`)
                      }
                      className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Xem các lần thay đổi giá của gói"
                    >
                      <History className="w-4 h-4" />
                      <span className="text-sm font-medium">Lịch sử giá</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
                {searchTerm.trim()
                  ? `Không tìm thấy gói tập nào khớp "${searchTerm}"`
                  : "Chưa có gói tập nào"}
              </div>
            )}
          </div>
        )}
        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={15}
            onPageChange={(p) => {
              setPage(p);
              fetchPackages(selectedDiscipline, p, searchTerm);
            }}
          />
        )}
      </div>

      {subscribersPkg && (
        <PackageSubscribersModal
          packageId={subscribersPkg._id}
          packageName={subscribersPkg.name}
          onClose={() => setSubscribersPkg(null)}
        />
      )}
    </AdminLayout>
  );
}
