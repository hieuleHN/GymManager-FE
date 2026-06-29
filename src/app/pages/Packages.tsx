import { Check } from "lucide-react";
import { Button } from "@mui/material";
import { motion } from "motion/react";
import { FloatingContact } from "../components/FloatingContact";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth, getApiUrl, getAuthHeaders } from "../context/AuthContext";
import { useClub } from "../context/ClubContext";

interface PackageItem {
  _id: string;
  name: string;
  unitPrice: number;
  features: string[];
  durations: { months: number; discount: number }[];
  disciplineId?: { _id: string; name: string };
  locationId?: { _id: string; title: string };
  is_active: boolean;
}

interface Discipline {
  _id: string;
  name: string;
}

export function Packages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Lấy dữ liệu trên thanh URL (minPrice, locationId)
  const [searchParams] = useSearchParams();
  const { selectedClub } = useClub();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [customerLoaded, setCustomerLoaded] = useState(false);

  // Lấy giá trị lọc từ URL do trang MyPackages truyền sang
  const minPriceParam = searchParams.get("minPrice");
  const minPrice = minPriceParam ? parseInt(minPriceParam, 10) : -1;
  const urlLocationId = searchParams.get("locationId"); // Bắt lấy mã cơ sở

  useEffect(() => {
    if (user && !user.isStaff) {
      fetch(`${getApiUrl()}/api/customers/my-info`, {
        headers: getAuthHeaders() as any,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) setCustomer(data);
        })
        .catch(() => {})
        .finally(() => setCustomerLoaded(true));
    } else {
      setCustomerLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/disciplines?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setDisciplines(data.data);
        else if (Array.isArray(data)) setDisciplines(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && !user.isStaff && !customerLoaded) return;

    setLoading(true);
    setErrorMsg("");

    let url = `${getApiUrl()}/api/packages?page=1&limit=50`;

    // LOGIC MỚI: Ưu tiên lấy locationId từ URL (Khi Nâng cấp). Nếu không có mới lấy ở Menu.
    const activeLocId =
      urlLocationId || (selectedClub !== "all" ? selectedClub : null);
    if (activeLocId) {
      url += `&locationId=${activeLocId}`;
    }

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        const json = await res.json();
        const list = json?.data || (Array.isArray(json) ? json : []);
        setPackages(list);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [selectedClub, customerLoaded, user, urlLocationId]); // Cập nhật lại khi urlLocationId thay đổi

  const formatPrice = (price: number) => {
    if (!price) return "0đ";
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleRegister = (pkgId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/packages/${pkgId}/checkout`);
  };

  // ĐÃ SỬA LUỒNG LỌC TẠI ĐÂY:
  // Chỉ lấy những gói đang hoạt động VÀ có giá cao hơn giá gói cũ (nếu đang ở chế độ Nâng cấp)
  const activePackages = packages.filter((p) => {
    if (!p.is_active) return false;
    if (minPrice !== -1 && p.unitPrice <= minPrice) return false;
    return true;
  });

  const uniqueDisciplines = disciplines.filter((d) =>
    activePackages.some((p) => p.disciplineId?._id === d._id),
  );

  const filteredPackages =
    selectedDiscipline === "all"
      ? activePackages
      : activePackages.filter(
          (p) => p.disciplineId?._id === selectedDiscipline,
        );

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 flex items-center justify-center">
        <p className="text-slate-500">Đang tải danh sách gói tập...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-24 px-4">
      <FloatingContact phoneNumber="1900 9999" />
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 uppercase">
          {minPrice !== -1 ? "Nâng cấp gói tập" : "Gói tập dành cho bạn"}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {minPrice !== -1
            ? "Khám phá các kế hoạch cao cấp hơn để tăng cường trải nghiệm và nhanh chóng đạt được mục tiêu của bạn."
            : "Các kế hoạch linh hoạt được thiết kế để phù hợp với lối sống và giúp bạn đạt được mục tiêu."}
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSelectedDiscipline("all")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              selectedDiscipline === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả
          </button>
          {uniqueDisciplines.map((d) => (
            <button
              key={d._id}
              onClick={() => setSelectedDiscipline(d._id)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedDiscipline === d._id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-600">{errorMsg}</p>
          <Button
            onClick={() => window.location.reload()}
            sx={{ mt: 1, textTransform: "none", color: "#dc2626" }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {filteredPackages.length === 0 && !errorMsg ? (
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-slate-500 text-lg">
            {minPrice !== -1
              ? "Hiện không có gói tập nào cao cấp hơn gói bạn đang sử dụng."
              : selectedDiscipline !== "all"
                ? "Hiện chưa có gói tập nào cho bộ môn này."
                : selectedClub && selectedClub !== "all"
                  ? "Hiện chưa có gói tập nào tại cơ sở này. Vui lòng chọn cơ sở khác trên thanh menu."
                  : "Chưa có gói tập nào. Vui lòng quay lại sau."}
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPackages.map((plan, index) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 rounded-2xl flex flex-col bg-slate-900 text-white shadow-lg"
            >
              <div className="mb-6">
                {plan.disciplineId && (
                  <p className="text-sm text-indigo-400 font-semibold mb-1">
                    {plan.disciplineId.name}
                  </p>
                )}
                <h3 className="text-2xl font-bold mb-4 tracking-wide">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-extrabold">
                    {formatPrice(plan.unitPrice)}
                  </span>
                </div>
                <span className="text-sm text-slate-300">/ tháng</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {(plan.features || []).map((feature: string) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {(plan.durations || []).length > 0 && (
                <div className="mb-4 text-xs text-slate-300">
                  <p className="font-semibold mb-1">Thời hạn:</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.durations.map(
                      (d: { months: number; discount: number }, i: number) => (
                        <span
                          key={i}
                          className="bg-slate-700 px-2 py-0.5 rounded"
                        >
                          {d.months} tháng
                          {d.discount > 0 ? ` (-${d.discount}%)` : ""}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handleRegister(plan._id)}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderColor: "white",
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                  },
                }}
              >
                Đăng ký ngay
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
