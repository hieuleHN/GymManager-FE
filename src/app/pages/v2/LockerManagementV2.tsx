import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Lock, Unlock, AlertTriangle, ShieldCheck, Search, Filter } from 'lucide-react';

interface LockerItem {
    id: string;
    code: string;
    zone: 'NAM' | 'NU' | 'VIP';
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    customerName?: string;
}

export function LockerManagementV2() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZone, setSelectedZone] = useState<string>('ALL');

    const [lockers] = useState<LockerItem[]>([
        { id: '1', code: 'LK-101', zone: 'NAM', status: 'OCCUPIED', customerName: 'Nguyễn Văn A' },
        { id: '2', code: 'LK-102', zone: 'NAM', status: 'AVAILABLE' },
        { id: '3', code: 'LK-103', zone: 'NAM', status: 'MAINTENANCE' },
        { id: '4', code: 'LK-201', zone: 'NU', status: 'OCCUPIED', customerName: 'Trần Thị B' },
        { id: '5', code: 'LK-202', zone: 'NU', status: 'AVAILABLE' },
        { id: '6', code: 'LK-301', zone: 'VIP', status: 'AVAILABLE' },
    ]);

    const filteredLockers = lockers.filter(locker => {
        const matchesSearch = locker.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (locker.customerName && locker.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesZone = selectedZone === 'ALL' || locker.zone === selectedZone;
        return matchesSearch && matchesZone;
    });

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Tủ đồ (Locker V2)</h1>
                        <p className="text-slate-500 text-sm mt-1">Sơ đồ và trạng thái gán tủ đồ thời gian thực</p>
                    </div>
                </div>

                {/* Thanh lọc & Tìm kiếm */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm số tủ hoặc tên khách..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {['ALL', 'NAM', 'NU', 'VIP'].map((zone) => (
                            <button
                                key={zone}
                                onClick={() => setSelectedZone(zone)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedZone === zone
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Khu vực {zone === 'ALL' ? 'Tất cả' : zone}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sơ đồ danh sách Tủ đồ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredLockers.map((locker) => (
                        <div
                            key={locker.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${locker.status === 'AVAILABLE'
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                                : locker.status === 'OCCUPIED'
                                    ? 'bg-slate-900 border-slate-800 text-white'
                                    : 'bg-amber-50/50 border-amber-200 text-amber-900'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-black text-lg">{locker.code}</span>
                                {locker.status === 'AVAILABLE' && <Unlock className="w-5 h-5 text-emerald-500" />}
                                {locker.status === 'OCCUPIED' && <Lock className="w-5 h-5 text-indigo-400" />}
                                {locker.status === 'MAINTENANCE' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                            </div>
                            <div className="mt-4 pt-2 border-t border-current/10">
                                <p className="text-[10px] font-bold opacity-75">Khu: {locker.zone}</p>
                                <p className="text-xs font-semibold truncate mt-0.5">
                                    {locker.status === 'OCCUPIED' ? locker.customerName : locker.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}