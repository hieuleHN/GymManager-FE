import { AdminLayout } from "../../components/AdminLayout";
import { Button } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useClub } from "../../context/ClubContext";
import { toast } from "sonner";
import { getAuthHeaders } from "../../context/AuthContext";
import { useForm } from "react-hook-form";

interface EquipmentFormData {
  name: string;
  description: string;
  unitPrice: string;
  quantity: string;
  warranty_period: string;
  total: string;
  location_id: string;
  supplier: string;
  phone: string;
  address: string;
  purchaser: string;
  invoice_url: string;
  warranty_card_url: string;
}

export function AddEquipment() {
  const navigate = useNavigate();
  const { selectedClub, clubs } = useClub();
  const [submitting, setSubmitting] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    defaultValues: {
      name: "",
      description: "",
      unitPrice: "",
      quantity: "",
      warranty_period: "12",
      total: "",
      location_id: selectedClub === "all" ? "" : selectedClub,
      invoice_url: "",
      warranty_card_url: "",
    },
  });

  const unitPrice = Number(watch("unitPrice")) || 0;
  const quantity = Number(watch("quantity")) || 0;
  const calculatedTotal = unitPrice * quantity;

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/[^0-9]/g, "");
    setPriceDisplay(raw ? Number(raw).toLocaleString("vi-VN") : "");
    setValue("unitPrice", raw, { shouldValidate: true });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "invoice_url" | "warranty_card_url",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(fieldName, reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EquipmentFormData) => {
    setSubmitting(true);
    try {
      const body: any = {
        name: data.name.trim(),
        description: data.description.trim(),
        unitPrice: parseFloat(data.unitPrice),
        quantity: parseInt(data.quantity),
        warranty_period: parseInt(data.warranty_period) || 12,
        total: calculatedTotal,
        location_id: data.location_id || undefined,
        supplier: data.supplier.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        purchaser: data.purchaser.trim(),
        invoice_url: data.invoice_url?.trim() || undefined,
        warranty_card_url: data.warranty_card_url?.trim() || undefined,
      };

      const res = await fetch("/api/equipments", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Thêm thiết bị thất bại!");

      toast.success("Thêm thiết bị thành công!");
      navigate("/admin/equipment");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Thêm thiết bị
          </h1>
          <p className="text-slate-600">Thêm thiết bị mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Thông tin thiết bị
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên thiết bị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name", {
                      required: "Vui lòng nhập tên thiết bị",
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Câu lạc bộ
                  </label>
                  <select
                    {...register("location_id")}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Tất cả câu lạc bộ</option>
                    {clubs.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name || c.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Đơn giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={priceDisplay}
                    onChange={(e) => formatPriceInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.unitPrice ? "border-red-500" : "border-slate-200"}`}
                  />
                  <input
                    type="hidden"
                    {...register("unitPrice", {
                      required: "Vui lòng nhập đơn giá",
                      validate: (v) =>
                        Number(v) > 0 || "Đơn giá phải lớn hơn 0",
                    })}
                  />
                  {errors.unitPrice && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.unitPrice.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("quantity", {
                      required: "Vui lòng nhập số lượng",
                      validate: (v) =>
                        Number(v) > 0 || "Số lượng phải lớn hơn 0",
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.quantity ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.quantity && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.quantity.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thời gian bảo hành (tháng)
                  </label>
                  <input
                    type="number"
                    {...register("warranty_period")}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Thông tin nhà cung cấp & Giấy tờ
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("supplier", {
                      required: "Vui lòng nhập nhà cung cấp",
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.supplier ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.supplier && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.supplier?.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address", {
                      required: "Vui lòng nhập địa chỉ",
                    })}
                    rows={3}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.address && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.address?.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Vui lòng nhập số điện thoại",
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.phone?.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Người mua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("purchaser", {
                      required: "Vui lòng nhập người mua",
                    })}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.purchaser ? "border-red-500" : "border-slate-200"}`}
                  />
                  {errors.purchaser && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.purchaser?.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ảnh Hóa đơn (Scan từ máy)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "invoice_url")}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl cursor-pointer"
                  />
                  {watch("invoice_url") && (
                    <span className="text-xs text-green-600 font-bold mt-2 inline-block">
                      ✓ Đã tải ảnh hóa đơn thành công
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ảnh Phiếu bảo hành (Scan từ máy)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "warranty_card_url")}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl cursor-pointer"
                  />
                  {watch("warranty_card_url") && (
                    <span className="text-xs text-green-600 font-bold mt-2 inline-block">
                      ✓ Đã tải phiếu bảo hành thành công
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate("/admin/equipment")}
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
              {submitting ? "Đang thêm..." : "Thêm thiết bị"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
