import { AdminLayout } from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Tag } from "lucide-react";
import { getAuthHeaders } from "../../context/AuthContext";

interface Duration {
  months: number;
  discount: number;
}

interface HistoryEntry {
  _id: string;
  unit_price_old: number | null;
  unit_price: number;
  durations_old: Duration[] | null;
  durations: Duration[] | null;
  reason?: string;
  changed_by_name?: string;
  changed_at: string;
}

const formatVnd = (n?: number | null) =>
  n === null || n === undefined ? "—" : n.toLocaleString("vi-VN") + "đ";

const formatDateTime = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function durationsLabel(durations?: Duration[] | null) {
  if (!durations || durations.length === 0) return "Không có";
  return durations
    .map((d) => `${d.months} tháng -${d.discount}%`)
    .join(", ");
}

export function PackagePriceHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const headers = getAuthHeaders();

  const [pkgName, setPkgName] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [durations, setDurations] = useState<Duration[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pkgRes, histRes] = await Promise.all([
          fetch(`/api/packages/${id}`, { headers: headers as any }),
          fetch(`/api/packages/${id}/price-history?limit=50`, {
            headers: headers as any,
          }),
        ]);
        if (pkgRes.ok) {
          const pkg = await pkgRes.json();
          setPkgName(pkg.name || pkg.data?.name || "");
          const p = pkg.unitPrice ?? pkg.data?.unitPrice ?? null;
          setUnitPrice(p);
          setDurations(pkg.durations ?? pkg.data?.durations ?? []);
        }
        if (histRes.ok) {
          const data = await histRes.json();
          setHistory(data.data || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/packages")}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="Quay lại danh sách gói tập"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lịch sử giá{pkgName ? ` — ${pkgName}` : ""}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Mọi thay đổi giá được ghi lại tại đây. Hợp đồng đã ký trước đó
              giữ nguyên giá theo thời điểm đăng ký.
            </p>
          </div>
        </div>

        {/* Giá hiện tại */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">
            Giá hiện tại
          </h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-indigo-600">
              {formatVnd(unitPrice)}
            </span>
            <span className="text-slate-400">/ tháng</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {durations.length > 0 ? (
              durations.map((d, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                >
                  {d.months} tháng: giảm {d.discount}%
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">
                Chưa cấu hình giảm giá theo thời hạn
              </span>
            )}
          </div>
        </div>

        {/* Timeline các lần đổi giá */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">
            Các lần thay đổi ({history.length})
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-500">Đang tải...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              Gói này chưa từng thay đổi giá kể từ khi tạo.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h) => {
                const oldP = h.unit_price_old;
                const diff =
                  oldP !== null && oldP !== undefined
                    ? h.unit_price - oldP
                    : null;
                const durationsChanged =
                  JSON.stringify(h.durations_old || []) !==
                  JSON.stringify(h.durations || []);
                return (
                  <div
                    key={h._id}
                    className="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-baseline gap-2">
                        {oldP !== null && oldP !== undefined && (
                          <span className="text-sm text-slate-400 line-through">
                            {formatVnd(oldP)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-slate-900">
                          {formatVnd(h.unit_price)}
                        </span>
                        <span className="text-xs text-slate-400">/tháng</span>
                        {diff !== null && diff !== 0 && (
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              diff > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {diff > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {diff > 0 ? "+" : ""}
                            {formatVnd(diff)}
                          </span>
                        )}
                        {diff === 0 && (
                          <Minus className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(h.changed_at)}
                      </span>
                    </div>

                    {durationsChanged && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500 flex items-start gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>
                            Bảng giảm giá:{" "}
                            <strong className="text-slate-700">
                              {durationsLabel(h.durations)}
                            </strong>
                            {h.durations_old && h.durations_old.length > 0 && (
                              <>
                                {" "}
                                (trước đó: {durationsLabel(h.durations_old)})
                              </>
                            )}
                          </span>
                        </p>
                      </div>
                    )}

                    {(h.reason || h.changed_by_name) && (
                      <p className="text-xs text-slate-400 mt-2">
                        {h.changed_by_name && (
                          <>Bởi {h.changed_by_name}</>
                        )}
                        {h.changed_by_name && h.reason ? " · " : ""}
                        {h.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
