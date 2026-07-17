import { AdminLayout } from "../../components/AdminLayout";
import { Button } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useClub } from "../../context/ClubContext";
import { getAuthHeaders } from "../../context/AuthContext";
import { toast } from "sonner";

interface Discipline {
  _id: string;
  name: string;
}

export function AddPackage() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const headers = getAuthHeaders();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    disciplineId: "",
    locationId: "",
    unitPrice: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [features, setFeatures] = useState<string[]>([""]);
  const [durations, setDurations] = useState<
    Array<{ months: string; discount: string }>
  >([{ months: "", discount: "" }]);
  const [contractA, setContractA] = useState("");
  const [contractB, setContractB] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations", { headers: headers as any });
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
          if (selectedClub && selectedClub !== "all" && !formData.locationId) {
            setFormData((prev) => ({ ...prev, locationId: selectedClub }));
          }
        }
      } catch {
        toast.error("Không thể tải danh sách cơ sở");
      }
    };

    const fetchDisciplines = async () => {
      try {
        const res = await fetch("/api/disciplines", { headers: headers as any });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setDisciplines(list);
        }
      } catch {
        toast.error("Không thể tải danh sách bộ môn");
      }
    };

    fetchLocations();
    fetchDisciplines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = "";
    if ((field === "name" || field === "unitPrice") && !value)
      msg = "Vui lòng nhập " + (field === "name" ? "tên gói tập" : "đơn giá");
    else if (field === "disciplineId" && !value) msg = "Vui lòng chọn bộ môn";
    else if (field === "locationId" && !value) msg = "Vui lòng chọn cơ sở";
    else if (field === "unitPrice" && value && Number(value) <= 0)
      msg = "Đơn giá phải lớn hơn 0";
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Vui lòng nhập tên gói tập";
    if (!formData.disciplineId) newErrors.disciplineId = "Vui lòng chọn bộ môn";
    if (!formData.locationId)
      newErrors.locationId = "Vui lòng chọn cơ sở chi nhánh";
    if (!formData.unitPrice || Number(formData.unitPrice) <= 0)
      newErrors.unitPrice = !formData.unitPrice
        ? "Vui lòng nhập đơn giá"
        : "Đơn giá phải lớn hơn 0";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const body: any = {
        name: formData.name,
        disciplineId: formData.disciplineId,
        locationId: formData.locationId,
        unitPrice: Number(formData.unitPrice),
        features: features.filter((f) => f.trim()),
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

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên gói tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name", formData.name)}
                  className={`w-full p-3 border ${errors.name ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="VD: PREMIUM"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cơ sở (Chi nhánh) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => handleChange("locationId", e.target.value)}
                  onBlur={() => handleBlur("locationId", formData.locationId)}
                  className={`w-full p-3 border ${errors.locationId ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">Chọn cơ sở</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.address || loc.title}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.locationId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bộ môn <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.disciplineId}
                  onChange={(e) => handleChange("disciplineId", e.target.value)}
                  onBlur={() =>
                    handleBlur("disciplineId", formData.disciplineId)
                  }
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
                  <p className="text-red-500 text-sm mt-1">
                    {errors.disciplineId}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá theo tháng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.unitPrice}
                  onChange={(e) => handleChange("unitPrice", e.target.value)}
                  onBlur={() => handleBlur("unitPrice", formData.unitPrice)}
                  className={`w-full p-3 border ${errors.unitPrice ? "border-red-400" : "border-slate-200"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="VD: 2000000"
                />
                {errors.unitPrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.unitPrice}
                  </p>
                )}
              </div>
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