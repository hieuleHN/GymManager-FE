import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  Search,
  Plus,
  Eye,
  Power,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  RefreshCw,
  Dumbbell,
  CalendarDays,
  Wallet,
  Phone,
  Mail,
  Banknote,
  HandCoins,
  MessageSquareQuote
} from "lucide-react";
const STATUS_FILTERS = [
  { key: "ALL", label: "T\u1EA5t c\u1EA3" },
  { key: "ACTIVE", label: "\u0110ang ho\u1EA1t \u0111\u1ED9ng" },
  { key: "EXPIRING_SOON", label: "S\u1EAFp h\u1EBFt h\u1EA1n" },
  { key: "EXPIRED", label: "\u0110\xE3 h\u1EBFt h\u1EA1n" },
  { key: "CANCELLED", label: "\u0110\xE3 h\u1EE7y" }
];
const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRING_SOON: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500"
};
const STATUS_LABELS = {
  ACTIVE: "\u0110ang ho\u1EA1t \u0111\u1ED9ng",
  EXPIRING_SOON: "S\u1EAFp h\u1EBFt h\u1EA1n",
  EXPIRED: "\u0110\xE3 h\u1EBFt h\u1EA1n",
  CANCELLED: "\u0110\xE3 h\u1EE7y"
};
const PAYMENT_STYLES = {
  PAID: "bg-emerald-50 text-emerald-600",
  PENDING: "bg-amber-50 text-amber-600",
  CANCELLED: "bg-slate-100 text-slate-500"
};
const PAYMENT_LABELS = {
  PAID: "\u0110\xE3 thanh to\xE1n",
  PENDING: "Ch\u1EDD thanh to\xE1n",
  CANCELLED: "\u0110\xE3 h\u1EE7y"
};
const PAYMENT_METHOD_LABELS = {
  CASH: "Ti\u1EC1n m\u1EB7t",
  TRANSFER: "Chuy\u1EC3n kho\u1EA3n",
  CARD: "Th\u1EBB"
};
const formatVnd = (value) => (value ?? 0).toLocaleString("vi-VN");
const formatDate = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "\u2014";
export function MyPackagesV2() {
  const [memberships, setMemberships] = useState([]);
  const [summary, setSummary] = useState({ total: 0, activeCount: 0, expiringCount: 0, expiredCount: 0, cancelledCount: 0, pendingPaymentCount: 0, totalRevenue: 0, totalCustomers: 0 });
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showExtend, setShowExtend] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    packageId: "",
    durationMonths: "1",
    startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    totalPrice: "",
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    note: ""
  });
  const [extendForm, setExtendForm] = useState({ addMonths: "1", additionalPrice: "" });
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchMemberships = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "L\u1ED7i t\u1EA3i danh s\xE1ch g\xF3i h\u1ED9i vi\xEAn");
      setMemberships(data.data || []);
    } catch (err) {
      setError(err.message || "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi m\xE1y ch\u1EE7");
    } finally {
      setLoading(false);
    }
  };
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/summary`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data?.data) setSummary(data.data);
    } catch {
    }
  };
  const fetchPackages = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/packages?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data?.data) setPackages(data.data.filter((pkg) => pkg.status === "ACTIVE"));
    } catch {
    }
  };
  const refreshAll = () => {
    fetchMemberships();
    fetchSummary();
    fetchPackages();
  };
  useEffect(() => {
    refreshAll();
  }, []);
  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch = m.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.customerPhone?.includes(searchTerm) || m.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) || (m.membershipCode || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    const matchesPayment = paymentFilter === "ALL" || m.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });
  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 4e3);
  };
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/refresh-status`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "C\u1EADp nh\u1EADt th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\xE3 c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i g\xF3i h\u1ED9i vi\xEAn");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  const openRegisterModal = () => {
    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      packageId: "",
      durationMonths: "1",
      startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      totalPrice: "",
      paymentStatus: "PAID",
      paymentMethod: "CASH",
      note: ""
    });
    setModalError("");
    setShowRegister(true);
  };
  const handlePackageSelect = (packageId) => {
    const selected = packages.find((pkg) => pkg._id === packageId);
    setForm((prev) => ({
      ...prev,
      packageId,
      durationMonths: selected && selected.durationMonths > 0 ? String(selected.durationMonths) : prev.durationMonths,
      totalPrice: selected ? String(selected.effectivePrice ?? selected.price ?? "") : prev.totalPrice
    }));
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    setModalError("");
    if (!form.customerName.trim()) {
      setModalError("Vui l\xF2ng nh\u1EADp t\xEAn h\u1ED9i vi\xEAn");
      return;
    }
    if (!form.customerPhone.trim()) {
      setModalError("Vui l\xF2ng nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i h\u1ED9i vi\xEAn");
      return;
    }
    if (!form.packageId) {
      setModalError("Vui l\xF2ng ch\u1ECDn g\xF3i t\u1EADp");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          packageId: form.packageId,
          durationMonths: Number(form.durationMonths) || 1,
          startDate: form.startDate,
          totalPrice: Number(form.totalPrice) || 0,
          paymentStatus: form.paymentStatus,
          paymentMethod: form.paymentMethod,
          note: form.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "\u0110\u0103ng k\xFD th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\u0103ng k\xFD g\xF3i h\u1ED9i vi\xEAn th\xE0nh c\xF4ng");
      setShowRegister(false);
      refreshAll();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const handleCancel = async (membership) => {
    if (!window.confirm(`H\u1EE7y g\xF3i "${membership.packageName}" c\u1EE7a "${membership.customerName}"?`)) return;
    setBusyId(membership._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/cancel`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "H\u1EE7y g\xF3i th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\xE3 h\u1EE7y g\xF3i h\u1ED9i vi\xEAn");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusyId(null);
    }
  };
  const handleConfirmPayment = async (membership) => {
    if (!window.confirm(`X\xE1c nh\u1EADn \u0111\xE3 thanh to\xE1n g\xF3i "${membership.packageName}" c\u1EE7a "${membership.customerName}"?`)) return;
    setBusyId(membership._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/payment`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "X\xE1c nh\u1EADn th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\xE3 x\xE1c nh\u1EADn thanh to\xE1n");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusyId(null);
    }
  };
  const handleDeductSession = async (membership) => {
    if (!window.confirm(`Tr\u1EEB 1 bu\u1ED5i PT cho g\xF3i "${membership.packageName}" c\u1EE7a "${membership.customerName}"?`)) return;
    setBusyId(membership._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}/pt-sessions/deduct`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tr\u1EEB bu\u1ED5i PT th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110\xE3 tr\u1EEB 1 bu\u1ED5i PT");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusyId(null);
    }
  };
  const handleDelete = async (membership) => {
    if (!window.confirm(`X\xF3a v\u0129nh vi\u1EC5n g\xF3i "${membership.packageName}" c\u1EE7a "${membership.customerName}"?`)) return;
    setBusyId(membership._id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${membership._id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "X\xF3a th\u1EA5t b\u1EA1i");
      showBanner("X\xF3a g\xF3i h\u1ED9i vi\xEAn th\xE0nh c\xF4ng");
      refreshAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusyId(null);
    }
  };
  const handleExtend = async (e) => {
    e.preventDefault();
    if (!showExtend) return;
    setModalError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/user-packages/${showExtend._id}/extend`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          addMonths: Number(extendForm.addMonths) || 1,
          additionalPrice: Number(extendForm.additionalPrice) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gia h\u1EA1n th\u1EA5t b\u1EA1i");
      showBanner(data.message || "Gia h\u1EA1n th\xE0nh c\xF4ng");
      setShowExtend(null);
      refreshAll();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const openExtendModal = (membership) => {
    setExtendForm({ addMonths: "1", additionalPrice: "" });
    setModalError("");
    setShowExtend(membership);
  };
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "G\xF3i H\u1ED9i Vi\xEAn V2"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "Theo d\xF5i g\xF3i t\u1EADp c\u1EE7a h\u1ED9i vi\xEAn, h\u1EA1n s\u1EED d\u1EE5ng, bu\u1ED5i PT v\xE0 thanh to\xE1n")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleRefreshStatus,
      disabled: refreshing,
      className: "flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 disabled:opacity-60 transition-all"
    },
    /* @__PURE__ */ React.createElement(RefreshCw, { className: `w-4 h-4 ${refreshing ? "animate-spin" : ""}` }),
    " C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openRegisterModal,
      className: "flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" }),
    " \u0110\u0103ng k\xFD g\xF3i"
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "T\u1ED5ng \u0111\u0103ng k\xFD"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-slate-900" }, summary.total), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, summary.totalCustomers, " h\u1ED9i vi\xEAn")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "\u0110ang ho\u1EA1t \u0111\u1ED9ng"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-emerald-600" }, summary.activeCount), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-500 mt-1" }, summary.expiringCount, " s\u1EAFp h\u1EBFt h\u1EA1n")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "\u0110\xE3 h\u1EBFt h\u1EA1n / H\u1EE7y"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-red-500" }, summary.expiredCount), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, summary.cancelledCount, " \u0111\xE3 h\u1EE7y")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Doanh thu \u0111\xE3 thu"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-indigo-600" }, formatVnd(summary.totalRevenue), "\u0111"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-500 mt-1" }, summary.pendingPaymentCount, " \u0111ang ch\u1EDD thanh to\xE1n"))), banner && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, banner)), error && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-5 h-5 text-red-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, error)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full md:w-80" }, /* @__PURE__ */ React.createElement(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "T\xECm h\u1ED9i vi\xEAn, S\u0110T, g\xF3i ho\u1EB7c m\xE3...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap w-full md:w-auto items-center" }, STATUS_FILTERS.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.key,
      onClick: () => setStatusFilter(item.key),
      className: `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === item.key ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
    },
    item.label
  )), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: paymentFilter,
      onChange: (e) => setPaymentFilter(e.target.value),
      className: "px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border-0 focus:outline-none"
    },
    /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "M\u1ECDi thanh to\xE1n"),
    /* @__PURE__ */ React.createElement("option", { value: "PAID" }, "\u0110\xE3 thanh to\xE1n"),
    /* @__PURE__ */ React.createElement("option", { value: "PENDING" }, "Ch\u1EDD thanh to\xE1n"),
    /* @__PURE__ */ React.createElement("option", { value: "CANCELLED" }, "\u0110\xE3 h\u1EE7y")
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-sm text-slate-600" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "M\xE3"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "H\u1ED9i Vi\xEAn"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "G\xF3i T\u1EADp"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Th\u1EDDi H\u1EA1n"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "C\xF2n L\u1EA1i"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Bu\u1ED5i PT"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "T\u1ED5ng Ti\u1EC1n"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Thanh To\xE1n"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Tr\u1EA1ng Th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Thao T\xE1c"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-100" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 10, className: "p-10 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin" }), " \u0110ang t\u1EA3i danh s\xE1ch..."))) : filteredMemberships.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 10, className: "p-10 text-center text-slate-400" }, "Kh\xF4ng t\xECm th\u1EA5y g\xF3i h\u1ED9i vi\xEAn n\xE0o")) : filteredMemberships.map((m) => /* @__PURE__ */ React.createElement("tr", { key: m._id, className: "hover:bg-slate-50/50" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-mono text-xs font-bold text-indigo-600" }, m.membershipCode || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-slate-800" }, m.customerName), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-400" }, m.customerPhone)), /* @__PURE__ */ React.createElement("td", { className: "p-4 font-semibold text-slate-700" }, m.packageName), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-xs text-slate-500" }, /* @__PURE__ */ React.createElement("div", null, formatDate(m.startDate)), /* @__PURE__ */ React.createElement("div", { className: "text-slate-400" }, "\u2192 ", formatDate(m.endDate))), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, m.remainingDays, " ng\xE0y"), /* @__PURE__ */ React.createElement("div", { className: "mt-1 w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full rounded-full ${m.status === "EXPIRED" || m.status === "CANCELLED" ? "bg-red-400" : m.status === "EXPIRING_SOON" ? "bg-amber-400" : "bg-emerald-500"}`,
      style: { width: `${m.progressPercent}%` }
    }
  ))), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, m.ptSessionsPerMonth > 0 ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-600 font-bold" }, m.sessionsLeft), /* @__PURE__ */ React.createElement("span", { className: "text-slate-400" }, " / ", m.ptSessionsPerMonth * m.durationMonths, " c\xF2n l\u1EA1i")) : "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800" }, formatVnd(m.totalPrice), "\u0111"), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STYLES[m.paymentStatus] || "bg-slate-100 text-slate-500"}` }, PAYMENT_LABELS[m.paymentStatus] || m.paymentStatus)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[m.status] || "bg-slate-100 text-slate-500"}` }, STATUS_LABELS[m.status] || m.status)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowDetail(m),
      className: "p-2 text-slate-500 hover:bg-slate-100 rounded-lg",
      title: "Xem chi ti\u1EBFt"
    },
    /* @__PURE__ */ React.createElement(Eye, { className: "w-4 h-4" })
  ), m.ptSessionsPerMonth > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleDeductSession(m),
      disabled: busyId === m._id || m.status === "CANCELLED",
      className: "p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50",
      title: "Tr\u1EEB 1 bu\u1ED5i PT"
    },
    /* @__PURE__ */ React.createElement(Dumbbell, { className: "w-4 h-4" })
  ), m.paymentStatus === "PENDING" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleConfirmPayment(m),
      disabled: busyId === m._id,
      className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50",
      title: "X\xE1c nh\u1EADn thanh to\xE1n"
    },
    /* @__PURE__ */ React.createElement(HandCoins, { className: "w-4 h-4" })
  ), m.status !== "CANCELLED" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openExtendModal(m),
      className: "p-2 text-amber-600 hover:bg-amber-50 rounded-lg",
      title: "Gia h\u1EA1n"
    },
    /* @__PURE__ */ React.createElement(RefreshCw, { className: "w-4 h-4" })
  ), m.status !== "CANCELLED" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleCancel(m),
      disabled: busyId === m._id,
      className: "p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50",
      title: "H\u1EE7y g\xF3i"
    },
    /* @__PURE__ */ React.createElement(Power, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleDelete(m),
      disabled: busyId === m._id,
      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50",
      title: "X\xF3a"
    },
    busyId === m._id ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Trash2, { className: "w-4 h-4" })
  )))))))))), showRegister && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center", onClick: () => setShowRegister(false) }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-slate-900" }, "\u0110\u0103ng k\xFD g\xF3i cho h\u1ED9i vi\xEAn"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRegister(false), className: "p-2 hover:bg-slate-100 rounded-lg" }, /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5 text-slate-600" }))), modalError && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-4 h-4 text-red-600" }), " ", modalError), /* @__PURE__ */ React.createElement("form", { onSubmit: handleRegister, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "T\xEAn H\u1ED9i Vi\xEAn ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: form.customerName,
      onChange: (e) => setForm({ ...form, customerName: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 \u0110i\u1EC7n Tho\u1EA1i ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      required: true,
      value: form.customerPhone,
      onChange: (e) => setForm({ ...form, customerPhone: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      value: form.customerEmail,
      onChange: (e) => setForm({ ...form, customerEmail: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ch\u1ECDn G\xF3i T\u1EADp ", /* @__PURE__ */ React.createElement("span", { className: "text-red-500" }, "*")), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.packageId,
      onChange: (e) => handlePackageSelect(e.target.value),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Ch\u1ECDn g\xF3i t\u1EADp --"),
    packages.map((pkg) => /* @__PURE__ */ React.createElement("option", { key: pkg._id, value: pkg._id }, pkg.name, " \u2014 ", formatVnd(pkg.effectivePrice ?? pkg.price), "\u0111 / ", pkg.durationMonths > 0 ? `${pkg.durationMonths} th\xE1ng` : `${pkg.durationDays} ng\xE0y`))
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 Th\xE1ng"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      value: form.durationMonths,
      onChange: (e) => setForm({ ...form, durationMonths: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ng\xE0y B\u1EAFt \u0110\u1EA7u"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: form.startDate,
      onChange: (e) => setForm({ ...form, startDate: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "T\u1ED5ng Ti\u1EC1n (\u0111)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.totalPrice,
      onChange: (e) => setForm({ ...form, totalPrice: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ph\u01B0\u01A1ng Th\u1EE9c TT"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.paymentMethod,
      onChange: (e) => setForm({ ...form, paymentMethod: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    },
    /* @__PURE__ */ React.createElement("option", { value: "CASH" }, "Ti\u1EC1n m\u1EB7t"),
    /* @__PURE__ */ React.createElement("option", { value: "TRANSFER" }, "Chuy\u1EC3n kho\u1EA3n"),
    /* @__PURE__ */ React.createElement("option", { value: "CARD" }, "Th\u1EBB")
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Tr\u1EA1ng Th\xE1i Thanh To\xE1n"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, ["PAID", "PENDING"].map((key) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key,
      type: "button",
      onClick: () => setForm({ ...form, paymentStatus: key }),
      className: `flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${form.paymentStatus === key ? key === "PAID" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`
    },
    key === "PAID" ? "\u0110\xE3 thanh to\xE1n" : "Ch\u1EDD thanh to\xE1n"
  )))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ghi Ch\xFA"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: form.note,
      onChange: (e) => setForm({ ...form, note: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowRegister(false),
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
    submitting ? "\u0110ang l\u01B0u..." : "\u0110\u0103ng k\xFD g\xF3i"
  ))))), showExtend && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center", onClick: () => setShowExtend(null) }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 max-w-md w-full mx-4", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-slate-900" }, "Gia h\u1EA1n g\xF3i"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExtend(null), className: "p-2 hover:bg-slate-100 rounded-lg" }, /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5 text-slate-600" }))), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 mb-4" }, "G\xF3i ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, showExtend.packageName), " c\u1EE7a", " ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, showExtend.customerName), " hi\u1EC7n h\u1EBFt h\u1EA1n ng\xE0y", " ", /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-700" }, formatDate(showExtend.endDate)), "."), modalError && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-4 h-4 text-red-600" }), " ", modalError), /* @__PURE__ */ React.createElement("form", { onSubmit: handleExtend, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 Th\xE1ng Gia H\u1EA1n"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      value: extendForm.addMonths,
      onChange: (e) => setExtendForm({ ...extendForm, addMonths: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "S\u1ED1 Ti\u1EC1n Th\xEAm (\u0111)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: extendForm.additionalPrice,
      onChange: (e) => setExtendForm({ ...extendForm, additionalPrice: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowExtend(null),
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
    submitting ? "\u0110ang x\u1EED l\xFD..." : "X\xE1c nh\u1EADn gia h\u1EA1n"
  ))))), showDetail && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center", onClick: () => setShowDetail(null) }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-slate-900" }, "Chi ti\u1EBFt g\xF3i h\u1ED9i vi\xEAn"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDetail(null), className: "p-2 hover:bg-slate-100 rounded-lg" }, /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5 text-slate-600" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 bg-indigo-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black" }, showDetail.customerName.charAt(0)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800" }, showDetail.customerName), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-indigo-500 font-mono font-semibold" }, showDetail.membershipCode || showDetail._id)), /* @__PURE__ */ React.createElement("span", { className: `ml-auto px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[showDetail.status]}` }, STATUS_LABELS[showDetail.status])), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-4 h-4 text-slate-400" }), " ", showDetail.customerPhone), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(Mail, { className: "w-4 h-4 text-slate-400" }), " ", showDetail.customerEmail || "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(Dumbbell, { className: "w-4 h-4 text-slate-400" }), " ", showDetail.packageName), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(CalendarDays, { className: "w-4 h-4 text-slate-400" }), " ", showDetail.durationMonths, " th\xE1ng"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(Wallet, { className: "w-4 h-4 text-slate-400" }), " ", formatVnd(showDetail.totalPrice), "\u0111"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-600" }, /* @__PURE__ */ React.createElement(Banknote, { className: "w-4 h-4 text-slate-400" }), " ", PAYMENT_METHOD_LABELS[showDetail.paymentMethod] || showDetail.paymentMethod)), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 rounded-xl p-4 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-500" }, "B\u1EAFt \u0111\u1EA7u"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-700" }, formatDate(showDetail.startDate))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-500" }, "H\u1EBFt h\u1EA1n"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-700" }, formatDate(showDetail.endDate))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-500" }, "C\xF2n l\u1EA1i"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, showDetail.remainingDays, " ng\xE0y")), /* @__PURE__ */ React.createElement("div", { className: "w-full h-2 bg-slate-100 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full rounded-full ${showDetail.status === "EXPIRED" || showDetail.status === "CANCELLED" ? "bg-red-400" : showDetail.status === "EXPIRING_SOON" ? "bg-amber-400" : "bg-emerald-500"}`,
      style: { width: `${showDetail.progressPercent}%` }
    }
  ))), showDetail.ptSessionsPerMonth > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center bg-emerald-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-600 font-semibold uppercase" }, "Bu\u1ED5i PT"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-emerald-700" }, showDetail.sessionsLeft, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold" }, "/ ", showDetail.ptSessionsPerMonth * showDetail.durationMonths, " c\xF2n l\u1EA1i"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-600 font-semibold uppercase" }, "\u0110\xE3 d\xF9ng"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-emerald-700" }, showDetail.usedSessions))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center bg-amber-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-600 font-semibold uppercase" }, "Thanh to\xE1n"), /* @__PURE__ */ React.createElement("span", { className: `inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STYLES[showDetail.paymentStatus]}` }, PAYMENT_LABELS[showDetail.paymentStatus])), showDetail.paidAt && /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-600 font-semibold uppercase" }, "\u0110\xE3 thanh to\xE1n l\xFAc"), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-slate-700" }, formatDate(showDetail.paidAt)))), showDetail.note && /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement(MessageSquareQuote, { className: "w-4 h-4 text-slate-400 shrink-0 mt-0.5" }), showDetail.note)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100" }, showDetail.status !== "CANCELLED" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const m = showDetail;
        setShowDetail(null);
        openExtendModal(m);
      },
      className: "px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-200 transition-all"
    },
    "Gia h\u1EA1n"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowDetail(null),
      className: "px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
    },
    "\u0110\xF3ng"
  )))));
}
