import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  ArrowLeft,
  Search,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  CalendarDays,
  Clock,
  Filter,
  ScanLine,
  PencilLine
} from "lucide-react";
const STATUS_FILTERS = [
  { key: "ALL", label: "T\u1EA5t c\u1EA3" },
  { key: "SUCCESS", label: "Th\xE0nh c\xF4ng" },
  { key: "MANUAL", label: "Th\u1EE7 c\xF4ng" },
  { key: "FAILED", label: "Kh\xF4ng h\u1EE3p l\u1EC7" }
];
const STATUS_STYLES = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  MANUAL: "bg-indigo-100 text-indigo-700",
  FAILED: "bg-red-100 text-red-700"
};
const STATUS_LABELS = {
  SUCCESS: "Th\xE0nh c\xF4ng",
  MANUAL: "Th\u1EE7 c\xF4ng",
  FAILED: "Kh\xF4ng h\u1EE3p l\u1EC7"
};
const METHOD_LABELS = {
  QR: "Qu\xE9t QR",
  MANUAL: "Nh\u1EADp tay"
};
const formatDate = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "\u2014";
const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${value.slice(0, 10)}T${hh}:${mm}`;
};
export function AttendanceHistoryV2() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const [editForm, setEditForm] = useState({ checkInTime: "", note: "", status: "SUCCESS" });
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/attendance?limit=200`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "L\u1ED7i t\u1EA3i l\u1ECBch s\u1EED \u0111i\u1EC3m danh");
      setRecords(data.data || []);
    } catch (err) {
      setError(err.message || "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi m\xE1y ch\u1EE7");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);
  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || record.customerPhone?.includes(searchTerm) || record.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
    const matchesDate = !dateFilter || record.dateLabel === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });
  const successCount = filteredRecords.filter((r) => r.status === "SUCCESS" || r.status === "MANUAL").length;
  const failedCount = filteredRecords.filter((r) => r.status === "FAILED").length;
  const qrCount = filteredRecords.filter((r) => r.method === "QR").length;
  const manualCount = filteredRecords.filter((r) => r.method === "MANUAL").length;
  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 4e3);
  };
  const openEditModal = (record) => {
    setEditForm({
      checkInTime: toDateTimeLocal(record.checkInTime),
      note: record.note || "",
      status: record.status
    });
    setModalError("");
    setShowEdit(record);
  };
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!showEdit) return;
    setModalError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/attendance/${showEdit._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checkInTime: editForm.checkInTime,
          note: editForm.note,
          status: editForm.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "C\u1EADp nh\u1EADt th\u1EA5t b\u1EA1i");
      showBanner("C\u1EADp nh\u1EADt b\u1EA3n ghi \u0111i\u1EC3m danh th\xE0nh c\xF4ng");
      setShowEdit(null);
      fetchHistory();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("X\xF3a b\u1EA3n ghi \u0111i\u1EC3m danh n\xE0y?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/attendance/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "X\xF3a th\u1EA5t b\u1EA1i");
      showBanner("X\xF3a b\u1EA3n ghi \u0111i\u1EC3m danh th\xE0nh c\xF4ng");
      fetchHistory();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeleting(null);
    }
  };
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/admin/v2/attendance"),
      className: "flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4" }),
    " Quay l\u1EA1i \u0111i\u1EC3m danh"
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "L\u1ECBch s\u1EED \u0111i\u1EC3m danh V2"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "Tra c\u1EE9u v\xE0 qu\u1EA3n l\xFD to\xE0n b\u1ED9 b\u1EA3n ghi \u0111i\u1EC3m danh c\u1EE7a h\u1ED9i vi\xEAn")), banner && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, banner)), error && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-5 h-5 text-red-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, error)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "T\u1ED5ng b\u1EA3n ghi"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-slate-900" }, filteredRecords.length)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "H\u1EE3p l\u1EC7"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-emerald-600" }, successCount)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Kh\xF4ng h\u1EE3p l\u1EC7"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-red-500" }, failedCount)), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Qu\xE9t QR / Nh\u1EADp tay"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-indigo-600" }, qrCount, /* @__PURE__ */ React.createElement("span", { className: "text-base text-slate-400" }, " / ", manualCount)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full md:w-80" }, /* @__PURE__ */ React.createElement(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "T\xECm h\u1ED9i vi\xEAn, S\u0110T ho\u1EB7c g\xF3i...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap w-full md:w-auto items-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(CalendarDays, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: dateFilter,
      onChange: (e) => setDateFilter(e.target.value),
      className: "pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ), dateFilter && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setDateFilter(""),
      className: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
    },
    /* @__PURE__ */ React.createElement(X, { className: "w-3.5 h-3.5" })
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" }, /* @__PURE__ */ React.createElement(Filter, { className: "w-4 h-4 text-slate-400" }), STATUS_FILTERS.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.key,
      onClick: () => setStatusFilter(item.key),
      className: `px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${statusFilter === item.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`
    },
    item.label
  ))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-sm text-slate-600" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "STT"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "H\u1ED9i Vi\xEAn"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "G\xF3i T\u1EADp"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Ng\xE0y"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Th\u1EDDi Gian"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "H\xECnh Th\u1EE9c"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Tr\u1EA1ng Th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Ghi Ch\xFA"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Thao T\xE1c"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-100" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 9, className: "p-10 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin" }), " \u0110ang t\u1EA3i l\u1ECBch s\u1EED..."))) : filteredRecords.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 9, className: "p-10 text-center text-slate-400" }, "Kh\xF4ng t\xECm th\u1EA5y b\u1EA3n ghi \u0111i\u1EC3m danh n\xE0o")) : filteredRecords.map((record, index) => /* @__PURE__ */ React.createElement("tr", { key: record._id, className: "hover:bg-slate-50/50" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 text-slate-500" }, index + 1), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-800" }, record.customerName), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-400" }, record.customerPhone)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-xs" }, record.packageName || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-xs text-slate-500" }, formatDate(record.checkInTime)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 font-bold text-slate-800" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-3.5 h-3.5 text-slate-400" }), " ", record.timeLabel)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-xs font-semibold text-slate-500" }, /* @__PURE__ */ React.createElement(ScanLine, { className: "w-3.5 h-3.5 text-slate-400" }), " ", METHOD_LABELS[record.method] || record.method)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-500"}` }, STATUS_LABELS[record.status] || record.status)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-xs text-slate-500 max-w-[160px] truncate" }, record.note || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openEditModal(record),
      className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg",
      title: "S\u1EEDa"
    },
    /* @__PURE__ */ React.createElement(PencilLine, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleDelete(record._id),
      disabled: deleting === record._id,
      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50",
      title: "X\xF3a"
    },
    deleting === record._id ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Trash2, { className: "w-4 h-4" })
  )))))))))), showEdit && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center", onClick: () => setShowEdit(null) }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 max-w-md w-full mx-4", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-slate-900" }, "S\u1EEDa b\u1EA3n ghi \u0111i\u1EC3m danh"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowEdit(null), className: "p-2 hover:bg-slate-100 rounded-lg" }, /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5 text-slate-600" }))), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 mb-4" }, "H\u1ED9i vi\xEAn ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800" }, showEdit.customerName), " \xB7 ", showEdit.customerPhone), modalError && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-4 h-4 text-red-600" }), " ", modalError), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmitEdit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Th\u1EDDi Gian \u0110i\u1EC3m Danh"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "datetime-local",
      value: editForm.checkInTime,
      onChange: (e) => setEditForm({ ...editForm, checkInTime: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Tr\u1EA1ng Th\xE1i"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: editForm.status,
      onChange: (e) => setEditForm({ ...editForm, status: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    },
    /* @__PURE__ */ React.createElement("option", { value: "SUCCESS" }, "Th\xE0nh c\xF4ng"),
    /* @__PURE__ */ React.createElement("option", { value: "MANUAL" }, "Th\u1EE7 c\xF4ng"),
    /* @__PURE__ */ React.createElement("option", { value: "FAILED" }, "Kh\xF4ng h\u1EE3p l\u1EC7")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-700 uppercase mb-2" }, "Ghi Ch\xFA"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: editForm.note,
      onChange: (e) => setEditForm({ ...editForm, note: e.target.value }),
      className: "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowEdit(null),
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
    submitting ? "\u0110ang l\u01B0u..." : "L\u01B0u thay \u0111\u1ED5i"
  ))))));
}
