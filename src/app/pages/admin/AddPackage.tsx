import { AdminLayout } from "../../components/AdminLayout";
import { Button } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useClub } from "../../context/ClubContext";
import { getAuthHeaders } from "../../context/AuthContext";
import { toast } from "sonner";

interface Discipline {
  _id: string;
  name: string;
}

interface PackageFormData {
  name: string;
  disciplineId: string;
  unitPrice: string;
}

export function AddPackage() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const headers = getAuthHeaders();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PackageFormData>();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  const [features, setFeatures] = useState<string[]>([""]);
  const [durations, setDurations] = useState<
    Array<{ months: string; discount: string }>
  >([{ months: "", discount: "" }]);
  const [ptSessionsPerMonth, setPtSessionsPerMonth] = useState("");
  const [isFullMonth, setIsFullMonth] = useState(false);
  const [isCombo, setIsCombo] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [contractA, setContractA] = useState("");
  const [contractB, setContractB] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const locId = selectedClub && selectedClub !== 'all' ? selectedClub : undefined;
    const fetchDisciplines = async () => {
      try {
        const url = locId ? `/api/disciplines?locationId=${locId}` : "/api/disciplines";
        const res = await fetch(url, { headers: headers as any });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setDisciplines(list);
        }
      } catch {
        toast.error("Không thể tải danh sách bộ môn");
      }
    };
    fetchDisciplines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub]);

  const addFeature = () => setFeatures([...features, ""]);
  const removeFeature = (index: number) =>
    setFeatures(features.filter((_, i) => i !== index));
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addDuration = () =>
    setDurations([...durations, { months: "", discount: "" }]);
  const removeDuration = (index: number) =>
    setDurations(durations.filter((_, i) => i !== index));
  const updateDuration = (
    index: number,
    field: "months" | "discount",
    value: string,
  ) => {
    const newDurations = [...durations];
    newDurations[index][field] = value;
    setDurations(newDurations);
  };

  const onSubmit = async (data: PackageFormData) => {
    if (isCombo && selectedDisciplines.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bộ môn cho gói combo');
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      const locId = selectedClub && selectedClub !== 'all' ? selectedClub : undefined;
      const body: any = {
        name: data.name,
        disciplineId: isCombo ? null : data.disciplineId,
        combo: isCombo,
        disciplines: isCombo ? selectedDisciplines : [],
        locationId: locId,
        unitPrice: Number(data.unitPrice),
        features: features.filter((f) => f.trim()),
        ptSessionsPerMonth: isFullMonth ? 0 : (Number(ptSessionsPerMonth) || 0),
        isFullMonth,
        durations: durations
          .filter((d) => d.months)
          .map((d) => ({
            months: Number(d.months),
            discount: Number(d.discount) || 0,
          })),
        contractA,
        contractB,
        contractTerms,
      };

      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" } as any,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Create failed");
      toast.success("Thêm gói tập thành công!");
      navigate("/admin/packages");
    } catch {
      toast.error("Thêm gói tập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Thêm gói tập
          </h1>
          <p className="text-slate-600">Tạo gói tập mới cho hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên gói tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("name", {
                    required: "Vui lòng nhập tên gói tập",
                  })}
                  className={`w-full p-3 border ${errors.name ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="VD: PREMIUM"
                />
                {errors.name && (
                  <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>
                )}
              </div>

              <div>
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCombo}
                    onChange={(e) => {
                      setIsCombo(e.target.checked);
                      if (!e.target.checked) setSelectedDisciplines([]);
                    }}
                    className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Gói Combo (nhiều bộ môn)</span>
                </label>

                {isCombo ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Chọn các bộ môn <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {disciplines.map((d) => {
                        const active = selectedDisciplines.includes(d._id);
                        return (
                          <button
                            key={d._id}
                            type="button"
                            onClick={() => {
                              setSelectedDisciplines(prev =>
                                active ? prev.filter(id => id !== d._id) : [...prev, d._id]
                              );
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                    {errors.disciplineId && (
                      <span className="text-red-500 text-sm mt-1">Vui lòng chọn ít nhất một bộ môn</span>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bộ môn <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("disciplineId", {
                        required: !isCombo ? "Vui lòng chọn bộ môn" : false,
                      })}
                      className={`w-full p-3 border ${errors.disciplineId ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="">Chọn bộ môn</option>
                      {disciplines.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.disciplineId && (
                      <span className="text-red-500 text-sm mt-1">
                        {errors.disciplineId.message}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá theo tháng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register("unitPrice", {
                    required: "Vui lòng nhập đơn giá",
                    validate: (value) =>
                      Number(value) > 0 || "Đơn giá phải lớn hơn 0",
                  })}
                  className={`w-full p-3 border ${errors.unitPrice ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="VD: 2000000"
                />
                {errors.unitPrice && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.unitPrice.message}
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Huấn luyện viên
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    value={ptSessionsPerMonth}
                    onChange={(e) => setPtSessionsPerMonth(e.target.value)}
                    disabled={isFullMonth}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Số buổi tập HLV / tháng"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFullMonth}
                    onChange={(e) => setIsFullMonth(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Full tháng</span>
                </label>
              </div>
              {isFullMonth && (
                <p className="text-xs text-indigo-600 font-medium">Không giới hạn buổi tập HLV trong tháng</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tính năng / Quyền lợi
              </label>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="VD: Không giới hạn tập luyện"
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Thêm tính năng</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Thời gian tập & Giảm giá
              </label>
              <div className="space-y-3">
                {durations.map((duration, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="number"
                      value={duration.months}
                      onChange={(e) =>
                        updateDuration(index, "months", e.target.value)
                      }
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Số tháng (VD: 6)"
                    />
                    <input
                      type="number"
                      value={duration.discount}
                      onChange={(e) =>
                        updateDuration(index, "discount", e.target.value)
                      }
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="% Giảm giá (VD: 15)"
                    />
                    {durations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDuration(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDuration}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Thêm thời gian</span>
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hợp đồng - Cam kết bên A (Phòng gym)
                </label>
                <textarea
                  value={contractA}
                  onChange={(e) => setContractA(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các cam kết của phòng gym..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hợp đồng - Cam kết bên B (Khách hàng)
                </label>
                <textarea
                  value={contractB}
                  onChange={(e) => setContractB(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các cam kết của khách hàng..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hợp đồng - Điều khoản khác
                </label>
                <textarea
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các điều khoản khác..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                disabled={submitting}
                onClick={() => navigate("/admin/packages")}
                sx={{
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: "#4f46e5",
                  "&:hover": { bgcolor: "#4338ca" },
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                }}
              >
                Thêm gói tập
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
