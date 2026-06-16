import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Button } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";

export function EditPackage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID gói tập từ đường dẫn URL
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    monthly_price: "",
  });

  const [features, setFeatures] = useState<string[]>([""]);
  const [durations, setDurations] = useState<
    Array<{ months: string; discount: string }>
  >([{ months: "", discount: "" }]);
  const [commitmentA, setCommitmentA] = useState("");
  const [commitmentB, setCommitmentB] = useState("");
  const [otherTerms, setOtherTerms] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // KÉO DỮ LIỆU CŨ TỪ DATABASE ĐỔ VÀO FORM
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy danh sách bộ môn
        const deptRes = await axios.get("http://localhost:5000/departments");
        setDepartments(deptRes.data);

        // 2. Lấy dữ liệu gói tập hiện tại đang sửa
        const pkgRes = await axios.get(`http://localhost:5000/packages/${id}`);
        const pkg = pkgRes.data;

        // Đổ dữ liệu vào State
        setFormData({
          name: pkg.name,
          departmentId: pkg.departmentId?._id || pkg.departmentId,
          monthly_price: pkg.monthly_price.toString(),
        });

        if (pkg.features?.length > 0) setFeatures(pkg.features);

        if (pkg.durationOptions?.length > 0) {
          setDurations(
            pkg.durationOptions.map((d: any) => ({
              months: d.months.toString(),
              discount: d.discountPercent.toString(),
            })),
          );
        }

        setCommitmentA(pkg.gymCommitments || "");
        setCommitmentB(pkg.customerCommitments || "");
        setOtherTerms(pkg.otherTerms || "");
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu gói tập:", error);
        alert("Không tìm thấy dữ liệu gói tập này!");
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
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
    if (errors.durations) setErrors({ ...errors, durations: "" });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên gói tập";
    if (!formData.departmentId)
      newErrors.departmentId = "Vui lòng chọn loại gói (Bộ môn)";
    if (!formData.monthly_price)
      newErrors.monthly_price = "Vui lòng nhập đơn giá";
    else if (Number(formData.monthly_price) <= 0)
      newErrors.monthly_price = "Đơn giá phải lớn hơn 0đ";

    const hasInvalidDuration = durations.some(
      (d) => d.months !== "" && Number(d.months) <= 0,
    );
    if (hasInvalidDuration) newErrors.durations = "Số tháng tập phải lớn hơn 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        departmentId: formData.departmentId,
        monthly_price: Number(formData.monthly_price),
        features: features.filter((f) => f.trim() !== ""),
        durationOptions: durations
          .filter((d) => d.months !== "")
          .map((d) => ({
            months: Number(d.months),
            discountPercent: Number(d.discount) || 0,
          })),
        gymCommitments: commitmentA,
        customerCommitments: commitmentB,
        otherTerms: otherTerms,
      };

      // GỌI API PUT (SỬA) THAY VÌ POST
      await axios.put(`http://localhost:5000/packages/${id}`, payload);
      alert("Cập nhật gói tập thành công!");
      navigate("/admin/packages");
    } catch (error: any) {
      console.error("Lỗi khi lưu gói tập:", error);
      alert("Lỗi hệ thống: Không thể cập nhật gói tập!");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Cập nhật gói tập
          </h1>
          <p className="text-slate-600">Chỉnh sửa thông tin gói tập hiện tại</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên gói tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.name ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500"}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại gói (Bộ môn) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => handleChange("departmentId", e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.departmentId ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500"}`}
                >
                  <option value="" disabled>
                    -- Chọn bộ môn --
                  </option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.title}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá gói theo tháng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.monthly_price}
                  onChange={(e) =>
                    handleChange("monthly_price", e.target.value)
                  }
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.monthly_price ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500"}`}
                />
                {errors.monthly_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.monthly_price}
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
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                >
                  <Plus className="w-5 h-5" />{" "}
                  <span className="font-medium">Thêm tính năng</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Thời gian tập & Giảm giá
              </label>
              {errors.durations && (
                <p className="text-red-500 text-xs mb-2">{errors.durations}</p>
              )}
              <div className="space-y-3">
                {durations.map((duration, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="number"
                      value={duration.months}
                      onChange={(e) =>
                        updateDuration(index, "months", e.target.value)
                      }
                      className={`flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.durations ? "border-red-500" : "border-slate-200"}`}
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
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDuration}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                >
                  <Plus className="w-5 h-5" />{" "}
                  <span className="font-medium">Thêm thời gian</span>
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cam kết bên A (Phòng gym)
                </label>
                <textarea
                  value={commitmentA}
                  onChange={(e) => setCommitmentA(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cam kết bên B (Khách hàng)
                </label>
                <textarea
                  value={commitmentB}
                  onChange={(e) => setCommitmentB(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Điều khoản khác
                </label>
                <textarea
                  value={otherTerms}
                  onChange={(e) => setOtherTerms(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/admin/packages")}
                sx={{
                  borderColor: "#cbd5e1",
                  color: "#475569",
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
                sx={{
                  bgcolor: "#4f46e5",
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                }}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
