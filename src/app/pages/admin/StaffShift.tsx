import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect, useMemo } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { useClub } from '../../context/ClubContext';
import { toast } from 'sonner';
import { Calendar, Sun, Moon, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Staff {
  _id: string;
  fullName: string;
  account: string;
  job: { _id: string; name: string; permissions?: string[] };
  status: string;
}

interface ShiftAssignment {
  _id: string;
  staffId: { _id: string; fullName: string; account: string; job: { _id: string; name: string } };
  shift: 'morning-noon' | 'afternoon-evening';
  date: string;
}

interface DateAssignments {
  [date: string]: ShiftAssignment[];
}

type ViewMode = 'day' | 'week' | 'month' | 'range';

const SHIFT_TIMES = {
  'morning-noon': '06:00 - 13:30',
  'afternoon-evening': '13:30 - 21:00'
} as const;

export function StaffShift() {
  const { selectedClub } = useClub();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [allAssignments, setAllAssignments] = useState<DateAssignments>({});
  const [loading, setLoading] = useState(true);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [pendingAdditions, setPendingAdditions] = useState<Map<string, { staffId: string; shift: string; date: string }>>(new Map());
  const [savingAll, setSavingAll] = useState(false);
  const hasChanges = pendingRemovals.size > 0 || pendingAdditions.size > 0;

  const dateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDateRange = useMemo(() => {
    switch (viewMode) {
      case 'day': {
        const d = dateStr(currentDate);
        return { start: d, end: d, label: d };
      }
      case 'week': {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {
          start: dateStr(start),
          end: dateStr(end),
          label: `${dateStr(start)} ~ ${dateStr(end)}`
        };
      }
      case 'month': {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return {
          start: dateStr(start),
          end: dateStr(end),
          label: `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
        };
      }
      case 'range': {
        return { start: startDate, end: endDate, label: startDate && endDate ? `${startDate} ~ ${endDate}` : 'Chọn khoảng ngày' };
      }
    }
  }, [viewMode, currentDate, startDate, endDate]);

  const { start: rangeStart, end: rangeEnd } = getDateRange;

  const getAllDates = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    const dates: string[] = [];
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    while (start <= end) {
      dates.push(dateStr(start));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  }, [rangeStart, rangeEnd]);

  const todayStr = dateStr(new Date());

  const getWeekMonday = (ds: string) => {
    const d = new Date(ds + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return dateStr(d);
  };

  const weekGroups = useMemo(() => {
    const map: Record<string, string[]> = {};
    getAllDates.forEach(d => {
      const mon = getWeekMonday(d);
      if (!map[mon]) {
        map[mon] = [];
        const start = new Date(mon + 'T00:00:00');
        for (let i = 0; i < 7; i++) {
          const dd = new Date(start);
          dd.setDate(dd.getDate() + i);
          map[mon].push(dateStr(dd));
        }
      }
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [getAllDates]);

  const mergedAssignments = useMemo(() => {
    const merged: DateAssignments = {};
    for (const [date, assigns] of Object.entries(allAssignments)) {
      const filtered = assigns.filter(a => !pendingRemovals.has(a._id));
      if (filtered.length > 0) merged[date] = filtered;
    }
    pendingAdditions.forEach((entry, tempId) => {
      const d = entry.date.split('T')[0];
      if (!merged[d]) merged[d] = [];
      merged[d].push({
        _id: tempId,
        staffId: { _id: entry.staffId, fullName: '', account: '', job: { _id: '', name: '' } },
        shift: entry.shift,
        date: entry.date,
      });
    });
    return merged;
  }, [allAssignments, pendingRemovals, pendingAdditions]);

  const fetchData = async () => {
    if (!rangeStart || !rangeEnd) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = selectedClub !== 'all' ? `?locationId=${selectedClub}&limit=100` : '?limit=100';
      const shiftParams = selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';
      const [staffRes, shiftRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/staff${params}`, { headers: getAuthHeaders() }),
        fetch(`${getApiUrl()}/api/staff-shifts/by-range?startDate=${rangeStart}&endDate=${rangeEnd}${shiftParams}`, { headers: getAuthHeaders() })
      ]);
      const staffData = await staffRes.json();
      const shiftData = await shiftRes.json();
      setStaffList((staffData.data || []).filter((s: Staff) => s.status === 'active'));
      const grouped: DateAssignments = {};
      (shiftData.data || []).forEach((a: ShiftAssignment) => {
        const d = a.date ? a.date.split('T')[0] : '';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(a);
      });
      setAllAssignments(grouped);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode !== 'range' || (startDate && endDate)) fetchData();
  }, [rangeStart, rangeEnd, selectedClub]);

  const getStaffShifts = (staffId: string, date: string) => {
    return (mergedAssignments[date] || []).filter(a => a.staffId?._id === staffId);
  };

  const localAssign = (staffId: string, shift: 'morning-noon' | 'afternoon-evening', dates: string[]) => {
    const newAdditions = new Map(pendingAdditions);
    const newRemovals = new Set(pendingRemovals);
    dates.forEach(d => {
      const saved = (allAssignments[d] || []).find(a => a.staffId?._id === staffId && a.shift === shift);
      if (saved) {
        if (newRemovals.has(saved._id)) newRemovals.delete(saved._id);
      } else {
        let hasPending = false;
        for (const [, entry] of newAdditions) {
          if (entry.staffId === staffId && entry.shift === shift && entry.date === d) { hasPending = true; break; }
        }
        if (!hasPending) {
          newAdditions.set(`temp-${staffId}-${shift}-${d}`, { staffId, shift, date: d });
        }
      }
    });
    setPendingAdditions(newAdditions);
    setPendingRemovals(newRemovals);
  };

  const localRemove = (id: string) => {
    const newAdditions = new Map(pendingAdditions);
    if (id.startsWith('temp-')) {
      newAdditions.delete(id);
      setPendingAdditions(newAdditions);
    } else {
      const newRemovals = new Set(pendingRemovals);
      newRemovals.add(id);
      setPendingRemovals(newRemovals);
      setPendingAdditions(newAdditions);
    }
  };

  const handleSave = async () => {
    setSavingAll(true);
    try {
      const deletePromises = Array.from(pendingRemovals).map(id =>
        fetch(`${getApiUrl()}/api/staff-shifts/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      );
      const addEntries: Array<{ staffId: string; date: string; shift: string; locationId?: string }> = [];
      pendingAdditions.forEach(entry => {
        addEntries.push({ staffId: entry.staffId, date: entry.date, shift: entry.shift, locationId: selectedClub !== 'all' ? selectedClub : undefined });
      });
      const promises = [...deletePromises];
      if (addEntries.length > 0) {
        promises.push(
          fetch(`${getApiUrl()}/api/staff-shifts/bulk`, {
            method: 'POST', headers: getAuthHeaders(),
            body: JSON.stringify({ entries: addEntries })
          })
        );
      }
      await Promise.all(promises);
      setPendingRemovals(new Set());
      setPendingAdditions(new Map());
      toast.success('Đã lưu thay đổi!');
      fetchData();
    } catch {
      toast.error('Lưu thay đổi thất bại');
    } finally {
      setSavingAll(false);
    }
  };

  const handleCancel = () => {
    setPendingRemovals(new Set());
    setPendingAdditions(new Map());
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const groupedByJob = staffList.reduce<Record<string, Staff[]>>((acc, s) => {
    const jobName = s.job?.name || 'Chưa xác định';
    if (!acc[jobName]) acc[jobName] = [];
    acc[jobName].push(s);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedByJob).sort(([a], [b]) => a.localeCompare(b));

  const canGo = viewMode !== 'range' || (startDate && endDate);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Phân công ca làm việc</h1>
            <p className="text-slate-600 flex items-center gap-4 flex-wrap">
              <span><Sun className="w-4 h-4 inline mr-1 text-amber-600" /> Sáng-Trưa: <strong>{SHIFT_TIMES['morning-noon']}</strong></span>
              <span><Moon className="w-4 h-4 inline mr-1 text-blue-600" /> Chiều-Tối: <strong>{SHIFT_TIMES['afternoon-evening']}</strong></span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-slate-100 rounded-xl p-1">
              {(['day', 'week', 'month', 'range'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  {mode === 'day' ? 'Theo ngày' : mode === 'week' ? 'Theo tuần' : mode === 'month' ? 'Theo tháng' : 'Khoảng ngày'}
                </button>
              ))}
            </div>

            {viewMode !== 'range' ? (
              <div className="flex items-center gap-2 ml-2">
                <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                <span className="font-semibold text-slate-900 min-w-[200px] text-center">{getDateRange.label}</span>
                <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                {viewMode === 'day' && (
                  <button onClick={() => setCurrentDate(new Date())}
                    className="ml-2 px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">Hôm nay</button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Từ</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Đến</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button onClick={() => fetchData()} disabled={!startDate || !endDate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50">Xem</button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : !canGo ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Vui lòng chọn khoảng ngày</p>
          </div>
        ) : (
          <div className="space-y-6">
            {getAllDates.length > 1 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800">
                <Calendar className="w-4 h-4 inline mr-1" />
                Đang xem <strong>{getAllDates.length} ngày</strong>: {getDateRange.label}
              </div>
            )}
            {sortedGroups.map(([jobName, staffs]) => (
              <div key={jobName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                  <h2 className="text-lg font-bold text-indigo-900">{jobName}</h2>
                  <p className="text-sm text-indigo-600">{staffs.length} nhân viên</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Nhân viên</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Tài khoản</th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-slate-900">
                          <Sun className="w-4 h-4 inline mr-1 text-amber-600" /> Sáng-Trưa<br />
                          <span className="font-normal text-xs text-slate-500">{SHIFT_TIMES['morning-noon']}</span>
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-slate-900">
                          <Moon className="w-4 h-4 inline mr-1 text-blue-600" /> Chiều-Tối<br />
                          <span className="font-normal text-xs text-slate-500">{SHIFT_TIMES['afternoon-evening']}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffs.map(staff => {
                        const morningAssignments: ShiftAssignment[] = getAllDates.map(d => getStaffShifts(staff._id, d).find(s => s.shift === 'morning-noon')).filter((a): a is ShiftAssignment => !!a);
                        const afternoonAssignments: ShiftAssignment[] = getAllDates.map(d => getStaffShifts(staff._id, d).find(s => s.shift === 'afternoon-evening')).filter((a): a is ShiftAssignment => !!a);
                        const morningRemain = getAllDates.filter(d => d >= todayStr && !morningAssignments.find(a => a.date?.split('T')[0] === d));
                        const afternoonRemain = getAllDates.filter(d => d >= todayStr && !afternoonAssignments.find(a => a.date?.split('T')[0] === d));
                        const isPast = (d: string) => d < todayStr;

                        const formatDate = (ds: string) => {
                          const d = new Date(ds + 'T00:00:00');
                          const day = String(d.getDate()).padStart(2, '0');
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          return `${day}/${m}`;
                        };

                        const isRemoving = (id: string) => pendingRemovals.has(id);

                        return (
                          <tr key={staff._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-900">{staff.fullName}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{staff.account}</td>
                            <td className="px-6 py-4 text-center align-top">
                              <div className="flex flex-col items-center gap-1.5 min-w-[280px]">
                                {morningAssignments.length > 0 && (
                                  <div className="space-y-1 w-full">
                                    {weekGroups.map(([monday, weekDays]) => {
                                      const hasAny = weekDays.some(d => morningAssignments.find(a => (a.date?.split('T')[0] || a.date) === d));
                                      if (!hasAny) return null;
                                      return (
                                        <div key={monday} className="flex items-center gap-0.5">
                                          {weekDays.map(d => {
                                            const a = morningAssignments.find(x => (x.date?.split('T')[0] || x.date) === d);
                                            if (isPast(d)) {
                                              return a ? (
                                                <span key={a._id} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border leading-tight bg-slate-100 text-slate-400 border-slate-200">
                                                  {formatDate(d)}
                                                </span>
                                              ) : (
                                                <span key={d} className="inline-block w-9 h-5" />
                                              );
                                            }
                                            return a ? (
                                              <div key={a._id} className="group relative">
                                                <span className={'inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border leading-tight ' + (isRemoving(a._id) ? 'bg-red-100 text-red-500 border-red-200 line-through' : 'bg-amber-100 text-amber-800 border-amber-200')}>
                                                  {formatDate(d)}
                                                </span>
                                                <button onClick={() => localRemove(a._id)}
                                                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                  title="Xóa ngày này">
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span key={d} className="inline-block w-9 h-5 rounded border border-dashed border-slate-200" />
                                            );
                                          })}
                                          <button onClick={() => {
                                            if (confirm('Xoá tất cả ca Sáng-Trưa trong tuần này?')) {
                                              weekDays.forEach(d => {
                                                const a = morningAssignments.find(x => (x.date?.split('T')[0] || x.date) === d);
                                                if (a) localRemove(a._id);
                                              });
                                            }
                                          }}
                                            className="ml-0.5 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Xoá cả tuần">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  {morningRemain.length > 0 && (
                                    <button onClick={() => localAssign(staff._id, 'morning-noon', morningRemain)}
                                      className="px-3 py-1 border border-dashed border-amber-300 text-amber-600 rounded hover:bg-amber-50 text-xs font-semibold flex items-center gap-1">
                                      <Sun className="w-3 h-3" /> +{morningRemain.length}
                                    </button>
                                  )}
                                  {morningAssignments.length === 0 && (
                                    <button onClick={() => localAssign(staff._id, 'morning-noon', getAllDates.filter(d => d >= todayStr))}
                                      className="px-4 py-2 border-2 border-dashed border-slate-300 text-slate-400 rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all text-sm font-semibold">
                                      + Phân ca
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center align-top">
                              <div className="flex flex-col items-center gap-1.5 min-w-[280px]">
                                {afternoonAssignments.length > 0 && (
                                  <div className="space-y-1 w-full">
                                    {weekGroups.map(([monday, weekDays]) => {
                                      const hasAny = weekDays.some(d => afternoonAssignments.find(a => (a.date?.split('T')[0] || a.date) === d));
                                      if (!hasAny) return null;
                                      return (
                                        <div key={monday} className="flex items-center gap-0.5">
                                          {weekDays.map(d => {
                                            const a = afternoonAssignments.find(x => (x.date?.split('T')[0] || x.date) === d);
                                            if (isPast(d)) {
                                              return a ? (
                                                <span key={a._id} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border leading-tight bg-slate-100 text-slate-400 border-slate-200">
                                                  {formatDate(d)}
                                                </span>
                                              ) : (
                                                <span key={d} className="inline-block w-9 h-5" />
                                              );
                                            }
                                            return a ? (
                                              <div key={a._id} className="group relative">
                                                <span className={'inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border leading-tight ' + (isRemoving(a._id) ? 'bg-red-100 text-red-500 border-red-200 line-through' : 'bg-blue-100 text-blue-800 border-blue-200')}>
                                                  {formatDate(d)}
                                                </span>
                                                <button onClick={() => localRemove(a._id)}
                                                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                  title="Xóa ngày này">
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span key={d} className="inline-block w-9 h-5 rounded border border-dashed border-slate-200" />
                                            );
                                          })}
                                          <button onClick={() => {
                                            if (confirm('Xoá tất cả ca Chiều-Tối trong tuần này?')) {
                                              weekDays.forEach(d => {
                                                const a = afternoonAssignments.find(x => (x.date?.split('T')[0] || x.date) === d);
                                                if (a) localRemove(a._id);
                                              });
                                            }
                                          }}
                                            className="ml-0.5 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Xoá cả tuần">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  {afternoonRemain.length > 0 && (
                                    <button onClick={() => localAssign(staff._id, 'afternoon-evening', afternoonRemain)}
                                      className="px-3 py-1 border border-dashed border-blue-300 text-blue-600 rounded hover:bg-blue-50 text-xs font-semibold flex items-center gap-1">
                                      <Moon className="w-3 h-3" /> +{afternoonRemain.length}
                                    </button>
                                  )}
                                  {afternoonAssignments.length === 0 && (
                                    <button onClick={() => localAssign(staff._id, 'afternoon-evening', getAllDates.filter(d => d >= todayStr))}
                                      className="px-4 py-2 border-2 border-dashed border-slate-300 text-slate-400 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold">
                                      + Phân ca
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {sortedGroups.length === 0 && (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Không có nhân viên nào đang hoạt động</p>
              </div>
            )}
          </div>
        )}
        {hasChanges && (
          <div className="sticky bottom-4 z-50 flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg px-6 py-4 flex items-center gap-4">
              <span className="text-sm text-slate-600">
                <strong>{pendingRemovals.size + pendingAdditions.size}</strong> thay đổi chưa lưu
              </span>
              <button onClick={handleCancel} disabled={savingAll}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={savingAll}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
