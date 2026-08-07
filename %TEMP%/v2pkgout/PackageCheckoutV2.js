import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  UserRound,
  ShoppingCart,
  Wallet,
  CreditCard,
  Banknote,
  Minus,
  Plus
} from "lucide-react";
const PAYMENT_OPTIONS = [
  { key: "CASH", label: "Ti\u1EC1n m\u1EB7t", icon: Banknote },
  { key: "TRANSFER", label: "Chuy\u1EC3n kho\u1EA3n", icon: CreditCard },
  { key: "CARD", label: "Qu\u1EB9t th\u1EBB", icon: CreditCard }
];
const resolveImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `${getApiUrl()}/${image.replace(/^\/+/, "")}`;
};
const formatVnd = (value) => (value ?? 0).toLocaleString("vi-VN");
export function PackageCheckoutV2() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const packageId = paramId || searchParams.get("package") || "";
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    paymentMethod: "CASH",
    quantity: "1",
    note: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!packageId) {
      setError("Thi\u1EBFu m\xE3 g\xF3i t\u1EADp. Vui l\xF2ng quay l\u1EA1i ch\u1ECDn g\xF3i.");
      setLoading(false);
      return;
    }
    fetch(`${getApiUrl()}/api/v2/packages/${packageId}`, { headers: getAuthHeaders() }).then((res) => res.json()).then((data) => {
      if (!data?.data) throw new Error(data?.message || "Kh\xF4ng t\xECm th\u1EA5y g\xF3i t\u1EADp");
      setPkg(data.data);
    }).catch((err) => setError(err.message || "Kh\xF4ng th\u1EC3 t\u1EA3i th\xF4ng tin g\xF3i t\u1EADp")).finally(() => setLoading(false));
  }, [packageId]);
  const quantity = parseInt(form.quantity) || 1;
  const unitPrice = pkg?.effectivePrice ?? pkg?.price ?? 0;
  const totalPrice = unitPrice * (quantity < 1 ? 1 : quantity);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.customerName.trim()) {
      setError("Vui l\xF2ng nh\u1EADp t\xEAn kh\xE1ch h\xE0ng");
      return;
    }
    if (!form.customerPhone.trim()) {
      setError("Vui l\xF2ng nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xE1ch h\xE0ng");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages/${packageId}/checkout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          paymentMethod: form.paymentMethod,
          quantity,
          note: form.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "\u0110\u0103ng k\xFD g\xF3i th\u1EA5t b\u1EA1i");
      setSuccess(data.message || "\u0110\u0103ng k\xFD g\xF3i t\u1EADp th\xE0nh c\xF4ng");
      setForm({ customerName: "", customerPhone: "", customerEmail: "", paymentMethod: "CASH", quantity: "1", note: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto py-20 flex items-center justify-center text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-6 h-6 animate-spin" }), " ", /* @__PURE__ */ React.createElement("span", { className: "ml-2" }, "\u0110ang t\u1EA3i th\xF4ng tin g\xF3i t\u1EADp...")));
  }
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate(packageId ? `/admin/v2/packages/${packageId}` : "/admin/v2/packages"),
      className: "flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4" }),
    " Quay l\u1EA1i"
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "\u0110\u0103ng k\xFD g\xF3i t\u1EADp V2"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "Nh\u1EADp th\xF4ng tin kh\xE1ch h\xE0ng v\xE0 ho\xE0n t\u1EA5t thanh to\xE1n")), success && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, success)), error && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-4 h-4 text-red-600 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, error)), !pkg && error && !success && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-8 text-center" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-10 h-10 text-red-500 mx-auto mb-3" }), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 font-semibold" }, error), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/admin/v2/packages"),
      className: "mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
    },
    "Ch\u1ECDn g\xF3i t\u1EADp"
  )), pkg && /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 lg:grid-cols-5 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-3 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-6 space-y-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2" }, /* @__PURE__ */ React.createElement(UserRound, { className: "w-4 h-4 text-indigo-500" }), " Th\xF4ng tin kh\xE1ch h\xE0ng"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "H\u1ECD v\xE0 T\xEAn ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: form.customerName,
      onChange: (e) => setForm({ ...form, customerName: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
      placeholder: "Nguy\u1EC5n V\u0103n A"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 \u0110i\u1EC7n Tho\u1EA1i ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      required: true,
      value: form.customerPhone,
      onChange: (e) => setForm({ ...form, customerPhone: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
      placeholder: "0987654321"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      value: form.customerEmail,
      onChange: (e) => setForm({ ...form, customerEmail: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
      placeholder: "khachhang@gmail.com"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-6 space-y-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Wallet, { className: "w-4 h-4 text-indigo-500" }), " Ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, PAYMENT_OPTIONS.map((option) => {
    const Icon = option.icon;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: option.key,
        type: "button",
        onClick: () => setForm({ ...form, paymentMethod: option.key }),
        className: `flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.paymentMethod === option.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { className: "w-5 h-5" }),
      option.label
    );
  })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 L\u01B0\u1EE3ng"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setForm({ ...form, quantity: String(Math.max(1, quantity - 1)) }),
      className: "p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
    },
    /* @__PURE__ */ React.createElement(Minus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      value: form.quantity,
      onChange: (e) => setForm({ ...form, quantity: e.target.value }),
      className: "w-20 text-center px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setForm({ ...form, quantity: String(quantity + 1) }),
      className: "p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-400" }, "t\u1EEB 1 \u0111\u1EBFn 12 th\xE1ng / g\xF3i"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ghi Ch\xFA"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: form.note,
      onChange: (e) => setForm({ ...form, note: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
      placeholder: "Ghi ch\xFA th\xEAm (n\u1EBFu c\xF3)..."
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-6 sticky top-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase mb-4" }, "T\xF3m t\u1EAFt \u0111\u01A1n h\xE0ng"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 items-center" }, pkg.image ? /* @__PURE__ */ React.createElement(
    "img",
    {
      src: resolveImageUrl(pkg.image),
      alt: pkg.name,
      className: "w-16 h-16 object-cover rounded-xl border border-slate-100"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Dumbbell, { className: "w-6 h-6 text-slate-400" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800" }, pkg.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400" }, pkg.durationLabel, pkg.ptSessionsPerMonth > 0 ? ` \xB7 ${pkg.ptSessionsPerMonth} bu\u1ED5i PT/th\xE1ng` : ""))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 space-y-3 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-500" }, "\u0110\u01A1n gi\xE1"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-800" }, formatVnd(unitPrice), "\u0111")), (pkg.discountPercent || 0) > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-600" }, /* @__PURE__ */ React.createElement("span", null, "Khuy\u1EBFn m\xE3i"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, "-", pkg.discountPercent, "%")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-500" }, "S\u1ED1 l\u01B0\u1EE3ng"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-800" }, "x ", quantity)), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 pt-3 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-700" }, "T\u1ED5ng c\u1ED9ng"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-black text-indigo-600" }, formatVnd(totalPrice), "\u0111"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: submitting || pkg.status !== "ACTIVE",
      className: "mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
    },
    submitting ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(ShoppingCart, { className: "w-4 h-4" }),
    submitting ? "\u0110ang x\u1EED l\xFD..." : "X\xE1c nh\u1EADn \u0111\u0103ng k\xFD"
  ), pkg.status !== "ACTIVE" && /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-xs text-center text-red-500 font-semibold" }, "G\xF3i n\xE0y \u0111ang t\u1EA1m d\u1EEBng, kh\xF4ng th\u1EC3 \u0111\u0103ng k\xFD."))))));
}
