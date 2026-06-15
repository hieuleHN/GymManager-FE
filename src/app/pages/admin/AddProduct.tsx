import { AdminLayout } from "../../components/AdminLayout";
import { Button } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getAuthHeaders } from "../../context/AuthContext";
import { useClub } from "../../context/ClubContext";
import { toast } from "sonner";

export function AddProduct() {
  const navigate = useNavigate();
  const { selectedClub } = useClub();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    description: "",
    importDate: "",
    expiryDate: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = "";
    if (
      (field === "name" || field === "importDate" || field === "expiryDate") &&
      !value
    )
      msg =
        "Vui lòng nhập " +
        (field === "name"
          ? "tên sản phẩm"
          : field === "importDate"
            ? "ngày nhập"
            : "ngày hết hạn");
    else if (
      (field === "price" || field === "quantity") &&
      (!value || Number(value) <= 0)
    )
      msg = !value
        ? "Vui lòng nhập " + (field === "price" ? "đơn giá" : "số lượng")
        : (field === "price" ? "Đơn giá" : "Số lượng") + " phải lớn hơn 0";
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Vui lòng nhập tên sản phẩm";
    if (!formData.price || Number(formData.price) <= 0)
      newErrors.price = !formData.price
        ? "Vui lòng nhập đơn giá"
        : "Đơn giá phải lớn hơn 0";
    if (!formData.quantity || Number(formData.quantity) <= 0)
      newErrors.quantity = !formData.quantity
        ? "Vui lòng nhập số lượng"
        : "Số lượng phải lớn hơn 0";
    if (!formData.importDate) newErrors.importDate = "Vui lòng nhập ngày nhập";
    if (!formData.expiryDate)
      newErrors.expiryDate = "Vui lòng nhập ngày hết hạn";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (selectedClub === "all") {
      toast.error("Vui lòng chọn cơ sở!");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("price", String(Number(formData.price)));
      fd.append("quantity", String(Number(formData.quantity)));
      fd.append("description", formData.description);
      fd.append("importDate", formData.importDate);
      fd.append("expiryDate", formData.expiryDate);
      fd.append("location_id", selectedClub);
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: (getAuthHeaders() as any).Authorization || "",
        },
        body: fd,
      });
      if (res.ok) {
        toast.success("Thêm sản phẩm thành công!");
        navigate("/admin/products");
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || "Thêm sản phẩm thất bại");
      }
    } catch {
      toast.error("Thêm sản phẩm thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Thêm sản phẩm
          </h1>
          <p className="text-slate-600">Nhập thông tin sản phẩm mới</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ảnh sản phẩm
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={(e) => handleBlur("name", e.target.value)}
                className={
                  "w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
                  (errors.name ? "border-red-500" : "border-slate-200")
                }
                placeholder="VD: Nước tăng lực Red Bull"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  onBlur={(e) => handleBlur("price", e.target.value)}
                  className={
                    "w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
                    (errors.price ? "border-red-500" : "border-slate-200")
                  }
                  placeholder="VD: 15000"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  onBlur={(e) => handleBlur("quantity", e.target.value)}
                  className={
                    "w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
                    (errors.quantity ? "border-red-500" : "border-slate-200")
                  }
                  placeholder="VD: 100"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mô tả sản phẩm (không bắt buộc)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.importDate}
                  onChange={(e) => handleChange("importDate", e.target.value)}
                  onBlur={(e) => handleBlur("importDate", e.target.value)}
                  className={
                    "w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
                    (errors.importDate ? "border-red-500" : "border-slate-200")
                  }
                />
                {errors.importDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.importDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày hết hạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  onBlur={(e) => handleBlur("expiryDate", e.target.value)}
                  className={
                    "w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
                    (errors.expiryDate ? "border-red-500" : "border-slate-200")
                  }
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/admin/products")}
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
                {submitting ? "Đang lưu..." : "Thêm sản phẩm"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
