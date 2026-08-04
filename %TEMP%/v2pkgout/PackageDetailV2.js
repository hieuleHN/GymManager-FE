import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  BadgePercent,
  CalendarDays,
  Dumbbell,
  Layers,
  Wallet,
  ShoppingCart,
  UserRound,
  Check
} from "lucide-react";
const TYPE_STYLES = {
  STANDARD: "bg-indigo-100 text-indigo-700",
  COMBO: "bg-amber-100 text-amber-700",
  PT: "bg-emerald-100 text-emerald-700"
};
const TYPE_LABELS = {
  STANDARD: "G\xF3i ti\xEAu chu\u1EA9n",
  COMBO: "G\xF3i combo",
  PT: "G\xF3i PT"
};
const resolveImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `${getApiUrl()}/${image.replace(/^\/+/, "")}`;
};
const formatVnd = (value) => (value ?? 0).toLocaleString("vi-VN");
export function PackageDetailV2() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetch(`${getApiUrl()}/api/v2/packages/${id}`, { headers: getAuthHeaders() }).then((res) => res.json()).then((data) => {
      if (!data?.data) throw new Error(data?.message || "Kh\xF4ng t\xECm th\u1EA5y g\xF3i t\u1EADp");
      setPkg(data.data);
      return fetch(`${getApiUrl()}/api/v2/packages/${id}/related`, { headers: getAuthHeaders() });
    }).then((res) => res.json()).then((data) => {
      if (data?.data) setRelated(data.data);
    }).catch((err) => setError(err.message || "Kh\xF4ng th\u1EC3 t\u1EA3i th\xF4ng tin g\xF3i t\u1EADp")).finally(() => setLoading(false));
  }, [id]);
  const handleBuy = () => {
    navigate(`/admin/v2/packages/${id}/checkout`);
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto py-20 flex items-center justify-center text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-6 h-6 animate-spin" }), " ", /* @__PURE__ */ React.createElement("span", { className: "ml-2" }, "\u0110ang t\u1EA3i th\xF4ng tin g\xF3i t\u1EADp...")));
  }
  if (error || !pkg) {
    return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto py-20 flex flex-col items-center gap-4" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-10 h-10 text-red-500" }), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 font-semibold" }, error || "Kh\xF4ng t\xECm th\u1EA5y g\xF3i t\u1EADp"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => navigate("/admin/v2/packages"),
        className: "px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
      },
      "Quay l\u1EA1i danh s\xE1ch"
    )));
  }
  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 4e3);
  };
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/admin/v2/packages"),
      className: "flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4" }),
    " Quay l\u1EA1i danh s\xE1ch g\xF3i t\u1EADp"
  ), banner && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, banner)), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-5" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 bg-slate-50 p-8 flex items-center justify-center" }, pkg.image ? /* @__PURE__ */ React.createElement(
    "img",
    {
      src: resolveImageUrl(pkg.image),
      alt: pkg.name,
      className: "w-full max-w-sm h-64 object-cover rounded-2xl border border-slate-200"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400" }, /* @__PURE__ */ React.createElement(Dumbbell, { className: "w-12 h-12" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, "Ch\u01B0a c\xF3 h\xECnh \u1EA3nh"))), /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-3 p-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[pkg.type] || "bg-slate-100 text-slate-500"}` }, TYPE_LABELS[pkg.type] || pkg.type), /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-black text-slate-900 mt-3" }, pkg.name), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 mt-2 leading-relaxed" }, pkg.description || "Ch\u01B0a c\xF3 m\xF4 t\u1EA3 chi ti\u1EBFt.")), /* @__PURE__ */ React.createElement("span", { className: `px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${pkg.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}` }, pkg.status === "ACTIVE" ? "\u0110ang ho\u1EA1t \u0111\u1ED9ng" : "T\u1EA1m d\u1EEBng")), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex items-end gap-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-4xl font-black text-indigo-600" }, formatVnd(pkg.effectivePrice), "\u0111"), (pkg.originalPrice || 0) > (pkg.effectivePrice ?? 0) && /* @__PURE__ */ React.createElement("p", { className: "text-lg text-slate-400 line-through pb-1" }, formatVnd(pkg.originalPrice), "\u0111"), (pkg.discountPercent || 0) > 0 && /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold mb-1" }, /* @__PURE__ */ React.createElement(BadgePercent, { className: "w-3.5 h-3.5" }), " Gi\u1EA3m ", pkg.discountPercent, "%")), /* @__PURE__ */ React.createElement("div", { className: "mt-6 grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement(CalendarDays, { className: "w-5 h-5 text-indigo-500 mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 font-semibold uppercase" }, "Th\u1EDDi h\u1EA1n"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800" }, pkg.durationLabel)), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement(Layers, { className: "w-5 h-5 text-indigo-500 mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 font-semibold uppercase" }, "Bu\u1ED5i PT"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800" }, pkg.ptSessionsPerMonth > 0 ? `${pkg.ptSessionsPerMonth}/th\xE1ng` : "T\u1EF1 do")), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement(UserRound, { className: "w-5 h-5 text-indigo-500 mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 font-semibold uppercase" }, "\u0110\xE3 \u0111\u0103ng k\xFD"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800" }, pkg.sold ?? 0)), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement(Wallet, { className: "w-5 h-5 text-indigo-500 mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 font-semibold uppercase" }, "Doanh thu"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800" }, formatVnd(pkg.totalRevenue), "\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "mt-6" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-slate-700 uppercase mb-3" }, "T\xEDnh n\u0103ng g\xF3i"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" }, (pkg.features || []).length > 0 ? pkg.features.map((feature, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "flex items-center gap-2 text-sm text-slate-600" }, /* @__PURE__ */ React.createElement(Check, { className: "w-4 h-4 text-emerald-500 shrink-0" }), feature)) : /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-400" }, "Ch\u01B0a c\xF3 t\xEDnh n\u0103ng n\xE0o."))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 flex gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBuy,
      disabled: pkg.status !== "ACTIVE",
      className: "flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    },
    /* @__PURE__ */ React.createElement(ShoppingCart, { className: "w-4 h-4" }),
    " Mua / \u0110\u0103ng k\xFD g\xF3i n\xE0y"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate(`/admin/v2/packages/${pkg._id}/edit`),
      className: "px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
    },
    "Ch\u1EC9nh s\u1EEDa g\xF3i"
  ))))), related.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-slate-800 mb-4" }, "G\xF3i t\u1EADp li\xEAn quan"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" }, related.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item._id,
      onClick: () => navigate(`/admin/v2/packages/${item._id}`),
      className: "bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-md transition-all"
    },
    item.image && /* @__PURE__ */ React.createElement(
      "img",
      {
        src: resolveImageUrl(item.image),
        alt: item.name,
        className: "w-full h-24 object-cover rounded-xl mb-3"
      }
    ),
    /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 text-sm" }, item.name),
    /* @__PURE__ */ React.createElement("p", { className: "text-indigo-600 font-black mt-2 text-sm" }, formatVnd(item.effectivePrice), "\u0111")
  ))))));
}
