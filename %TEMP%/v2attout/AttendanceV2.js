import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminLayout } from "../../components/AdminLayout";
import { getApiUrl, getAuthHeaders } from "../../context/AuthContext";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  CalendarCheck2,
  Users,
  UserX,
  UserCheck,
  ScanLine,
  Clock,
  History,
  Phone,
  X,
  Check
} from "lucide-react";
export function AttendanceV2() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, activeMembersCount: 0, notCheckedIn: 0, rate: 0 });
  const [trend, setTrend] = useState([]);
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [checking, setChecking] = useState(false);
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [recordsRes, membersRes, summaryRes, trendRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/v2/attendance/today`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/v2/attendance/members-status`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/v2/attendance/summary`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/v2/attendance/trend?days=7`, { headers: getAuthHeaders() })
      ]);
      const [recordsData, membersData, summaryData, trendData] = await Promise.all([
        recordsRes.json(),
        membersRes.json(),
        summaryRes.json(),
        trendRes.json()
      ]);
      if (!recordsRes.ok) throw new Error(recordsData.message || "L\u1ED7i t\u1EA3i d\u1EEF li\u1EC7u \u0111i\u1EC3m danh");
      setRecords(recordsData.data || []);
      setMembers(membersData.data || []);
      if (summaryData?.data) setSummary(summaryData.data);
      if (trendData?.data) setTrend(trendData.data);
    } catch (err) {
      setError(err.message || "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi m\xE1y ch\u1EE7");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);
  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 4e3);
  };
  const handleCheckIn = async () => {
    if (!phone.trim()) {
      window.alert("Vui l\xF2ng nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i h\u1ED9i vi\xEAn");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/attendance/check-in`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ customerPhone: phone.trim(), method: "MANUAL" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "\u0110i\u1EC3m danh th\u1EA5t b\u1EA1i");
      showBanner(data.message || "\u0110i\u1EC3m danh th\xE0nh c\xF4ng");
      setPhone("");
      fetchAll();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setChecking(false);
    }
  };
  const handleUndoCheckIn = async (record) => {
    if (!window.confirm(`H\u1EE7y b\u1EA3n ghi \u0111i\u1EC3m danh c\u1EE7a "${record.customerName}" l\xFAc ${record.timeLabel}?`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/v2/attendance/${record._id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "H\u1EE7y th\u1EA5t b\u1EA1i");
      showBanner("\u0110\xE3 x\xF3a b\u1EA3n ghi \u0111i\u1EC3m danh");
      fetchAll();
    } catch (err) {
      window.alert(err.message);
    }
  };
  const filteredMembers = members.filter(
    (m) => m.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.customerPhone?.includes(searchTerm) || m.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const maxTrendCount = Math.max(...trend.map((item) => item.count), 1);
  return /* @__PURE__ */ React.createElement(AdminLayout, null, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "\u0110i\u1EC3m danh h\u1ED9i vi\xEAn V2"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "\u0110i\u1EC3m danh h\xF4m nay, theo d\xF5i h\u1ED9i vi\xEAn \u0111\xE3 \u0111\u1EBFn ph\xF2ng t\u1EADp")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/admin/v2/attendance/history"),
      className: "flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
    },
    /* @__PURE__ */ React.createElement(History, { className: "w-4 h-4" }),
    " L\u1ECBch s\u1EED \u0111i\u1EC3m danh"
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "\u0110i\u1EC3m danh h\xF4m nay"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-emerald-600" }, summary.total), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "l\u01B0\u1EE3t \u0111i\u1EC3m danh")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "H\u1ED9i vi\xEAn ho\u1EA1t \u0111\u1ED9ng"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-slate-900" }, summary.activeMembersCount), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "c\xF3 g\xF3i c\xF2n hi\u1EC7u l\u1EF1c")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Ch\u01B0a \u0111i\u1EC3m danh"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-amber-500" }, summary.notCheckedIn), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "h\u1ED9i vi\xEAn ch\u01B0a \u0111\u1EBFn")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "T\u1EF7 l\u1EC7 \u0111i\u1EC3m danh"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-indigo-600" }, summary.rate, "%"), /* @__PURE__ */ React.createElement("div", { className: "mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-indigo-500 rounded-full", style: { width: `${summary.rate}%` } })))), banner && /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, banner)), error && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-5 h-5 text-red-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold" }, error)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(ScanLine, { className: "w-4 h-4 text-indigo-500" }), " \u0110i\u1EC3m danh th\u1EE7 c\xF4ng"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      placeholder: "Nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i h\u1ED9i vi\xEAn...",
      value: phone,
      onChange: (e) => setPhone(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") handleCheckIn();
      },
      className: "w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCheckIn,
      disabled: checking,
      className: "flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
    },
    checking ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(UserCheck, { className: "w-4 h-4" }),
    checking ? "\u0110ang x\u1EED l\xFD..." : "\u0110i\u1EC3m danh"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-3" }, "H\u1EC7 th\u1ED1ng t\u1EF1 ki\u1EC3m tra g\xF3i t\u1EADp c\xF2n hi\u1EC7u l\u1EF1c & ch\u1EB7n \u0111i\u1EC3m danh tr\xF9ng trong ng\xE0y.")), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-4 h-4 text-emerald-500" }), " \u0110i\u1EC3m danh h\xF4m nay"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-slate-400" }, records.length, " b\u1EA3n ghi")), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-sm text-slate-600" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Th\u1EDDi Gian"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "H\u1ED9i Vi\xEAn"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "G\xF3i T\u1EADp"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "H\xECnh Th\u1EE9c"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Thao T\xE1c"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-100" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, className: "p-8 text-center text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin inline mr-2" }), " \u0110ang t\u1EA3i...")) : records.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, className: "p-8 text-center text-slate-400" }, "Ch\u01B0a c\xF3 h\u1ED9i vi\xEAn n\xE0o \u0111i\u1EC3m danh h\xF4m nay")) : records.map((record) => /* @__PURE__ */ React.createElement("tr", { key: record._id, className: "hover:bg-slate-50/50" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800" }, record.timeLabel), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-800" }, record.customerName), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-400" }, record.customerPhone)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-xs" }, record.packageName || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-xs font-bold ${record.method === "QR" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}` }, record.method === "QR" ? "Qu\xE9t QR" : "Nh\u1EADp tay")), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleUndoCheckIn(record),
      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg",
      title: "X\xF3a b\u1EA3n ghi"
    },
    /* @__PURE__ */ React.createElement(X, { className: "w-4 h-4" })
  )))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(CalendarCheck2, { className: "w-4 h-4 text-indigo-500" }), " \u0110i\u1EC3m danh 7 ng\xE0y g\u1EA7n nh\u1EA5t"), /* @__PURE__ */ React.createElement("div", { className: "flex items-end gap-3 h-32" }, trend.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.date, className: "flex-1 flex flex-col items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-700" }, item.count), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "w-full bg-indigo-500 rounded-t-lg min-h-[4px]",
      style: { height: `${Math.max(6, item.count / maxTrendCount * 100)}%` },
      title: `${item.label}: ${item.count} l\u01B0\u1EE3t`
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-semibold" }, item.label)))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-slate-100" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-slate-700 uppercase flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Users, { className: "w-4 h-4 text-indigo-500" }), " H\u1ED9i vi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng"), /* @__PURE__ */ React.createElement("div", { className: "relative mt-3" }, /* @__PURE__ */ React.createElement(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "T\xECm h\u1ED9i vi\xEAn...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "max-h-[540px] overflow-y-auto divide-y divide-slate-100" }, loading ? /* @__PURE__ */ React.createElement("div", { className: "p-8 text-center text-slate-400" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin inline" })) : filteredMembers.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-8 text-center text-slate-400" }, "Kh\xF4ng c\xF3 h\u1ED9i vi\xEAn n\xE0o") : filteredMembers.map((member) => /* @__PURE__ */ React.createElement("div", { key: member.membershipId, className: "p-4 flex items-center gap-3 hover:bg-slate-50/50" }, /* @__PURE__ */ React.createElement("div", { className: `w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${member.checkedIn ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}` }, member.checkedIn ? /* @__PURE__ */ React.createElement(Check, { className: "w-4 h-4" }) : /* @__PURE__ */ React.createElement(UserX, { className: "w-4 h-4" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 text-sm truncate" }, member.customerName), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 truncate" }, member.packageName, " \xB7 c\xF2n ", member.remainingDays, " ng\xE0y")), member.checkedIn ? /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shrink-0" }, member.checkInTime) : /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 shrink-0" }, "Ch\u01B0a \u0111\u1EBFn"))))))));
}
