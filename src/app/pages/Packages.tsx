import { Check, X, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
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
  disciplines?: { _id: string; name: string }[];
  combo?: boolean;
  locationId?: { _id: string; title: string };
  is_active: boolean;
  ptSessionsPerMonth?: number;
  isFullMonth?: boolean;
}

interface Discipline {
  _id: string;
  name: string;
}

interface Registration {
  _id: string;
  package_id: {
    _id: string;
    name: string;
    unitPrice: number;
    disciplineId?: { _id: string; name: string };
  };
  status: string;
  payment_status: string;
  total_price: number;
  start_date: string;
  end_date: string;
}

export function Packages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const { selectedClub } = useClub();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [customerLoaded, setCustomerLoaded] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [registrationsLoaded, setRegistrationsLoaded] = useState(false);

  const [upgradeModal, setUpgradeModal] = useState<{
    currentReg: Registration;
    targetPkg: PackageItem;
    calculation: any;
    loading: boolean;
  } | null>(null);
  const [upgradeConfirming, setUpgradeConfirming] = useState(false);

  const minPriceParam = searchParams.get("minPrice");
  const minPrice = minPriceParam ? parseInt(minPriceParam, 10) : -1;
  const urlLocationId = searchParams.get("locationId");

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
    if (user && !user.isStaff) {
      fetch(`${getApiUrl()}/api/user-packages/my`, {
        headers: getAuthHeaders() as any,
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setUserRegistrations(data);
        })
        .catch(() => {})
        .finally(() => setRegistrationsLoaded(true));
    } else {
      setRegistrationsLoaded(true);
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
  }, [selectedClub, customerLoaded, user, urlLocationId]);

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

  const handleOpenUpgrade = (targetPkg: PackageItem, currentReg: Registration) => {
    setUpgradeModal({
      currentReg,
      targetPkg,
      calculation: null,
      loading: true,
    });

    fetch(`${getApiUrl()}/api/user-packages/calculate-upgrade`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" } as any,
      body: JSON.stringify({
        currentRegistrationId: currentReg._id,
        newPackageId: targetPkg._id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setUpgradeModal((prev) =>
          prev ? { ...prev, calculation: data, loading: false } : null
        );
      })
      .catch(() => {
        setUpgradeModal((prev) =>
          prev ? { ...prev, calculation: { error: "Lỗi tính toán nâng cấp" }, loading: false } : null
        );
      });
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeModal) return;
    setUpgradeConfirming(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/user-packages/renew-upgrade`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" } as any,
        body: JSON.stringify({
          action_type: "upgrade",
          package_id: upgradeModal.targetPkg._id,
          locationId: customer?.locationId?._id || customer?.locationId,
          duration_months: 1,
          total_price: upgradeModal.calculation.amountToPay || upgradeModal.calculation.newPackageCost,
          currentRegistrationId: upgradeModal.currentReg._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUpgradeModal(null);
      navigate("/payment", {
        state: {
          package: upgradeModal.targetPkg,
          registration: { _id: data.registration._id },
          customer,
          durationMonths: 1,
          totalPrice: upgradeModal.calculation.amountToPay || upgradeModal.calculation.newPackageCost,
        },
      });
    } catch (err: any) {
      alert("Lỗi nâng cấp: " + err.message);
    }
    setUpgradeConfirming(false);
  };

  const activeRegistrations = userRegistrations.filter(
    (r) =>
      (r.status === "đang hoạt động" || r.status === "còn 10 ngày") &&
      r.payment_status === "đã thanh toán"
  );

  const activePackageIds = new Set(
    activeRegistrations.map((r) => r.package_id?._id).filter(Boolean)
  );

  const activeDisciplineIds = new Set<string>();
  activeRegistrations.forEach((r) => {
    const did = r.package_id?.disciplineId?._id || r.package_id?.disciplineId;
    if (did) activeDisciplineIds.add(typeof did === "string" ? did : (did as any)._id || did);
  });

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
      : selectedDiscipline === "combo"
        ? activePackages.filter((p) => p.combo)
        : activePackages.filter(
            (p) => p.disciplineId?._id === selectedDiscipline,
          );

  if (loading || !registrationsLoaded) {
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
          <button
            onClick={() => setSelectedDiscipline("combo")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              selectedDiscipline === "combo"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Combo
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
          {filteredPackages.map((plan, index) => {
            const isAlreadyRegistered = activePackageIds.has(plan._id);
            const sameDisciplineActiveRegs = activeRegistrations.filter(
              (r) => {
                const regPkg = r.package_id as any;
                const regIds = new Set<string>();
                if (regPkg?.disciplineId) {
                  regIds.add(regPkg.disciplineId?._id || regPkg.disciplineId);
                }
                (regPkg?.disciplines || []).forEach((d: any) => regIds.add(d?._id || d));

                const planIds = new Set<string>();
                if (plan.disciplineId) {
                  planIds.add(plan.disciplineId?._id || plan.disciplineId);
                }
                (plan.disciplines || []).forEach((d: any) => planIds.add(d?._id || d));

                return [...regIds].some((id) => planIds.has(id));
              }
            );
            const sameDisciplineActiveReg = sameDisciplineActiveRegs.length > 0
              ? sameDisciplineActiveRegs.reduce((best, r) =>
                  new Date(r.end_date) > new Date(best.end_date) ? r : best
                )
              : null;
            const canUpgrade = !isAlreadyRegistered && !!sameDisciplineActiveReg;

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl flex flex-col bg-slate-900 text-white shadow-lg"
              >
                {isAlreadyRegistered && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Đã mua
                  </div>
                )}

                <div className="mb-6">
                  {plan.combo ? (
                    <p className="text-sm text-amber-400 font-semibold mb-1">
                      Combo
                    </p>
                  ) : plan.disciplineId ? (
                    <p className="text-sm text-indigo-400 font-semibold mb-1">
                      {plan.disciplineId.name}
                    </p>
                  ) : null}
                  {plan.combo && plan.disciplines && plan.disciplines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {plan.disciplines.map((d) => (
                        <span key={d._id} className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                          {d.name}
                        </span>
                      ))}
                    </div>
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
                  {(plan.ptSessionsPerMonth > 0 || plan.isFullMonth) && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                        {plan.isFullMonth ? 'Không giới hạn buổi HLV' : `${plan.ptSessionsPerMonth} buổi HLV / tháng`}
                      </span>
                    </div>
                  )}
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

                {isAlreadyRegistered ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#e2e8f0",
                      opacity: 1,
                      "&.Mui-disabled": {
                        color: "#e2e8f0",
                        opacity: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                      },
                    }}
                  >
                    Bạn đã mua gói tập này rồi
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => handleOpenUpgrade(plan, sameDisciplineActiveReg!)}
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      borderColor: "#22c55e",
                      color: "#22c55e",
                      "&:hover": {
                        bgcolor: "rgba(34, 197, 94, 0.1)",
                        borderColor: "#22c55e",
                      },
                    }}
                  >
                    Nâng cấp
                  </Button>
                ) : (
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
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {upgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">
                Nâng cấp gói tập
              </h3>
              <button
                type="button"
                onClick={() => setUpgradeModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Gói hiện tại</p>
                <p className="font-bold text-slate-900 text-lg">
                  {upgradeModal.currentReg.package_id?.name}
                </p>
                <p className="text-sm text-slate-600">
                  Giá trị: {formatPrice(upgradeModal.currentReg.total_price)}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-indigo-600" />
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <p className="text-sm text-indigo-500 mb-1">Gói muốn nâng cấp</p>
                <p className="font-bold text-slate-900 text-lg">
                  {upgradeModal.targetPkg.name}
                </p>
                <p className="text-sm text-slate-600">
                  Giá niêm yết: {formatPrice(upgradeModal.targetPkg.unitPrice)} / tháng
                </p>
              </div>

              {upgradeModal.loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : upgradeModal.calculation?.error ? (
                <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-red-700">{upgradeModal.calculation.error}</span>
                </div>
              ) : upgradeModal.calculation ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Số ngày đã dùng</span>
                      <span className="font-semibold text-slate-900">{upgradeModal.calculation.usedDays} / {upgradeModal.calculation.totalDays} ngày</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Số ngày còn lại</span>
                      <span className="font-semibold text-slate-900">{upgradeModal.calculation.remainingDays} ngày</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Giá trị còn lại của gói hiện tại</span>
                        <span className="font-semibold text-green-600">{formatPrice(upgradeModal.calculation.remainingValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Chi phí gói mới cho thời gian còn lại</span>
                        <span className="font-semibold text-slate-900">{formatPrice(upgradeModal.calculation.newPackageCost)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                      {upgradeModal.calculation.refundAmount > 0 ? (
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-700">Bạn sẽ được hoàn lại</p>
                          <p className="text-2xl font-bold text-green-600">{formatPrice(upgradeModal.calculation.refundAmount)}</p>
                          <p className="text-xs text-green-500">({upgradeModal.calculation.refundPercentage}% giá trị gói mới)</p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <p className="text-sm text-amber-700">Bạn cần thanh toán thêm</p>
                          <p className="text-2xl font-bold text-amber-600">{formatPrice(upgradeModal.calculation.amountToPay)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t flex gap-3">
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setUpgradeModal(null)}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Hủy
              </Button>
              <Button
                fullWidth
                variant="contained"
                disabled={upgradeModal.loading || upgradeConfirming || !upgradeModal.calculation || upgradeModal.calculation.error}
                onClick={handleConfirmUpgrade}
                sx={{
                  bgcolor: "#4f46e5",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#4338ca" },
                }}
              >
                {upgradeConfirming ? "Đang xử lý..." : "Xác nhận nâng cấp"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
