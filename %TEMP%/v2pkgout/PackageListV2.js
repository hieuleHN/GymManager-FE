import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Power,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  BadgePercent,
  Dumbbell,
  CalendarDays,
  Wallet
} from "lucide-react";
const TYPE_FILTERS = [
  { key: "ALL", label: "T\u1EA5t c\u1EA3" },
  { key: "STANDARD", label: "Ti\xEAu chu\u1EA9n" },
  { key: "COMBO", label: "Combo" },
  { key: "PT", label: "PT" }
];
const TYPE_STYLES = {
  STANDARD: "bg-indigo-100 text-indigo-700",
  COMBO: "bg-amber-100 text-amber-700",
  PT: "bg-emerald-100 text-emerald-700"
};
const TYPE_LABELS = {
  STANDARD: "Ti\xEAu chu\u1EA9n",
  COMBO: "Combo",
  PT: "PT"
};
const emptyForm = {
  name: "",
  type: "STANDARD",
  price: "",
  originalPrice: "",
  discountPercent: "0",
  durationMonths: "1",
  durationDays: "30",
  ptSessionsPerMonth: "0",
  isFullMonth: false,
  features: "",
  description: "",
  image: ""
};
const resolveImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `${getApiUrl()}/${image.replace(/^\/+/, "")}`;
};
const formatVnd = (value) => (value ?? 0).toLocaleString("vi-VN");
export function PackageListV2() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [summary, setSummary] = useState({ total: 0, activeCount: 0, inactiveCount: 0, totalSold: 0, totalRevenue: 0, totalValue: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchPackages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "L\u1ED7i t\u1EA3i danh s\xE1ch g\xF3i t\u1EADp");
      setPackages(data.data || []);
    } catch (err) {
      setError(err.message || "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi m\xE1y ch\u1EE7");
    } finally {
      setLoading(false);
    }
  };
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages/summary`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data?.data) setSummary(data.data);
    } catch {
    }
  };
  const refreshAll = () => {
    fetchPackages();
    fetchSummary();
  };
  useEffect(() => {
    refreshAll();
  }, []);
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || pkg.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || pkg.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 4e3);
  };
  const handleToggleStatus = async (pkg) => {
    const action = pkg.status === "ACTIVE" ? "t\u1EA1m d\u1EEBng" : "k\xEDch ho\u1EA1t";
    if (!window.confirm(`B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n ${action} g\xF3i "${pkg.name}"?`)) return;
    setToggling(pkg._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages/${pkg._id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thay \u0111\u1ED5i tr\u1EA1ng th\xE1i th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\xE3 c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setToggling(null);
    }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n x\xF3a g\xF3i t\u1EADp "${name}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "X\xF3a th\u1EA5t b\u1EA1i");
      showBanner("X\xF3a g\xF3i t\u1EADp th\xE0nh c\xF4ng");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeleting(null);
    }
  };
  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalError("");
    setShowModal(true);
  };
  const openEditModal = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name,
      type: pkg.type,
      price: String(pkg.price ?? ""),
      originalPrice: String(pkg.originalPrice ?? ""),
      discountPercent: String(pkg.discountPercent ?? 0),
      durationMonths: String(pkg.durationMonths ?? 1),
      durationDays: String(pkg.durationDays ?? 30),
      ptSessionsPerMonth: String(pkg.ptSessionsPerMonth ?? 0),
      isFullMonth: !!pkg.isFullMonth,
      features: (pkg.features || []).join(", "),
      description: pkg.description || "",
      image: pkg.image || ""
    });
    setModalError("");
    setShowModal(true);
  };
  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setModalError("");
    if (!form.name.trim()) {
      setModalError("Vui l\xF2ng nh\u1EADp t\xEAn g\xF3i t\u1EADp");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      setModalError("Gi\xE1 g\xF3i t\u1EADp kh\xF4ng h\u1EE3p l\u1EC7");
      return;
    }
    if (Number(form.discountPercent) < 0 || Number(form.discountPercent) > 100) {
      setModalError("Ph\u1EA7n tr\u0103m khuy\u1EBFn m\xE3i ph\u1EA3i trong kho\u1EA3ng 0 - 100");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || 0,
        discountPercent: Number(form.discountPercent) || 0,
        durationMonths: Number(form.durationMonths) || 0,
        durationDays: Number(form.durationDays) || 0,
        ptSessionsPerMonth: Number(form.ptSessionsPerMonth) || 0,
        isFullMonth: form.isFullMonth,
        features: form.features,
        description: form.description,
        image: form.image
      };
      const url = editingId ? `${getApiUrl()}/api/v2/packages/${editingId}` : `${getApiUrl()}/api/v2/packages`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || (editingId ? "C\u1EADp nh\u1EADt th\u1EA5t b\u1EA1i" : "Th\xEAm th\u1EA5t b\u1EA1i"));
      showBanner(data.message || (editingId ? "C\u1EADp nh\u1EADt g\xF3i t\u1EADp th\xE0nh c\xF4ng" : "Th\xEAm g\xF3i t\u1EADp th\xE0nh c\xF4ng"));
      setShowModal(false);
      refreshAll();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "Qu\u1EA3n l\xFD G\xF3i t\u1EADp V2"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "Danh s\xE1ch g\xF3i t\u1EADp, khuy\u1EBFn m\xE3i, \u0111\u0103ng k\xFD g\xF3i v\xE0 theo d\xF5i doanh thu")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/admin/v2/packages/transactions"),
      className: "flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
    },
    /* @__PURE__ */ React.createElement(Wallet, { className: "w-4 h-4" }),
    " Giao d\u1ECBch"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openAddModal,
      className: "flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" }),
    " Th\xEAm g\xF3i t\u1EADp"
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "T\u1ED5ng g\xF3i t\u1EADp"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-slate-900" }, summary.total), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, summary.activeCount, " \u0111ang ho\u1EA1t \u0111\u1ED9ng")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "T\u1EA1m d\u1EEBng"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-amber-500" }, summary.inactiveCount)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "\u0110\xE3 \u0111\u0103ng k\xFD"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-indigo-600" }, summary.totalSold), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "l\u01B0\u1EE3t \u0111\u0103ng k\xFD g\xF3i")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Doanh thu"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-emerald-600" }, formatVnd(summary.totalRevenue), "\u0111"))), banner && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, banner)), error && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-5 h-5 text-red-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, error)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full md:w-80" }, /* @__PURE__ */ React.createElement(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "T\xECm t\xEAn ho\u1EB7c m\xF4 t\u1EA3 g\xF3i t\u1EADp...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap w-full md:w-auto" }, TYPE_FILTERS.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.key,
      onClick: () => setTypeFilter(item.key),
      className: `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${typeFilter === item.key ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
    },
    item.label
  )), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: statusFilter,
      onChange: (e) => setStatusFilter(e.target.value),
      className: "px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border-0 focus:outline-none"
    },
    /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "M\u1ECDi tr\u1EA1ng th\xE1i"),
    /* @__PURE__ */ React.createElement("option", { value: "ACTIVE" }, "\u0110ang ho\u1EA1t \u0111\u1ED9ng"),
    /* @__PURE__ */ React.createElement("option", { value: "INACTIVE" }, "T\u1EA1m d\u1EEBng")
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-sm text-slate-600" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "STT"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "\u1EA2nh"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "G\xF3i T\u1EADp"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Lo\u1EA1i"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Gi\xE1"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "KM"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Th\u1EDDi H\u1EA1n"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "PT"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "\u0110\xE3 \u0110K"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Tr\u1EA1ng Th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Thao T\xE1c"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-100" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 11, className: "p-10 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin" }), " \u0110ang t\u1EA3i danh s\xE1ch..."))) : filteredPackages.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 11, className: "p-10 text-center text-slate-400" }, "Kh\xF4ng t\xECm th\u1EA5y g\xF3i t\u1EADp n\xE0o")) : filteredPackages.map((pkg, index) => /* @__PURE__ */ React.createElement("tr", { key: pkg._id, className: "hover:bg-slate-50/50" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 text-slate-500" }, index + 1), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, pkg.image ? /* @__PURE__ */ React.createElement(
    "img",
    {
      src: resolveImageUrl(pkg.image),
      alt: pkg.name,
      className: "w-12 h-12 object-cover rounded-lg border border-slate-100"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Dumbbell, { className: "w-5 h-5 text-slate-400" }))), /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800" }, pkg.name, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-400 font-normal max-w-[220px] truncate" }, pkg.description)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[pkg.type] || "bg-slate-100 text-slate-500"}` }, TYPE_LABELS[pkg.type] || pkg.type)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, formatVnd(pkg.effectivePrice ?? pkg.price), "\u0111"), (pkg.originalPrice || 0) > (pkg.effectivePrice ?? 0) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-400 line-through" }, formatVnd(pkg.originalPrice), "\u0111")), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, (pkg.discountPercent || 0) > 0 ? /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold" }, /* @__PURE__ */ React.createElement(BadgePercent, { className: "w-3.5 h-3.5" }), " ", pkg.discountPercent, "%") : /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-300" }, "\u2014")), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-xs font-semibold text-slate-600" }, /* @__PURE__ */ React.createElement(CalendarDays, { className: "w-3.5 h-3.5 text-slate-400" }), " ", pkg.durationLabel)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-slate-600" }, pkg.ptSessionsPerMonth > 0 ? `${pkg.ptSessionsPerMonth} bu\u1ED5i/th\xE1ng` : "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4 font-semibold text-indigo-600" }, pkg.sold ?? 0), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${pkg.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}` }, pkg.status === "ACTIVE" ? "Ho\u1EA1t \u0111\u1ED9ng" : "T\u1EA1m d\u1EEBng")), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate(`/admin/v2/packages/${pkg._id}`),
      className: "p-2 text-slate-500 hover:bg-slate-100 rounded-lg",
      title: "Xem chi ti\u1EBFt"
    },
    /* @__PURE__ */ React.createElement(Eye, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleToggleStatus(pkg),
      disabled: toggling === pkg._id,
      className: `p-2 rounded-lg disabled:opacity-50 ${pkg.status === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`,
      title: pkg.status === "ACTIVE" ? "T\u1EA1m d\u1EEBng" : "K\xEDch ho\u1EA1t"
    },
    toggling === pkg._id ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Power, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openEditModal(pkg),
      className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg",
      title: "S\u1EEDa"
    },
    /* @__PURE__ */ React.createElement(Edit, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleDelete(pkg._id, pkg.name),
      disabled: deleting === pkg._id,
      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50",
      title: "X\xF3a"
    },
    deleting === pkg._id ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Trash2, { className: "w-4 h-4" })
  )))))))))), showModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center", onClick: () => {
    setShowModal(false);
    setEditingId(null);
  } }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-slate-900" }, editingId ? "S\u1EEDa g\xF3i t\u1EADp" : "Th\xEAm g\xF3i t\u1EADp"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setShowModal(false);
    setEditingId(null);
  }, className: "p-2 hover:bg-slate-100 rounded-lg" }, /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5 text-slate-600" }))), modalError && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-4 h-4 text-red-600" }), " ", modalError), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmitModal, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "T\xEAn G\xF3i T\u1EADp ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: form.name,
      onChange: (e) => setForm({ ...form, name: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Lo\u1EA1i G\xF3i"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.type,
      onChange: (e) => setForm({ ...form, type: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    },
    /* @__PURE__ */ React.createElement("option", { value: "STANDARD" }, "G\xF3i ti\xEAu chu\u1EA9n"),
    /* @__PURE__ */ React.createElement("option", { value: "COMBO" }, "G\xF3i combo"),
    /* @__PURE__ */ React.createElement("option", { value: "PT" }, "G\xF3i PT")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Gi\xE1 B\xE1n (\u0111) ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      required: true,
      value: form.price,
      onChange: (e) => setForm({ ...form, price: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Gi\xE1 G\u1ED1c (\u0111)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.originalPrice,
      onChange: (e) => setForm({ ...form, originalPrice: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Khuy\u1EBFn M\xE3i (%)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      max: 100,
      value: form.discountPercent,
      onChange: (e) => setForm({ ...form, discountPercent: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Th\u1EDDi H\u1EA1n (th\xE1ng)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.durationMonths,
      onChange: (e) => setForm({ ...form, durationMonths: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ho\u1EB7c S\u1ED1 Ng\xE0y"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.durationDays,
      onChange: (e) => setForm({ ...form, durationDays: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 Bu\u1ED5i PT / Th\xE1ng"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.ptSessionsPerMonth,
      onChange: (e) => setForm({ ...form, ptSessionsPerMonth: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ))), /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-2 text-sm font-semibold text-slate-700" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: form.isFullMonth,
      onChange: (e) => setForm({ ...form, isFullMonth: e.target.checked }),
      className: "w-4 h-4 accent-indigo-600"
    }
  ), "Tr\u1ECDn th\xE1ng (kh\xF4ng gi\u1EDBi h\u1EA1n ng\xE0y ngh\u1EC9)"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "T\xEDnh N\u0103ng (ph\xE2n c\xE1ch b\u1EB1ng d\u1EA5u ph\u1EA9y)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: form.features,
      onChange: (e) => setForm({ ...form, features: e.target.value }),
      placeholder: "Ph\xF2ng gym, Yoga, T\u1EADp luy\u1EC7n t\u1EF1 do...",
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "M\xF4 T\u1EA3"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: form.description,
      onChange: (e) => setForm({ ...form, description: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "URL \u1EA2nh"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: form.image,
      onChange: (e) => setForm({ ...form, image: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setShowModal(false);
        setEditingId(null);
      },
      className: "px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
    },
    "H\u1EE7y"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: submitting,
      className: "px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
    },
    submitting ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Save, { className: "w-4 h-4" }),
    submitting ? "\u0110ang l\u01B0u..." : editingId ? "C\u1EADp Nh\u1EADt" : "Th\xEAm G\xF3i T\u1EADp"
  ))))));
}
