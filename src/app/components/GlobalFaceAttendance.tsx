import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router';
import { Check, X, Lock, Unlock, AlertTriangle, Loader2, KeyRound, Calendar, UserCheck } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';

interface PackageInfo {
  packageName: string;
  endDate: string;
  remainingDays?: number;
}
interface ScannedCustomer {
  memberCode: string;
  fullName: string;
  phone: string;
  packages: PackageInfo[];
  token: string;
}
interface LockerApiItem {
  _id: string;
  lockerNumber: string;
  prefix: string;
  locationId?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  assignedType?: 'MEMBER' | 'STAFF' | null;
  assignedName?: string;
  assignedPhone?: string;
}

export function GlobalFaceAttendance() {
  const location = useLocation();
  const { selectedClub } = useClub();
  const [scannedCustomer, setScannedCustomer] = useState<ScannedCustomer | null>(null);
  const [lockerModal, setLockerModal] = useState(false);
  const [wantLocker, setWantLocker] = useState<boolean | null>(null);
  const [lockers, setLockers] = useState<LockerApiItem[]>([]);
  const [lockerLoading, setLockerLoading] = useState(false);
  const [lockerError, setLockerError] = useState('');
  const [lockerFilter, setLockerFilter] = useState('ALL');
  const [submittingLocker, setSubmittingLocker] = useState(false);
  const [assignedLockerName, setAssignedLockerName] = useState('');
  const [successAnimation, setSuccessAnimation] = useState<{
    active: boolean;
    memberCode: string;
    name: string;
    phone: string;
    packages?: PackageInfo[];
    lockerName?: string;
    isCheckout?: boolean;
    totalMinutes?: number;
    checkCount?: number;
    frozenNotice?: string | null;
  } | null>(null);

  const backendUrl = getApiUrl() || 'http://localhost:5000';
  const isOnScannerPage = location.pathname.includes('/admin/attendance');

  const playChime = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') ctx.resume();
      const bell = (freq: number, delay: number) => {
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 1);
      };
      bell(880, 0);
      bell(659.25, 0.28);
      setTimeout(() => ctx.close(), 2200);
    } catch {}
  };
  const speak = (text: string) => {
    playChime();
    const url = `${backendUrl}/api/tts?text=${encodeURIComponent(text)}`;
    try {
      const audio = new Audio(url);
      audio.onerror = () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'vi-VN';
          window.speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => {});
    } catch {}
  };

  // Lắng nghe broadcast từ popup - hiển thị toàn cục, trừ khi đang ở trang scanner (để tránh double)
  useEffect(() => {
    const channel = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
    channel.onmessage = (event) => {
      if (event.data?.type !== 'FACE_CHECKIN_TRIGGER') return;
      // Nếu đang ở trang scanner thì để AttendanceScanner tự xử lý, tránh double modal
      if (isOnScannerPage) return;
      const { status, customer, totalMinutes, checkCount, frozenNotice } = event.data.payload;
      const verifiedCode = customer.id || 'HV';
      const verifiedName = customer.fullName || 'Hội viên';
      const packages = customer.packages || [];
      const count = checkCount || 1;

      if (status === 'checked-out') {
        releaseMemberLockers(verifiedName);
        speak(`Kính chào ${verifiedName} ra về`);
        setSuccessAnimation({
          active: true,
          memberCode: verifiedCode,
          name: verifiedName,
          phone: customer.phone || 'Chưa cập nhật',
          packages,
          isCheckout: true,
          totalMinutes,
          checkCount: count,
          frozenNotice: null,
        });
        setTimeout(() => setSuccessAnimation(null), 4000);
        // thông báo cho trang scanner reload history nếu đang mở
        channel.postMessage({ type: 'CHECKIN_EVENT' });
      } else {
        speak(`Xin mời ${verifiedName} vào tập`);
        const matchedInfo: ScannedCustomer = {
          memberCode: verifiedCode,
          fullName: verifiedName,
          phone: customer.phone || 'Chưa cập nhật',
          packages,
          token: 'FACE_ID_AUTH',
        };
        (matchedInfo as any).checkCount = count;
        (matchedInfo as any).frozenNotice = frozenNotice || null;
        setScannedCustomer(matchedInfo);
        setAssignedLockerName('');
        setLockers([]);
        setLockerModal(true);
        setWantLocker(null);
      }
    };
    return () => channel.close();
  }, [isOnScannerPage, selectedClub]);

  const loadLockers = async () => {
    setLockerLoading(true);
    setLockerError('');
    try {
      const res = await fetch(`${backendUrl}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải sơ đồ tủ');
      setLockers(data.data || []);
    } catch (err: any) {
      setLockerError(err.message || 'Không thể tải sơ đồ tủ');
    } finally {
      setLockerLoading(false);
    }
  };
  const closeLockerModal = () => {
    setLockerModal(false);
    setWantLocker(null);
    setLockers([]);
    setLockerError('');
  };
  const assignLocker = async (lockerId: string, personType: 'MEMBER' | 'STAFF', name: string, phone: string) => {
    const res = await fetch(`${backendUrl}/api/v2/lockers/${lockerId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders() as HeadersInit,
      body: JSON.stringify({ personType, name, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không gán được tủ');
    return data.locker as LockerApiItem | undefined;
  };
  const releaseMemberLockers = async (name: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/v2/lockers`, { headers: getAuthHeaders() as HeadersInit });
      const data = await res.json();
      const mine = (data.data || []).filter((l: LockerApiItem) => l.assignedType === 'MEMBER' && l.assignedName === name);
      await Promise.all(
        mine.map((l: LockerApiItem) =>
          fetch(`${backendUrl}/api/v2/lockers/${l._id}/release`, { method: 'POST', headers: getAuthHeaders() as HeadersInit })
        )
      );
    } catch {}
  };
  const completeMemberCheckIn = async (lockerId: string) => {
    if (!scannedCustomer || submittingLocker) return;
    setSubmittingLocker(true);
    setLockerError('');
    try {
      let lockerAssigned = '';
      if (lockerId) {
        const assigned = await assignLocker(lockerId, 'MEMBER', scannedCustomer.fullName, scannedCustomer.phone);
        if (assigned) {
          lockerAssigned = assigned.lockerNumber;
          setAssignedLockerName(assigned.lockerNumber);
        }
      }
      const checkCount = (scannedCustomer as any).checkCount || 1;
      const frozenNotice = (scannedCustomer as any).frozenNotice || null;
      setSuccessAnimation({
        active: true,
        memberCode: scannedCustomer.memberCode,
        name: scannedCustomer.fullName,
        phone: scannedCustomer.phone,
        packages: scannedCustomer.packages,
        lockerName: lockerAssigned || undefined,
        checkCount,
        frozenNotice,
      });
      setScannedCustomer(null);
      closeLockerModal();
      // broadcast để các trang khác reload
      try {
        const ch = new BroadcastChannel('GYM_ATTENDANCE_CHANNEL');
        ch.postMessage({ type: 'CHECKIN_EVENT' });
        ch.close();
      } catch {}
    } catch (err: any) {
      setLockerError(err.message || 'Gán tủ / xác nhận thất bại');
    } finally {
      setSubmittingLocker(false);
      setTimeout(() => setSuccessAnimation(null), 4000);
    }
  };
  const handleChooseNoLocker = () => completeMemberCheckIn('');
  const handleChooseYesLocker = () => {
    setWantLocker(true);
    loadLockers();
  };
  const handlePickLocker = async (lockerId: string) => {
    if (submittingLocker) return;
    setSubmittingLocker(true);
    setLockerError('');
    try {
      if (scannedCustomer) await completeMemberCheckIn(lockerId);
    } catch (err: any) {
      setLockerError(err.message || 'Gán tủ thất bại');
    } finally {
      setSubmittingLocker(false);
    }
  };

  const clubLockers =
    selectedClub && selectedClub !== 'all' ? lockers.filter((l) => String(l.locationId) === String(selectedClub)) : lockers;
  const lockerPrefixes = Array.from(new Set(clubLockers.map((l) => l.prefix)));
  const filteredLockers = clubLockers.filter(
    (l) => (lockerFilter === 'ALL' || l.prefix === lockerFilter) && (l.status === 'AVAILABLE' || l.status === 'MAINTENANCE')
  );

  return (
    <>
      {/* Modal chọn tủ - hiển thị toàn cục */}
      {lockerModal && scannedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeLockerModal} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Xác nhận check-in</h3>
                <p className="text-xs text-slate-500 mt-0.5">Điểm danh hội viên {(scannedCustomer as any).checkCount ? `• Lần ${(scannedCustomer as any).checkCount} hôm nay` : ''}</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">HV</div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{scannedCustomer.fullName}</p>
                  <p className="text-xs text-slate-400">{scannedCustomer.phone}</p>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">Hội viên</span>
              </div>
              {scannedCustomer.packages.map((p, idx) => (
                <p key={idx} className="text-xs text-slate-500 mt-2">
                  Gói {scannedCustomer.packages.length > 1 ? `${idx + 1} · ` : ''}{p.packageName} · hạn {p.endDate}
                  {typeof p.remainingDays === 'number' ? ` (còn ${p.remainingDays} ngày)` : ''}
                </p>
              ))}
              {(scannedCustomer as any).checkCount && (
                <p className="text-xs font-bold text-emerald-600 mt-2">Lần check-in thứ {(scannedCustomer as any).checkCount} trong hôm nay</p>
              )}
              {(scannedCustomer as any).frozenNotice && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{(scannedCustomer as any).frozenNotice}</p>
                </div>
              )}
            </div>
            {!wantLocker ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Người này có sử dụng tủ đồ không?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleChooseNoLocker}
                    disabled={submittingLocker}
                    className="flex flex-col items-center gap-2 px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-60"
                  >
                    <X className="w-6 h-6" />
                    <span className="font-bold text-sm">Không dùng tủ</span>
                  </button>
                  <button
                    onClick={handleChooseYesLocker}
                    disabled={submittingLocker}
                    className="flex flex-col items-center gap-2 px-6 py-5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-2xl transition-all disabled:opacity-60"
                  >
                    <Lock className="w-6 h-6" />
                    <span className="font-bold text-sm">Có dùng tủ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Chọn tủ trống</p>
                  <button onClick={() => setWantLocker(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
                    ← Quay lại
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setLockerFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${lockerFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Tất cả
                  </button>
                  {lockerPrefixes.map((p) => (
                    <button
                      key={p}
                      onClick={() => setLockerFilter(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${lockerFilter === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Dãy {p}
                    </button>
                  ))}
                </div>
                {lockerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {lockerError}
                  </div>
                )}
                {lockerLoading ? (
                  <div className="p-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin inline" /> <span className="ml-2">Đang tải sơ đồ tủ...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {filteredLockers.length === 0 ? (
                      <div className="col-span-full text-center text-slate-400 py-8 text-sm">Không có tủ trống trong dãy này</div>
                    ) : (
                      filteredLockers.map((locker) => (
                        <button
                          key={locker._id}
                          disabled={submittingLocker || locker.status !== 'AVAILABLE'}
                          onClick={() => handlePickLocker(locker._id)}
                          className={`p-3 rounded-xl border text-left ${locker.status === 'AVAILABLE' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-400' : 'bg-amber-50/70 border-amber-200 opacity-60'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-black text-xs">{locker.lockerNumber}</span>
                            {locker.status === 'AVAILABLE' ? <Unlock className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <p className="text-[10px] font-bold mt-1.5">{locker.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleChooseNoLocker}
                    disabled={submittingLocker}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
                  >
                    Điểm danh không dùng tủ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thông báo check-in/out toàn cục */}
      {successAnimation?.active && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center mx-4 border-t-4 border-t-emerald-500">
            <div className={`w-14 h-14 border-4 rounded-full flex items-center justify-center mb-4 ${successAnimation.isCheckout ? 'bg-blue-50 border-blue-500' : 'bg-emerald-50 border-emerald-500'}`}>
              {successAnimation.isCheckout ? <UserCheck className="w-6 h-6 text-blue-500" /> : <Check className="w-6 h-6 text-emerald-500 stroke-[3]" />}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {successAnimation.isCheckout ? 'Check-out thành công!' : 'Check-in thành công!'}
            </h2>
            <p className="text-base font-extrabold text-purple-700 mt-1">{successAnimation.name}</p>
            <p className="text-xs text-slate-950 font-mono font-bold">Mã: {successAnimation.memberCode}</p>
            {successAnimation.checkCount && (
              <span className="mt-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                Lần {successAnimation.checkCount} hôm nay
              </span>
            )}
            {successAnimation.isCheckout && typeof successAnimation.totalMinutes === 'number' && (
              <p className="text-xs text-slate-600 mt-2">
                Thời gian tại phòng: <b className="text-indigo-600">{Math.floor(successAnimation.totalMinutes / 60)}h{successAnimation.totalMinutes % 60}p</b>
              </p>
            )}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-1 text-left text-xs font-bold">
              {!successAnimation.isCheckout &&
                (successAnimation.packages || []).map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600 font-normal">{p.packageName}:</span>
                    <span className="text-amber-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p.endDate}
                    </span>
                  </div>
                ))}
              {successAnimation.lockerName && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-normal">Tủ đồ:</span>
                  <span className="text-indigo-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {successAnimation.lockerName}
                  </span>
                </div>
              )}
            </div>
            {successAnimation.frozenNotice && !successAnimation.isCheckout && (
              <div className="w-full mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{successAnimation.frozenNotice}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
